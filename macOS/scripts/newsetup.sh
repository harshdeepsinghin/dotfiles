# ============================================================
# EXTERNAL SSD LINKS
# ============================================================

print_header "SETTING UP EXTERNAL SSD LINKS"

if [[ ! -d "$SSD" ]]; then

    print_warning "External SSD not mounted:"
    printf '  %s\n' "$SSD"

else

    # --------------------------------------------------------
    # OLLAMA
    # --------------------------------------------------------

    if [[ -d "$OLLAMA_SOURCE" ]]; then

        rm -rf "$OLLAMA_DEST"

        ln -s \
            "$OLLAMA_SOURCE" \
            "$OLLAMA_DEST"

        print_success "Ollama linked to external SSD"

    else

        print_warning "Ollama directory not found:"
        printf '  %s\n' "$OLLAMA_SOURCE"

    fi

    # --------------------------------------------------------
    # GARAGEBAND
    # --------------------------------------------------------

    if [[ -d "$GARAGEBAND_SOURCE" ]]; then

        mkdir -p "$HOME/Library/Application Support"

        rm -rf "$GARAGEBAND_DEST"

        ln -s \
            "$GARAGEBAND_SOURCE" \
            "$GARAGEBAND_DEST"

        print_success "GarageBand data linked to external SSD"

    else

        print_warning "GarageBand directory not found:"
        printf '  %s\n' "$GARAGEBAND_SOURCE"

    fi

    # --------------------------------------------------------
    # LOGIC PRO
    # --------------------------------------------------------

    if [[ -d "$LOGIC_SOURCE" ]]; then

        mkdir -p "$HOME/Library/Application Support"

        rm -rf "$LOGIC_DEST"

        ln -s \
            "$LOGIC_SOURCE" \
            "$LOGIC_DEST"

        print_success "Logic data linked to external SSD"

    else

        print_warning "Logic directory not found:"
        printf '  %s\n' "$LOGIC_SOURCE"

    fi

fi