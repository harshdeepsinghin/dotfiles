#!/bin/bash

# Fetch the latest Termux release from GitHub API
echo "Fetching latest Termux APK link from GitHub..."

latest_url=$(curl -s https://api.github.com/repos/termux/termux-app/releases/latest \
  | grep "browser_download_url" \
  | grep "arm64-v8a\.apk" \
  | cut -d '"' -f 4)

if [ -n "$latest_url" ]; then
  echo "✅ Latest Termux APK (arm64):"
  wget "$latest_url"
else
  echo "❌ Could not fetch the latest Termux APK URL."
fi
