// scripts/make-icons.js
// Generates all required icon sizes from SVG sources.
// Run with: npm run make-icons
// Requires: npm install sharp --save-dev

import sharp from 'sharp';
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// All sizes required by iconutil for a complete .icns file
const ICONSET = [
  { name: 'icon_16x16.png',      size: 16   },
  { name: 'icon_16x16@2x.png',   size: 32   },
  { name: 'icon_32x32.png',      size: 32   },
  { name: 'icon_32x32@2x.png',   size: 64   },
  { name: 'icon_128x128.png',    size: 128  },
  { name: 'icon_128x128@2x.png', size: 256  },
  { name: 'icon_256x256.png',    size: 256  },
  { name: 'icon_256x256@2x.png', size: 512  },
  { name: 'icon_512x512.png',    size: 512  },
  { name: 'icon_512x512@2x.png', size: 1024 },
];

async function main() {
  const iconSvg  = readFileSync(join(root, 'build', 'icon.svg'));
  const traySvg  = readFileSync(join(root, 'assets', 'trayTemplate.svg'));
  const iconsetDir = join(root, 'build', 'icon.iconset');

  // Clean and recreate iconset directory
  try { rmSync(iconsetDir, { recursive: true }); } catch (_) {}
  mkdirSync(iconsetDir, { recursive: true });

  // --- App icon PNGs ---
  console.log('Generating app icon PNGs...');
  for (const { name, size } of ICONSET) {
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(join(iconsetDir, name));
    console.log(`  ✓ ${name}`);
  }

  // --- .icns file (macOS only) ---
  console.log('Creating icon.icns...');
  const icnsPath = join(root, 'build', 'icon.icns');
  execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`);
  console.log('  ✓ build/icon.icns');

  // Also copy 1024px PNG for electron-builder Windows ICO generation
  await sharp(iconSvg)
    .resize(1024, 1024)
    .png()
    .toFile(join(root, 'build', 'icon.png'));
  console.log('  ✓ build/icon.png');

  // --- Tray icon PNGs ---
  console.log('Generating tray icon PNGs...');
  await sharp(traySvg)
    .resize(16, 16)
    .png()
    .toFile(join(root, 'assets', 'trayTemplate.png'));
  console.log('  ✓ assets/trayTemplate.png (@1x)');

  await sharp(traySvg)
    .resize(32, 32)
    .png()
    .toFile(join(root, 'assets', 'trayTemplate@2x.png'));
  console.log('  ✓ assets/trayTemplate@2x.png (@2x retina)');

  console.log('\nAll icons generated. Run `npm run build:mac` when ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
