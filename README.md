
# dotfiles

Collection of configuration files, helper scripts and small utilities used across several systems I maintain.

This repository contains OS-specific configuration (macOS, CachyOS, ArchLinux) and miscellaneous helper scripts for tasks such as installing packages and working with Android APKs.

**Repository Layout**
- `macOS/`: macOS-specific configs and installation scripts (fish, iTerm, vim, Zed settings).
- `CachyOS/`: configs and install scripts for CachyOS (installer scripts, Hyprland/Wayland configs).
- `ArchLinux/`: small install/setup scripts for Arch-based installs.
- `CrDroid_vayu/`: collection of scripts and backups used when building/flashing or preparing a CrDroid device. NOTE: this subproject is currently archived/paused — the device is unavailable and scripts are kept for reference only; they are not actively maintained.
- `README.md`: this file.

**Quick summary of notable scripts**
- `macOS/scripts/setup.sh`: macOS bootstrap script (installs packages, config files).
- `CachyOS/00-pkgs-install.sh` and `01-dotfiles-setup.sh`: package installation and dotfiles setup for CachyOS.
- `ArchLinux/scripts/step1.sh`, `step2.sh`: small step scripts for an Arch-based setup.

**Usage examples**
- Most scripts are one-off helpers for bootstrap and configuration. Note that `CrDroid_vayu/` scripts are archived and not actively maintained; use them for reference only.

- Example (macOS bootstrap):

	`chmod +x macOS/scripts/setup.sh`
	`./macOS/scripts/setup.sh`

**Contribution & License**
- This is a personal dotfiles repository. If you want to contribute or suggest improvements, open an issue or a pull request.

