#/bin/bash

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   INSTALLING PACKAGES   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""

# Path to the file containing package names
PACKAGE_FILE="./stems/packages.txt"

# Check if the file exists
if [[ ! -f "$PACKAGE_FILE" ]]; then
    echo "Package list file not found!"
    exit 1
fi

# Read the file and install packages using brew
while read -r package; do
    # Skip empty lines and comments
    [[ -z "$package" || "$package" =~ ^# ]] && continue

    echo "Installing $package..."
    brew install "$package"
done < "$PACKAGE_FILE"

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   PACKAGES INSTALLED   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   RICING (WALLPAPERS, GITHUB AND CONFIGS)   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""

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

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   DONE SETUP-ING GIT (GITHUB)   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""

## RICING

for i in $(curl -s "https://harshdeepsingh.sirv.com/Wallpapers/" | tr " " "\n" | grep "harshdeepsingh.sirv.com/Wallpapers/" | sed -e 's/\(^.*"\)\(.*\)\(".*$\)/\2/' |  cut -c 3-); do wget -nc -P ~/Pictures/wallpapers/ https://$i; done

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   WALLPAPERS DOWNLOADED   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""

rm ~/.config/fish/config.fish 
ln -s ~/gitrepos/dotfiles/macOS/config.fish ~/.config/fish/config.fish
fish -c "fish_add_path opt/homebrew/bin/"
fish -c "fish_update_completions"

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   FISH CONFIG UPDATED   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""

rm ~/.config/zed/settings.json
ln -s ~/gitrepos/dotfiles/macOS/configs/zed/settings.json ~/.config/zed/settings.json

echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+
!!!   ZED CONFIG UPDATED   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+

"""


echo """

+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+-+-+
!!!   ALL SET! NOW YOU ARE GOOD TO GO   !!!
+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+-+-+

"""
