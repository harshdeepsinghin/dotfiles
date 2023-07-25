# dotfiles

CachyOs ISO Download:
```bash
wget "https://mirror.cachyos.org/ISO/kde/$(curl -s 'https://mirror.cachyos.org/ISO/kde/' | grep 'class="link"' | grep -oP "(?<=href\=\")[^/]+" | sort -r | head -n1)/cachyos-kde-linux-$(curl -s 'https://mirror.cachyos.org/ISO/kde/' | grep 'class="link"' | grep -oP "(?<=href\=\")[^/]+" | sort -r | head -n1).iso"
```
``
The dotfiles for [CachyOS](CachyOS) will work when CachyOs is installed with HyprLand.
