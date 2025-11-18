import json
import xml.etree.ElementTree as ET
import requests

# Function to create XML structure from key-value pairs
def create_xml_from_dict(data):
    root = ET.Element("map")  # Root element of the XML

    # Iterate through the dictionary and add each key-value pair to the XML
    for key, value in data.items():
        if isinstance(value, bool):  # Handle boolean values
            ET.SubElement(root, "boolean", name=key, value=str(value).lower())
        elif isinstance(value, int):  # Handle integer values
            ET.SubElement(root, "int", name=key, value=str(value))
        elif isinstance(value, str):  # Handle string values
            ET.SubElement(root, "string", name=key).text = value
        elif isinstance(value, list):  # Handle list values (example: HIDDEN_APPS)
            for item in value:
                ET.SubElement(root, "string", name=key).text = item
        else:
            print(f"Unhandled type for {key}: {type(value)}")

    # Return the XML tree
    return ET.ElementTree(root)

# Function to download the JSON data from the URL
def download_json_from_url(url):
    response = requests.get(url)
    if response.status_code == 200:
        return response.text
    else:
        raise Exception(f"Failed to fetch the URL. Status code: {response.status_code}")

# Function to save XML to a file
def save_xml_to_file(xml_tree, output_path):
    xml_tree.write(output_path, encoding='utf-8', xml_declaration=True)

# Main execution
if __name__ == "__main__":
    input_url = "https://raw.githubusercontent.com/harshdeepsinghin/dotfiles/refs/heads/main/CrDroid_vayu/misc/OLauncherBackupWithIcons.txt"  # URL to fetch the JSON data from
    output_xml_file = "converted_output.xml"  # Path where the output XML should be saved

    # Download the JSON data from the URL
    json_data_text = download_json_from_url(input_url)

    # Convert the text to a Python dictionary
    json_data = json.loads(json_data_text)

    # Create XML from the JSON data
    xml_tree = create_xml_from_dict(json_data)

    # Save the XML to a file
    save_xml_to_file(xml_tree, output_xml_file)

    print(f"Conversion complete! The XML file is saved as {output_xml_file}.")
