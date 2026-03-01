(() => {
  const $ = (id) => document.getElementById(id);
  let customMessages = [];

  function renderCustomList() {
    const ul = $('custom-list');
    ul.innerHTML = '';
    customMessages.forEach((text, i) => {
      const li = document.createElement('li');
      li.style.cssText = 'display:flex;align-items:center;gap:6px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:13px';
      const span = document.createElement('span');
      span.style.cssText = 'flex:1;color:#0f172a';
      span.textContent = text;
      const del = document.createElement('button');
      del.textContent = '×';
      del.title = 'Remove';
      del.style.cssText = 'background:none;border:none;cursor:pointer;font-size:16px;color:#94a3b8;padding:0 2px;line-height:1';
      del.addEventListener('click', () => {
        customMessages.splice(i, 1);
        renderCustomList();
      });
      li.append(span, del);
      ul.appendChild(li);
    });
  }

  function apply(p) {
    $('userName').value = p.userName || '';
    $('interval').value = p.interval;
    const dur = p.popupDuration ?? 5;
    $('popupDuration').value = dur;
    $('popupDurationLabel').textContent = dur === 1 ? '1 second' : `${dur} seconds`;
    $('theme').value = p.theme;
    $('fontFamily').value = p.fontFamily || 'system';
    $('comforting').checked = !!p.categories?.comforting;
    $('motivational').checked = !!p.categories?.motivational;
    $('mindfulness').checked = !!p.categories?.mindfulness;
    $('quotes').checked = p.categories?.quotes !== false;
    $('position').value = p.position || 'corner';
    $('popupSize').value = p.popupSizePreset || 'medium';
    const opacity = Math.round((p.popupOpacity ?? 1) * 100);
    $('popupOpacity').value = opacity;
    $('popupOpacityLabel').textContent = `${opacity}%`;
    customMessages = Array.isArray(p.customMessages) ? [...p.customMessages] : [];
    renderCustomList();
  }

  window.positiveAPI.onPrefsData((p) => apply(p));
  window.positiveAPI.getPrefs();

  $('popupDuration').addEventListener('input', () => {
    const v = Number($('popupDuration').value);
    $('popupDurationLabel').textContent = v === 1 ? '1 second' : `${v} seconds`;
  });

  $('popupOpacity').addEventListener('input', () => {
    $('popupOpacityLabel').textContent = `${$('popupOpacity').value}%`;
  });

  $('custom-add').addEventListener('click', () => {
    const input = $('custom-input');
    const text = input.value.trim();
    if (!text) return;
    customMessages.push(text);
    input.value = '';
    renderCustomList();
  });

  $('custom-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('custom-add').click();
  });

  const sizePresets = {
    small:  { width: 260, height: 100 },
    medium: { width: 320, height: 120 },
    large:  { width: 420, height: 160 },
  };

  $('save').addEventListener('click', () => {
    const sizePreset = $('popupSize').value;
    const prefs = {
      userName: $('userName').value.trim(),
      interval: $('interval').value,
      popupDuration: Number($('popupDuration').value),
      theme: $('theme').value,
      fontFamily: $('fontFamily').value,
      categories: {
        comforting: $('comforting').checked,
        motivational: $('motivational').checked,
        mindfulness: $('mindfulness').checked,
        quotes: $('quotes').checked,
      },
      position: $('position').value,
      popupOpacity: Number($('popupOpacity').value) / 100,
      popupSizePreset: sizePreset,
      popupSize: sizePresets[sizePreset],
      customMessages,
    };
    window.positiveAPI.savePrefs(prefs);
  });

})();


