#!/bin/bash

# filepath: /path/to/convert_backup_to_xml.sh

# Input and output file paths
INPUT_FILE="../misc/OLauncherBackupWithIcons.txt"  # Replace with your .txt backup file path
OUTPUT_FILE="backup.xml" # Output XML file path

# Check if input file exists
if [[ ! -f "$INPUT_FILE" ]]; then
    echo "Error: Input file '$INPUT_FILE' not found!"
    exit 1
fi

# Start XML structure
echo '<?xml version="1.0" encoding="UTF-8"?>' > "$OUTPUT_FILE"
echo '<preferences>' >> "$OUTPUT_FILE"

# Read JSON and convert to XML
jq -r 'to_entries | .[] | "<preference key=\"\(.key)\">\(.value)</preference>"' "$INPUT_FILE" >> "$OUTPUT_FILE"

# Close XML structure
echo '</preferences>' >> "$OUTPUT_FILE"

echo "Conversion complete! XML saved to '$OUTPUT_FILE'."