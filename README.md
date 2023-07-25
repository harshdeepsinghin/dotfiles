# dotfiles

## CachyOS

NOTE: The dotfiles for [CachyOS](CachyOS) will work when CachyOs is installed with HyprLand.

CachyOs ISO Download:
```bash
wget "https://mirror.cachyos.org/ISO/kde/$(curl -s 'https://mirror.cachyos.org/ISO/kde/' | grep 'class="link"' | grep -oP "(?<=href\=\")[^/]+" | sort -r | head -n1)/cachyos-kde-linux-$(curl -s 'https://mirror.cachyos.org/ISO/kde/' | grep 'class="link"' | grep -oP "(?<=href\=\")[^/]+" | sort -r | head -n1).iso"
```

Run these lines:
```bash
wget -O - https://raw.githubusercontent.com/harshdeepcodes/dotfiles/main/CachyOS/00-pkgs-install.sh | bash
wget -O - https://raw.githubusercontent.com/harshdeepcodes/dotfiles/main/CachyOS/01-dotfiles-setup.sh | bash

```
