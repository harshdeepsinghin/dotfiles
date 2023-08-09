#!/bin/bash

while true; do
    echo "Y/N: " | read Q
    if [[ $Q = "Y" || $Q = "y" ]]; then
        echo hi
    else
        echo bye
    fi;
done

