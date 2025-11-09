## Bloomlet (macOS Beta)

Calm, minimal menu bar app that shows spontaneous, gentle affirmations.

### Dev

```bash
npm install
npm run dev
```

- Tray shows a flower `🌸` in the macOS menu bar
- Tray menu: Show now, Activate/Pause, Settings, Quit
- Settings: interval, theme, categories, sound, position
- Test: Settings → "Show a test pop-up"

### Build (macOS)

```bash
npm run build
```

Artifacts in `dist/`. After renaming, builds will be named `Bloomlet-*.dmg/zip`.

### Content

- Messages live in `assets/messages.json` (`text`, `category`)

### Preferences

- Stored at `app.getPath('userData')/preferences.json`

