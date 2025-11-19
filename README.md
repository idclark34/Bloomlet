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
npm run build:mac
```

Artifacts in `dist/`. After renaming, builds will be named `Bloomlet-*.dmg/zip`.

### Build (Windows)

Run this on Windows (or in a Windows CI runner):

```bash
npm run build:win
```

Artifacts in `dist/` such as `Bloomlet-<version>-Setup.exe`.

> **Code signing:** set `CSC_LINK` and `CSC_KEY_PASSWORD` to your code-signing certificate before building so Windows SmartScreen trusts the installer.

### Content

- Messages live in `assets/messages.json` (`text`, `category`)

### Preferences

- Stored at `app.getPath('userData')/preferences.json`

