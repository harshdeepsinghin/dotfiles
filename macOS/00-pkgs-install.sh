#!/bin/bash

pkgs=(
	"ente-auth"
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
    "fzf"
	"alt-tab"
	"anki"
	"notion"
	"notion-calendar"
	"coreutils"
)

for i in ${pkgs[@]}; do
	brew install $i;
done

