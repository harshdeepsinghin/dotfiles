echo "Configuring SSH and X11 forwarding..."

systemctl enable sshd
systemctl start sshd

cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%s)

sed -i 's/^#X11Forwarding no/X11Forwarding yes/' /etc/ssh/sshd_config
sed -i 's/^X11Forwarding no/X11Forwarding yes/' /etc/ssh/sshd_config

sed -i 's/^#X11UseLocalhost yes/X11UseLocalhost yes/' /etc/ssh/sshd_config
sed -i 's/^X11UseLocalhost no/X11UseLocalhost yes/' /etc/ssh/sshd_config

sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config

sed -i 's/^#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/^PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config

sed -i 's/^#UsePAM yes/UsePAM yes/' /etc/ssh/sshd_config

systemctl restart sshd

systemctl restart sshd
echo "[✔] SSH configured with X11 forwarding"

echo "Installing X11 utilities for forwarding..."
pacman -S --noconfirm xorg-xauth xorg-xhost xorg-xprop xorg-xrandr xorg-xclock ttf-dejavu ttf-liberation noto-fonts
echo "[✔] X11 utilities installed"

touch /root/.Xauthority
chown root:root /root/.Xauthority
chmod 600 /root/.Xauthority

systemctl restart sshd

IP_ADDR=$(ip -4 addr show scope global | grep inet | awk '{print $2}' | cut -d/ -f1 | head -n1)

echo "[✅] Setup complete! You can now SSH with X11 forwarding:"
echo "ssh -X root@$IP_ADDR"
