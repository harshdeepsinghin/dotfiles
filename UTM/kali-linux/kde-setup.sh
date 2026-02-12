kwriteconfig6 --file kwinrc --group Compositing --key Enabled false
qdbus6 org.kde.KWin /KWin reconfigure

kwriteconfig6 --file kwinrc --group Plugins --key blurEnabled false
kwriteconfig6 --file kwinrc --group Plugins --key fadeEnabled false
kwriteconfig6 --file kwinrc --group Plugins --key slideEnabled false
kwriteconfig6 --file kwinrc --group Plugins --key maximizeEnabled false
kwriteconfig6 --file kwinrc --group Plugins --key wobblywindowsEnabled false
qdbus6 org.kde.KWin /KWin reconfigure

sudo systemctl disable bluetooth