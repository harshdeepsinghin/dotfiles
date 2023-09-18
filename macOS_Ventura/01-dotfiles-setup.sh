#!/bin/bash


## CREATING DIRECTORIES

mkdir ~/gitrepos
mkdir ~/Pictures/wallpapers

read -p "Have you configured the ssh keys?: " response
if [[ $response == "yes" || $response == "YES" || $response == "y" || $response == "Y" ]]; then
    echo "All Good!"
else
    exit 1
fi


## CLONING GITS
chmod 700 ~/.ssh/
chmod 600 ~/.ssh/id_rsa
git config --global user.name "Harshdeep Singh"
git config --global user.email "94488766+harshdeepsinghin@users.noreply.github.com"
git config --global gpg.format ssh
git config --global commit.gpgsign true
git config --global user.signingkey ~/.ssh/id_rsa.pub
ssh -T git@github.com

cd ~/gitrepos/ && git clone "git@github.com:harshdeepsinghin/dotfiles.git"

## RICING


wget -nc -P ~/Pictures/wallpapers/ https://harshdeepsingh.sirv.com/Wallpapers/green-clouds-open-anime-minimal.png
wget -nc -P ~/Pictures/wallpapers/ https://harshdeepsingh.sirv.com/Wallpapers/blue-mountains-illustration.png

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   WALLPAPER DOWNLOADED   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""


rm ~/.config/fish/config.fish 
ln -s ~/gitrepos/dotfiles/macOS_Ventura/config.fish ~/.config/fish/config.fish

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   FISH CONFIG UPDATED   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""



echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+-+-+
!!!   ALL SET! NOW YOU ARE GOOD TO GO   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+-+-+

"""
