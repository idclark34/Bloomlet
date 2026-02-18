#!/bin/bash
# Builds and signs the Mac App Store package (.pkg).
# Upload the output to App Store Connect via Transporter.
#
# Before running:
#   1. Install "3rd Party Mac Developer Application" cert in Keychain
#   2. Download provisioning profile from developer.apple.com and save
#      to build/Bloomlet_AppStore.provisionprofile
#   3. Create the app listing in App Store Connect

set -e

ROOT="$(dirname "$0")/.."

if [ ! -f "$ROOT/build/Bloomlet_AppStore.provisionprofile" ]; then
  echo "Error: build/Bloomlet_AppStore.provisionprofile not found."
  echo "Download it from developer.apple.com → Profiles."
  exit 1
fi

MAS_BUILDING=1 npm run build:mas

echo ""
echo "Build complete. Upload dist/mas/Bloomlet-*.pkg to App Store Connect via Transporter."
