#!/bin/bash

pkgs=(
	"wget"
	"fish"
	"mpv"
	"obsidian"
	"brave-browser"
	"firefox"
	"vscodium"
	"veracrypt"
	"yt-dlp"
        "p7zip"
	"alfred"
	"iterm2"
	"tutanota"
	"audacity"
	"neofetch"
	"rectangle"
	"latest"
	"alt-tab"
)

for i in ${pkgs[@]}; do
	brew install $i;
done

