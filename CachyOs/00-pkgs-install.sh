#!/bin/bash

pkgs=(
	"vim-clipboard"
	"xclip"
	"mpv"
	"obsidian"
	"brave"
	"vscodium"
	"veracrypt"
	"yt-dlp"
	"cava"
    "spotify-adblock-git"
)

paru -S --needed ${pkgs[@]}

