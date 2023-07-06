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
ln -s ~/gitrepos/dotfiles/CachyOs/hyprland.conf ~/.config/hypr/hyprland.conf

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   HYPRLAND CONFIG UPDATED   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""

#rm ~/.config/waybar/config-hypr
#ln -s ~/gitrepos/dotfiles/CachyOs/config-hypr ~/.config/waybar/config-hypr

#echo """

#+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
#!!!   WAYBAR CONFIG UPDATED   !!!
#+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

#"""

sudo rm /usr/share/cachyos-fish-config/cachyos-config.fish
sudo ln -s ~/gitrepos/dotfiles/CachyOs/cachyos-config.fish  /usr/share/cachyos-fish-config/cachyos-config.fish

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   FISH CONFIG UPDATED   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""


sudo rm /etc/vimrc
sudo ln -s ~/gitrepos/dotfiles/CachyOs/vimrc /etc/vimrc

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   VIM CONFIG UPDATED   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""
