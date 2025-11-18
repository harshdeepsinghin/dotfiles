#!/bin/bash
set -e

NAME="$NAME"
PASSWORD="password"

# Step 1: Update Arch ARM mirrorlist (closest to India, use mirrors.kernel.org + Fosshub)
cat <<EOF | tee /etc/pacman.d/mirrorlist
Server = http://mirror.archlinuxarm.org/\$arch/\$repo
Server = http://sg.mirror.archlinuxarm.org/\$arch/\$repo
Server = http://mirror.osbeck.com/archlinuxarm/\$arch/\$repo
EOF

echo "[✔] Mirrorlist updated"

# Step 2: Update system
pacman -Syyu --noconfirm
echo "[✔] System updated"

pacman -S vim sudo --noconfirm

# Step 3: Remove default 'alarm' user
if id "alarm" &>/dev/null; then
    userdel -r alarm || true
    echo "[✔] User 'alarm' removed"
fi

# Step 4: Add new user '$NAME'
if ! id "$NAME" &>/dev/null; then
    useradd -m -G wheel -s /bin/bash $NAME
    echo "$NAME:$PASSWORD" | chpasswd
    echo "[✔] User '$NAME' created with default password 'password'"
fi

