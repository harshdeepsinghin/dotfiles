#!/bin/bash

if [ "$1" == "sure" ]; then
    cd ~/.ssh/
    chmod 700 ~/.ssh/
    chmod 600 ~/.ssh/id_rsa
    git config --global user.name "Harshdeep Singh"
    git config --global user.email "94488766+harshdeepcodes@users.noreply.github.com"
    git config --global gpg.format ssh
    git config --global commit.gpgsign true
    git config --global user.signingkey ~/.ssh/id_rsa.pub
    ssh -T git@github.com
else
    echo "Put the SSH keys into ~/.ssh !!!"
    exit 1
fi

echo 
