#!/bin/bash
# Optional macOS launcher; no installation or network downloads.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18.20+ is required. Install a supported Node.js release, then run again."
  read -r -p "Press Enter to close. "
  exit 1
fi
printf '\nStarting MemoryTrail. Open the localhost address printed below.\nUse Control+C to stop the server.\n'
node server.mjs
