(() => {
  const root = document.getElementById('root');
  const text = document.getElementById('text');
  
  function scaleFontSize(width, height) {
    // Base size 16px at 320x120, scale proportionally
    const baseWidth = 320;
    const baseFontSize = 16;
    const scaleFactor = Math.min(width / baseWidth, height / 120);
    const newSize = Math.max(12, Math.min(32, baseFontSize * scaleFactor));
    text.style.fontSize = `${newSize}px`;
  }

  window.positiveAPI.onPopupMessage(({ message, theme, fontFamily }) => {
    root.classList.remove('theme-dark','theme-pastel');
    if (theme === 'dark') root.classList.add('theme-dark');
    if (theme === 'pastel') root.classList.add('theme-pastel');
    
    // Apply font family
    const fontMap = {
      system: '-apple-system, system-ui, Segoe UI, Roboto, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: '"Courier New", Courier, monospace',
      rounded: '"Comic Sans MS", "Marker Felt", cursive'
    };
    text.style.fontFamily = fontMap[fontFamily] || fontMap.system;
    
    text.textContent = '';
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
  let resizeDirection = null;
  let startX = 0, startY = 0;
  let startWidth = 0, startHeight = 0;

  const minWidth = 240, minHeight = 80, maxWidth = 600, maxHeight = 400;

  document.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', async (e) => {
      isResizing = true;
      
      startX = e.screenX;
      startY = e.screenY;
      const bounds = await window.positiveAPI.getWindowBounds();
      startWidth = bounds.width;
      startHeight = bounds.height;
      
      e.preventDefault();
      e.stopPropagation();
    });
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const deltaX = e.screenX - startX;
    const deltaY = e.screenY - startY;
    
    // Scale proportionally - use the larger delta to maintain aspect ratio
    const delta = Math.max(deltaX, deltaY);
    
    let newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
    let newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + delta));

    window.positiveAPI.resizeWindow(Math.round(newWidth), Math.round(newHeight), 0, 0);
    scaleFontSize(newWidth, newHeight);
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
    resizeDirection = null;
  });
})();


