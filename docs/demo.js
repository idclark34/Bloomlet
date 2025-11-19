(() => {
  const container = document.getElementById('demo-popup-container');
  const popup = document.getElementById('demo-popup');
  const text = document.getElementById('demo-text');
  const showHeaderBtn = document.getElementById('demo-show-header');
  const showHeroBtn = document.getElementById('demo-show-hero');
  
  // Dragging state
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let containerStartX = 0;
  let containerStartY = 0;

  const messages = [
    'Your effort matters.',
    'Small steps compound into big wins.',
    'Breathe. You\'ve got this.',
    'Be kind to yourself today.',
    'Progress over perfection.',
  ];
  const emoji = [' ✧',' ✨',' 💫',' 🌿',' 🌸'];

  function pickMessage() {
    const base = messages[Math.floor(Math.random() * messages.length)];
    const tail = emoji[Math.floor(Math.random() * emoji.length)];
    return base.endsWith(tail.trim()) ? base : base + tail;
  }

  // Default theme: pastel, default font: system
  const fontMap = {
    system: '-apple-system, system-ui, Segoe UI, Roboto, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: '"Courier New", Courier, monospace',
    rounded: '"Comic Sans MS", "Marker Felt", cursive'
  };
  
  text.style.fontFamily = fontMap.system;

  let typingTimer = null;
  // Exact typing logic from the app's popup.js
  function typeInto(el, content, onDone) {
    if (typingTimer) clearTimeout(typingTimer);
    el.textContent = '';
    let i = 0;
    const step = () => {
      i += 1;
      el.textContent = content.slice(0, i);
      if (i < content.length) {
        const jitter = Math.floor(Math.random() * 60) - 20; // -20..+40ms
        const base = 45;
        typingTimer = setTimeout(step, Math.max(20, base + jitter));
      } else if (onDone) {
        onDone();
      }
    };
    typingTimer = setTimeout(step, 45);
  }

  function showDemoPopup() {
    const msg = pickMessage();
    
    // Show container
    container.style.display = 'block';
    popup.style.opacity = '0';
    popup.style.transform = 'translateY(8px)';
    popup.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    
    // Force reflow to ensure transition applies
    popup.offsetHeight;
    
    // Fade in via transition
    popup.style.opacity = '1';
    popup.style.transform = 'translateY(0px)';
    
    // Start typing after fade in completes
    setTimeout(() => {
      typeInto(text, msg, () => {
        // Display for 5-7 seconds then fade out
        const displayTime = 5000 + Math.floor(Math.random() * 2000);
        setTimeout(() => {
          fadeOut();
        }, displayTime);
      });
    }, 250);

    function fadeOut() {
      popup.style.opacity = '0';
      popup.style.transform = 'translateY(8px)';
      setTimeout(() => {
        container.style.display = 'none';
      }, 250);
    }
  }
  
  // Dragging functionality
  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    containerStartX = container.offsetLeft;
    containerStartY = container.offsetTop;
    container.classList.add('dragging');
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    
    container.style.left = (containerStartX + deltaX) + 'px';
    container.style.top = (containerStartY + deltaY) + 'px';
    container.style.bottom = 'auto';
    container.style.right = 'auto';
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
    container.classList.remove('dragging');
  });

  if (showHeaderBtn) showHeaderBtn.addEventListener('click', showDemoPopup);
  if (showHeroBtn) showHeroBtn.addEventListener('click', showDemoPopup);
})();

