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
    "breeze-icons"
    "pamixer"
    "bluez-utils"
)

paru -S --needed ${pkgs[@]}

