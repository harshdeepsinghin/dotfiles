neofetch

# CUSTOM PATHS

## configs
set -gx fishconfig ~/gitrepos/dotfiles/macOS/config.fish
set -gx vimconfig ~/gitrepos/dotfiles/macOS/vimrc

## folders
set -gx macrepo ~/gitrepos/dotfiles/macOS
set -gx btech ~/Obsidian/mywellness/3_Pillars_of_Life/Wisdom/Academics/BTECH


# CUSTOM ALIASES

alias tarnow='tar -acf '
alias untar='tar -zxvf '
alias wget='wget -c '
alias pipin="pip install $1"
alias pip3in="pip3 install $1"
alias pipun="pip uninstall $1"
alias pip3un="pip3 uninstall $1"
alias pwdc="pwd | pbcopy"
alias pyhs="echo IP: $(ipconfig getifaddr en0) && python3 -m http.server"
alias getip="ipconfig getifaddr en0"
alias clsradio="mpv --no-video https://live.musopen.org:8085/streamvbr0"
alias lofiradio="mpv --no-video https://www.youtube.com/c/LofiGirl"
alias adbbkp="adb backup -apk -shared -all -f backup.ab"
alias code="codium $argv"
alias mkcd="mkdir $argv && cd $argv"
alias sleepoff="sudo pmset -a disablesleep 1"
alias sleepon="sudo pmset -a disablesleep 0"


## CUSTOM FUNCTIONS


function gitc
    set S (pbpaste)

    if string match -q '*github.com*' $S
        git clone $S ~/gitrepos/(basename -s .git $S)
        if [ $status -ne 0 ]
            set REPO "https://github.com/$(echo $S | grep -o "(?<=github\.com/)[^/]+/[^/]+" | head -n1).git"
            set FOLDER $(basename $S)
            set CLONED_FOLDER $(basename -s .git $REPO)

            git clone $REPO
            if [ $status = 0 ]
                mv $(find $CLONED_FOLDER -type d -name $FOLDER) .
                yes | rm -r $CLONED_FOLDER
            end
        end
    else
        echo "Copy a Github URL!!!"
    end
end

function gitpush
    set S $(printf '%s' "$argv")
    git add .
    git commit -m "$S"
    git push origin
end


function amazon
    set S $(printf '%s' "$argv" | tr ' ' '+')
    open -na "Brave Browser" --args --incognito "https://www.amazon.in/s?k="$S""
end

function bpsh
    set S $(printf '%s' "$argv")
    echo "#!/bin/bash" >$S && vim $S
end

function bppy
    set S $(printf '%s' "$argv")
    echo "#!/bin/python" >$S && vim $S
end

function anonyt
    set S $(printf '%s' "$argv" | tr ' ' '+')
    open -na "Brave Browser" --args --incognito "https://www.youtube.com/results?search_query=$S"
end


function ytm
    set S $(printf '%s' "$argv" | sed -e 's/ /+/g')
    set LINK "https://www.youtube.com$(curl -s "https://vid.puffyan.us/search?q=$S+lyrical+audio" | grep -s -Eo "/watch\?v=.{11}" | sed -n '1p')"
    set TITLE $(wget -qO- "$LINK" | perl -l -0777 -ne 'print $1 if /<title.*?>\s*(.*?)(?: - youtube)?\s*<\/title/si')
    echo "

---X---X---X---X---X---X---X---X---

$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)$(tput setaf 3) "$TITLE" $(tput sgr 0)$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)

$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0) $(tput setaf 1)$(tput setab 7) "$LINK" $(tput sgr 0) $(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)

---X---X---X---X---X---X---X---X---

"
    mpv --no-video "$LINK"
end

function ytmusic
    set Q true
    while [ $Q = 'true' ]
        set K $(read)
        if [ $K = "exit" ]
            set Q false
        else
            ytm "$K"
        end
    end
end
function ytmax
    set S $(printf '%s' "$argv" | sed -e 's/ /+/g')
    set LINK "https://www.youtube.com$(curl -s "https://vid.puffyan.us/search?q=$S" | grep -s -Eo "/watch\?v=.{11}" | sed -n '1p')"
    set TITLE $(wget -qO- "$LINK" | perl -l -0777 -ne 'print $1 if /<title.*?>\s*(.*?)(?: - youtube)?\s*<\/title/si')
    echo "

---X---X---X---X---X---X---X---X---

$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)$(tput setaf 3) "$TITLE" $(tput sgr 0)$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)

$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0) $(tput setaf 1)$(tput setab 7) "$LINK" $(tput sgr 0) $(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)

---X---X---X---X---X---X---X---X---

"
    mpv "$LINK"
end

function ytuhd
    set S $(printf '%s' "$argv" | sed -e 's/ /+/g')
    set LINK "https://www.youtube.com$(curl -s "https://vid.puffyan.us/search?q=$S" | grep -s -Eo "/watch\?v=.{11}" | sed -n '1p')"
    set TITLE $(wget -qO- "$LINK" | perl -l -0777 -ne 'print $1 if /<title.*?>\s*(.*?)(?: - youtube)?\s*<\/title/si')
    echo "

---X---X---X---X---X---X---X---X---

$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)$(tput setaf 3) "$TITLE" $(tput sgr 0)$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)

$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0) $(tput setaf 1)$(tput setab 7) "$LINK" $(tput sgr 0) $(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)

---X---X---X---X---X---X---X---X---

"
    mpv --ytdl-format="bestvideo[ext=mp4][height<=?2160]+bestaudio" "$LINK"

end

function ytfhd
    set S $(printf '%s' "$argv" | sed -e 's/ /+/g')
    set LINK "https://www.youtube.com$(curl -s "https://vid.puffyan.us/search?q=$S" | grep -s -Eo "/watch\?v=.{11}" | sed -n '1p')"
    set TITLE $(wget -qO- "$LINK" | perl -l -0777 -ne 'print $1 if /<title.*?>\s*(.*?)(?: - youtube)?\s*<\/title/si')
    echo "

---X---X---X---X---X---X---X---X---

$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)$(tput setaf 3) "$TITLE" $(tput sgr 0)$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)

$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0) $(tput setaf 1)$(tput setab 7) "$LINK" $(tput sgr 0) $(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)

---X---X---X---X---X---X---X---X---

"
    mpv --ytdl-format="bestvideo[ext=mp4][height<=?1080]+bestaudio" "$LINK"

end


function ythd
    set S $(printf '%s' "$argv" | sed -e 's/ /+/g')
    set LINK "https://www.youtube.com$(curl -s "https://vid.puffyan.us/search?q=$S" | grep -s -Eo "/watch\?v=.{11}" | sed -n '1p')"
    set TITLE $(wget -qO- "$LINK" | perl -l -0777 -ne 'print $1 if /<title.*?>\s*(.*?)(?: - youtube)?\s*<\/title/si')
    echo "

---X---X---X---X---X---X---X---X---

$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)$(tput setaf 3) "$TITLE" $(tput sgr 0)$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)

$(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0) $(tput setaf 1)$(tput setab 7) "$LINK" $(tput sgr 0) $(tput setab 1)$(tput setaf 7) ▶ $(tput sgr 0)

---X---X---X---X---X---X---X---X---

"
    mpv --ytdl-format="bestvideo[ext=mp4][height<=?720]+bestaudio" "$LINK"

end

# function helpbash
#   if $arg[1] = "loop"
#     set A 0
#     while [ $A = 0 ]
#         set S $(read -P 'How to (in bash): ')
#         if [ $S = 'EXIT']
#             set A 1
#         else
#             brave --guest "https://www.google.com/search?q=How+to+"$(read)"+in+bash"
#         end
#     end
#   else
#     set S $(printf '%s' "$argv" | tr ' ' '+')
#     brave --guest "https://www.google.com/search?q=How+to+"$S"+in+bash"
#   end
# end

function helpbash
    if test "$argv[1]" = "loop"
      set A 0
      while test $A = 0
          set -p S (read -p 'How to (in bash): ')
          if test "$S" = 'EXIT'
              set A 1
          else
              set search_query "How+to+"(string escape "$S")"+in+bash"
              brave --guest "https://www.google.com/search?q=$search_query"
          end
      end
    else
      set -p S (printf '%s' "$argv" | tr ' ' '+')
      set search_query "How+to+"(string escape "$S")"+in+bash"
      brave --guest "https://www.google.com/search?q=$search_query"
    end
  end
  
  

function helpfish
  set S $(printf '%s' "$argv" | tr ' ' '+')
  brave --guest "https://www.google.com/search?q=How+to+"$S"+in+bash"
end

function calc
    set Q true
    while [ $Q = 'true' ]
        set K $(read)
        if [ $K = "exit" ]
            set Q false
        else
            math "$K"
        end
    end
end


function chalo
  set S $(printf '%s' "$argv")
  gcc $S.c -o $S_exe
  ./$S_exe
end

function whatis
  set S $(printf '%s' "$argv")
  open "https://google.com/search?q=$S"
  open "https://www.youtube.com/results?search_query=$S"
  open "https://en.wikipedia.org/wiki/Special:Search/$S"
  open "https://chat.openai.com/?q=What+is+$S"
end
