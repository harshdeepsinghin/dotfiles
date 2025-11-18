#!/bin/bash

# Read JSON backup from the file
json_file="../misc/OLauncherBackupWithIcons.txt"
output_xml="olauncher_config.xml"

# Start the XML document
echo "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>" > "$output_xml"
echo "<map>" >> "$output_xml"

# Convert JSON to XML
jq -r 'to_entries | .[] | "<string name=\"" + .key + "\">" + (.value | tostring) + "</string>"' "$json_file" >> "$output_xml"

# Close the XML document
echo "</map>" >> "$output_xml"

echo "Conversion complete! The XML file is saved as $output_xml"
