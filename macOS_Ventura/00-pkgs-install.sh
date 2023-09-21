#!/bin/bash

pkgs=(
	"wget"
	"fish"
	"mpv"
	"obsidian"
	"brave-browser"
	"vscodium"
	"veracrypt"
	"yt-dlp"
        "p7zip"
	"alfred"
	"iterm2"
	"tutanota"
)

for i in ${pkgs[@]}; do
	brew install $i;
done

