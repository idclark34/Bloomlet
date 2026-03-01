const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('positiveAPI', {
  onPopupMessage: (handler) => ipcRenderer.on('popup-message', (_e, payload) => handler(payload)),
  onTyping: (handler) => ipcRenderer.on('popup-typing', (_e, payload) => handler(payload)),
  onResized: (handler) => ipcRenderer.on('popup-resized', (_e, payload) => handler(payload)),
  requestImmediatePopup: () => ipcRenderer.send('popup-request'),
  getPrefs: () => ipcRenderer.send('prefs-get'),
  onPrefsData: (handler) => ipcRenderer.on('prefs-data', (_e, data) => handler(data)),
  savePrefs: (prefs) => ipcRenderer.send('prefs-save', prefs),
  resizeWindow: (width, height, x, y) => ipcRenderer.send('popup-resize', { width, height, x, y }),
  moveWindow: (dx, dy) => ipcRenderer.send('popup-move', { dx, dy }),
  dismissPopup: () => ipcRenderer.send('popup-dismiss'),
  getWindowBounds: () => ipcRenderer.invoke('popup-get-bounds'),
});



