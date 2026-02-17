#!/bin/bash
# Builds, signs, and notarizes the macOS release.
# Requires a .env file in the project root with:
#   APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID

set -e

ROOT="$(dirname "$0")/.."

if [ ! -f "$ROOT/.env" ]; then
  echo "Error: .env file not found. Copy .env.example and fill in your credentials."
  exit 1
fi

set -o allexport
source "$ROOT/.env"
set +o allexport

npm run build:mac
