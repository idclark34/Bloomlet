import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

const isMac = process.platform === 'darwin';
let tray = null;
let popupWindow = null;
let settingsWindow = null;
let isActive = true;

// Use app.getAppPath() for packaged apps, falls back to cwd for dev
const appPath = app.isPackaged ? app.getAppPath() : process.cwd();
const messagesPath = path.join(appPath, 'assets', 'messages.json');

const defaultPrefs = {
  interval: '60m', // options: 30m, 60m, 120m, random
  theme: 'pastel', // light | dark | pastel
  categories: {
    comforting: true,
    motivational: true,
    mindfulness: true,
  },
  soundEnabled: false,
  position: 'corner', // corner | center
  popupPosition: null, // { x, y } remembered from user dragging
  popupSize: { width: 320, height: 120 }, // user's preferred size
  fontFamily: 'system', // system | serif | mono | rounded
};

function loadPrefs() {
  try {
    const appDir = app.getPath('userData');
    const prefsPath = path.join(appDir, 'preferences.json');
    if (fs.existsSync(prefsPath)) {
      const raw = fs.readFileSync(prefsPath, 'utf-8');
      return { ...defaultPrefs, ...JSON.parse(raw) };
    }
  } catch (_) {}
  return { ...defaultPrefs };
}

function savePrefs(prefs) {
  try {
    const appDir = app.getPath('userData');
    const prefsPath = path.join(appDir, 'preferences.json');
    fs.mkdirSync(appDir, { recursive: true });
    fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2));
  } catch (err) {
    console.error('Failed to save preferences', err);
  }
}

function loadMessages() {
  try {
    const raw = fs.readFileSync(messagesPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load messages', err);
    return [];
  }
}

let prefs = defaultPrefs;
let allMessages = [];
let schedulerTimer = null;

function pickNextDelayMs() {
  switch (prefs.interval) {
    case '30m':
      return 30 * 60 * 1000;
    case '60m':
      return 60 * 60 * 1000;
    case '120m':
      return 2 * 60 * 60 * 1000;
    case 'random': {
      // random between 60 and 120 minutes
      const min = 60 * 60 * 1000;
      const max = 2 * 60 * 60 * 1000;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    default:
      return 60 * 60 * 1000;
  }
}

function filteredMessages() {
  const enabledCats = Object.entries(prefs.categories)
    .filter(([, on]) => on)
    .map(([k]) => k);
  const list = allMessages.filter((m) => enabledCats.includes(m.category));
  return list.length ? list : allMessages;
}

function pickRandomMessage(preferCategory) {
  const list = filteredMessages();
  if (!list.length) return null;
  if (preferCategory) {
    const subset = list.filter((m) => m.category === preferCategory);
    if (subset.length) {
      const sidx = Math.floor(Math.random() * subset.length);
      return subset[sidx];
    }
  }
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

function createPopupWindow() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  const winWidth = prefs.popupSize?.width || 320;
  const winHeight = prefs.popupSize?.height || 120;
  let x = Math.round(width - winWidth - 24);
  let y = Math.round(height - winHeight - 24);

  if (prefs.popupPosition && Number.isFinite(prefs.popupPosition.x) && Number.isFinite(prefs.popupPosition.y)) {
    x = prefs.popupPosition.x;
    y = prefs.popupPosition.y;
  } else if (prefs.position === 'center') {
    x = Math.round((width - winWidth) / 2);
    y = Math.round((height - winHeight) / 2);
  }

  popupWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x,
    y,
    frame: false,
    transparent: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: true,
    minWidth: 240,
    minHeight: 80,
    maxWidth: 600,
    maxHeight: 400,
    movable: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(appPath, 'preload.js'),
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  popupWindow.loadFile(path.join(appPath, 'popup.html'));
  popupWindow.on('closed', () => {
    popupWindow = null;
  });

  const persistPosition = () => {
    if (!popupWindow) return;
    const { x: bx, y: by } = popupWindow.getBounds();
    prefs.popupPosition = { x: bx, y: by };
    savePrefs(prefs);
  };
  
  const persistSize = () => {
    if (!popupWindow) return;
    const { width: w, height: h } = popupWindow.getBounds();
    prefs.popupSize = { width: w, height: h };
    savePrefs(prefs);
    // Notify renderer to recalculate font size
    popupWindow.webContents.send('popup-resized', { width: w, height: h });
  };

  // On macOS, 'moved' fires when move ends; on others, 'move' fires continuously
  popupWindow.on('moved', persistPosition);
  popupWindow.on('move', persistPosition);
  popupWindow.on('resized', persistSize);
  popupWindow.on('resize', persistSize);
}

function showPopup(options = {}) {
  if (!isActive) return;
  if (!popupWindow) createPopupWindow();
  const msg = pickRandomMessage(options.preferCategory);
  if (!msg) return;

  popupWindow.setOpacity(0);
  popupWindow.showInactive();
  const deliver = () => {
    if (!popupWindow) return;
    popupWindow.webContents.send('popup-message', { message: msg.text, theme: prefs.theme, fontFamily: prefs.fontFamily });
    // Stream typing from main to renderer
    let i = 0;
    const full = msg.text;
    const step = () => {
      if (!popupWindow) return;
      i += 1;
      popupWindow.webContents.send('popup-typing', { chunk: full.slice(0, i), reset: i === 1 });
      if (i < full.length) {
        const jitter = Math.floor(Math.random() * 60) - 20; // -20..+40ms
        const base = 45;
        setTimeout(step, Math.max(20, base + jitter));
      }
    };
    setTimeout(step, 45);
  };
  if (popupWindow.webContents.isLoadingMainFrame()) {
    popupWindow.webContents.once('did-finish-load', deliver);
  } else {
    popupWindow.webContents.once('did-finish-load', deliver);
    popupWindow.webContents.reloadIgnoringCache();
  }

  // Fade in
  let opacity = 0;
  const step = 0.08;
  const fadeIn = setInterval(() => {
    opacity += step;
    popupWindow && popupWindow.setOpacity(Math.min(opacity, 1));
    if (opacity >= 1) {
      clearInterval(fadeIn);
      // Test popups stay longer (15s), regular popups fade after 5-7s
      const displayTime = options.isTest ? 15000 : 5000 + Math.floor(Math.random() * 2000);
      setTimeout(() => fadeOut(), displayTime);
    }
  }, 16);

  function fadeOut() {
    let o = 1;
    const fade = setInterval(() => {
      o -= step;
      if (popupWindow) popupWindow.setOpacity(Math.max(o, 0));
      if (o <= 0) {
        clearInterval(fade);
        if (popupWindow) popupWindow.hide();
      }
    }, 16);
  }
}

function startScheduler() {
  stopScheduler();
  if (!isActive) return;
  const delay = pickNextDelayMs();
  schedulerTimer = setTimeout(() => {
    showPopup();
    startScheduler();
  }, delay);
}

function stopScheduler() {
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }
}

function createTray() {
  const iconPath = path.join(appPath, 'assets', 'trayTemplate.png');
  let image = nativeImage.createFromPath(iconPath);
  if (image.isEmpty()) {
    // Fallback to a minimal 1x1 template image to ensure Tray initializes
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAOjf7iEAAAAASUVORK5CYII=';
    image = nativeImage.createFromDataURL(dataUrl);
    image.setTemplateImage(true);
  }
  tray = new Tray(image);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show now',
      click: () => {
        showPopup({ preferCategory: 'motivational', isTest: true });
      },
    },
    {
      label: isActive ? 'Pause' : 'Activate',
      type: 'normal',
      click: () => {
        isActive = !isActive;
        if (isActive) startScheduler(); else stopScheduler();
        createTray();
      },
    },
    {
      label: 'Settings…',
      click: openSettings,
    },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' },
  ]);
  tray.setToolTip('Bloomlet');
  tray.setContextMenu(contextMenu);
  if (isMac) {
    try { tray.setTitle('🌸'); } catch (_) {}
  }
}

function openSettings() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 420,
    height: 520,
    resizable: false,
    title: 'Settings',
    modal: false,
    webPreferences: {
      preload: path.join(appPath, 'preload.js'),
      contextIsolation: true,
    },
  });
  settingsWindow.loadFile(path.join(appPath, 'settings.html'));
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function ready() {
  prefs = loadPrefs();
  allMessages = loadMessages();
  console.log('Loaded messages:', allMessages.length);
  console.log('Preferences:', prefs);
  createTray();
  // Show a welcome popup shortly after launch
  setTimeout(() => {
    console.log('Showing initial popup...');
    showPopup();
  }, 3000); // 3 seconds after app starts
  startScheduler();
}

app.whenReady().then(ready);

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});

ipcMain.on('prefs-get', (event) => {
  event.sender.send('prefs-data', prefs);
});

ipcMain.on('prefs-save', (_event, newPrefs) => {
  prefs = { ...prefs, ...newPrefs };
  savePrefs(prefs);
  startScheduler();
  // Close popup so next one shows with new settings
  if (popupWindow) {
    popupWindow.close();
    popupWindow = null;
  }
});

ipcMain.on('popup-request', () => {
  showPopup({ preferCategory: 'motivational', isTest: true });
});

ipcMain.on('popup-resize', (_event, { width, height, deltaX, deltaY }) => {
  if (popupWindow) {
    const bounds = popupWindow.getBounds();
    // When resizing from top or left, adjust position to keep opposite edge fixed
    const newBounds = {
      x: bounds.x - (deltaX || 0),
      y: bounds.y - (deltaY || 0),
      width,
      height,
    };
    popupWindow.setBounds(newBounds);
  }
});

ipcMain.handle('popup-get-bounds', () => {
  if (popupWindow) {
    return popupWindow.getBounds();
  }
  return { x: 0, y: 0, width: 320, height: 120 };
});


