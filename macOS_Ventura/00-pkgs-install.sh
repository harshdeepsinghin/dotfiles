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
	"zsh-syntax-highlighting"
	"zsh-autosuggestion"s
)

for i in ${pkgs[@]}; do
	brew install $i;
done

