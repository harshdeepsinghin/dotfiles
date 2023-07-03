#!/bin/bash

pkgs=(
    "spectacle"
	"vim-clipboard"
	"xclip"
	"mpv"
	"obsidian"
	"brave"
	"vscodium"
	"veracrypt"
	"yt-dlp"
	"cava"
)

paru -S --needed ${pkgs[@]}

