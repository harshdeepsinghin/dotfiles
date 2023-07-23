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
    "dolphin"
    "ffmpegthumbs"
    "breeze-icons"
    "pamixer"
    "bluez-utils"
    "nomacs"
    "p7zip"
)

paru -S --needed ${pkgs[@]}

