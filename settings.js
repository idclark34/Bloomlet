(() => {
  const $ = (id) => document.getElementById(id);
  
  function apply(p) {
    $('interval').value = p.interval;
    $('theme').value = p.theme;
    $('fontFamily').value = p.fontFamily || 'system';
    $('comforting').checked = !!p.categories?.comforting;
    $('motivational').checked = !!p.categories?.motivational;
    $('mindfulness').checked = !!p.categories?.mindfulness;
    $('sound').checked = !!p.soundEnabled;
    $('position').value = p.position || 'corner';
  }
  
  window.positiveAPI.onPrefsData((p) => apply(p));
  window.positiveAPI.getPrefs();

  $('save').addEventListener('click', () => {
    const prefs = {
      interval: $('interval').value,
      theme: $('theme').value,
      fontFamily: $('fontFamily').value,
      categories: {
        comforting: $('comforting').checked,
        motivational: $('motivational').checked,
        mindfulness: $('mindfulness').checked,
      },
      soundEnabled: $('sound').checked,
      position: $('position').value,
    };
    window.positiveAPI.savePrefs(prefs);
  });

  $('test').addEventListener('click', () => {
    window.positiveAPI.requestImmediatePopup();
  });
})();


