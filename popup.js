(() => {
  const root = document.getElementById('root');
  const text = document.getElementById('text');
  const authorEl = document.getElementById('author');
  
  function scaleFontSize(width, height) {
    // Base size 16px at 320x120, scale proportionally
    const baseWidth = 320;
    const baseFontSize = 16;
    const scaleFactor = Math.min(width / baseWidth, height / 120);
    const newSize = Math.max(12, Math.min(32, baseFontSize * scaleFactor));
    text.style.fontSize = `${newSize}px`;
  }

  window.positiveAPI.onPopupMessage(({ message, author, theme, fontFamily, borderRadius }) => {
    root.classList.remove('theme-dark','theme-pastel');
    if (theme === 'dark') root.classList.add('theme-dark');
    if (theme === 'pastel') root.classList.add('theme-pastel');
    document.documentElement.style.setProperty('--radius', `${borderRadius ?? 14}px`);

    // Apply font family
    const fontMap = {
      system: '-apple-system, system-ui, Segoe UI, Roboto, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: '"Courier New", Courier, monospace',
      rounded: '"Comic Sans MS", "Marker Felt", cursive',
      cursive: '"Snell Roundhand", "Brush Script MT", "Apple Chancery", cursive'
    };
    text.style.fontFamily = fontMap[fontFamily] || fontMap.system;

    text.textContent = '';
    authorEl.textContent = author ? `— ${author}` : '';
  });

  window.positiveAPI.onTyping(({ chunk, reset }) => {
    if (reset) text.textContent = '';
    if (typeof chunk === 'string') {
      text.textContent = chunk;
    }
  });

  window.positiveAPI.onResized(({ width, height }) => {
    scaleFontSize(width, height);
  });
  
  // Set initial size on load
  scaleFontSize(window.innerWidth, window.innerHeight);

  // Custom resize handling for all edges
  let isResizing = false;
  let resizeDir = null;
  let startX = 0, startY = 0;
  let startWidth = 0, startHeight = 0;
  let startBoundsX = 0, startBoundsY = 0;

  const minWidth = 240, minHeight = 80, maxWidth = 600, maxHeight = 400;

  document.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', async (e) => {
      isResizing = true;
      resizeDir = [...handle.classList].find(c => c.startsWith('resize-') && c !== 'resize-handle');
      startX = e.screenX;
      startY = e.screenY;
      const bounds = await window.positiveAPI.getWindowBounds();
      startWidth = bounds.width;
      startHeight = bounds.height;
      startBoundsX = bounds.x;
      startBoundsY = bounds.y;
      e.preventDefault();
      e.stopPropagation();
    });
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const dx = e.screenX - startX;
    const dy = e.screenY - startY;

    let newWidth = startWidth;
    let newHeight = startHeight;

    if (resizeDir === 'resize-br' || resizeDir === 'resize-right') newWidth = startWidth + dx;
    if (resizeDir === 'resize-br' || resizeDir === 'resize-bottom') newHeight = startHeight + dy;
    if (resizeDir === 'resize-left') newWidth = startWidth - dx;
    if (resizeDir === 'resize-top') newHeight = startHeight - dy;

    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

    // For left/top handles, move the window so the opposite edge stays fixed
    const newX = resizeDir === 'resize-left' ? startBoundsX + (startWidth - newWidth) : startBoundsX;
    const newY = resizeDir === 'resize-top' ? startBoundsY + (startHeight - newHeight) : startBoundsY;

    window.positiveAPI.resizeWindow(Math.round(newWidth), Math.round(newHeight), Math.round(newX), Math.round(newY));
    scaleFontSize(newWidth, newHeight);
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
    resizeDir = null;
  });
})();


