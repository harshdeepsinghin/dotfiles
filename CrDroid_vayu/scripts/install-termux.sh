#!/bin/bash

echo "📥 Fetching the latest Termux APK URL..."

# Get latest Termux arm64-v8a APK URL from GitHub
APK_URL=$(curl -s https://api.github.com/repos/termux/termux-app/releases/latest \
  | grep "browser_download_url" \
  | grep "arm64-v8a\.apk" \
  | cut -d '"' -f 4)

if [ -z "$APK_URL" ]; then
  echo "❌ Could not find the latest Termux APK URL."
  exit 1
fi

echo "✅ Found APK URL:"
echo "$APK_URL"

# Download the APK
APK_NAME="termux-latest.apk"
echo "⬇️ Downloading APK as $APK_NAME..."
curl -L -o "$APK_NAME" "$APK_URL"

# Check if adb is available
if ! command -v adb &> /dev/null; then
  echo "❌ adb is not installed. Please install Android Platform Tools."
  exit 1
fi

# Check device connection
echo "🔌 Checking for connected Android device..."
adb devices

# Wait for user confirmation
read -p "Press Enter to install Termux on the connected device..."

# Install APK via adb
echo "📲 Installing Termux on your device..."
adb install -r "$APK_NAME"

# Clean up
rm "$APK_NAME"

echo "✅ Termux installed successfully!"
