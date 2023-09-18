#!/bin/bash

# NOTE: SSH keys must be in ~/.ssh

if [[ $1 == "ok" ]]; then
    chmod 700 ~/.ssh/
    chmod 600 ~/.ssh/id_rsa
    git config --global user.name "Harshdeep Singh"
    git config --global user.email "94488766+harshdeepcodes@users.noreply.github.com"
    git config --global gpg.format ssh
    git config --global commit.gpgsign true
    git config --global user.signingkey ~/.ssh/id_rsa.pub
    ssh -T git@github.com
else
    echo """
    
    put your SSH KEYS ( id_rsa.pub and id_rsa ) in your ~/.ssh
    
    if already done then, repeat the command with \`ok\` after it

    like:  bash $0 ok
  
    """
fi
