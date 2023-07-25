#!/bin/bash


## CREATING DIRECTORIES

mkdir ~/gitrepos
mkdir ~/Pictures/wallpapers


## CLONING GITS
git clone "git@github.com:harshdeepcodes/dotfiles.git" ~/gitrepos/


## RICING


sudo rm -r /usr/share/wallpapers
wget -nc -P ~/Pictures/wallpapers/ https://harshdeepsingh.sirv.com/Wallpapers/green-clouds-open-anime-minimal.png
wget -nc -P ~/Pictures/wallpapers/ https://harshdeepsingh.sirv.com/Wallpapers/blue-mountains-illustration.png

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   WALLPAPER SETTED   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""


rm ~/.config/hypr/hyprland.conf
ln -s ~/gitrepos/dotfiles/CachyOS/hyprland.conf ~/.config/hypr/hyprland.conf

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   HYPRLAND CONFIG UPDATED   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""

rm ~/.config/waybar/config-hypr
rm ~/.config/waybar/style.css
ln -s ~/gitrepos/dotfiles/CachyOS/config-hypr ~/.config/waybar/config-hypr
ln -s ~/gitrepos/dotfiles/CachyOS/style.css ~/.config/waybar/style.css

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   WAYBAR CONFIG UPDATED   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""

sudo rm /usr/share/cachyos-fish-config/cachyos-config.fish
sudo ln -s ~/gitrepos/dotfiles/CachyOS/cachyos-config.fish  /usr/share/cachyos-fish-config/cachyos-config.fish

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   FISH CONFIG UPDATED   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""


sudo rm /etc/vimrc
sudo ln -s ~/gitrepos/dotfiles/CachyOS/vimrc /etc/vimrc

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   VIM CONFIG UPDATED   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""
