adb shell settings put system screen_off_timeout 600000 # 10 minutes

# Set the default launcher to OlauncherCF
adb shell pm set-home-activity app.olaunchercf/.MainActivity

# Gives the latest download link from fdroid package page
curl "$URL" | grep -s ".apk" | sed -e 's/\(^.*"\)\(.*\)\(".*$\)/\2/' | grep -s ".apk" | head -n 1

# Gives the fdroid page of first search in fdroid
curl "https://search.f-droid.org/?q=$APP&lang=en" | grep "package-header" | sed -e 's/\(^.*href\="\)\(.*\)\(".*$\)/\2/' | head -n 1


curl "https://f-droid.org/en/packages/com.beemdevelopment.aegis/" | grep -s ".apk" | sed -e 's/\(^.*"\)\(.*\)\(".*$\)/\2/' | grep -s ".apk" | head -n 1
