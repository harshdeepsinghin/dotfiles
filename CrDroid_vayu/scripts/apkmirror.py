import requests
from bs4 import BeautifulSoup
import sys

headers = {
    "User-Agent": "Mozilla/5.0"
}

def get_soup(url):
    res = requests.get(url, headers=headers)
    return BeautifulSoup(res.text, 'html.parser')

def search_app(app_name):
    search_url = f"https://www.apkmirror.com/?s={app_name.replace(' ', '+')}"
    soup = get_soup(search_url)
    
    # Look inside search result divs
    result_blocks = soup.select("div.appRow a.downloadLink")

    if not result_blocks:
        return None

    # First result URL
    first_link = result_blocks[0].get('href')
    return "https://www.apkmirror.com" + first_link

def get_variant_page(app_url):
    soup = get_soup(app_url)
    variant_link = soup.select_one("a.accent_bg.btn")
    
    if variant_link:
        return "https://www.apkmirror.com" + variant_link.get('href')
    return None

def get_final_download_link(variant_url):
    soup = get_soup(variant_url)
    link = soup.select_one("a.accent_bg.btn[href*='download.php']")
    
    if link:
        return link['href']
    return None

def main(app_name):
    print(f"[*] Searching for: {app_name}")
    app_page = search_app(app_name)

    if not app_page:
        print("[!] App not found.")
        return

    print(f"[*] App page found: {app_page}")

    variant_page = get_variant_page(app_page)
    if not variant_page:
        print("[!] Variant download page not found.")
        return

    print(f"[*] Variant download page: {variant_page}")

    final_link = get_final_download_link(variant_page)
    if not final_link:
        print("[!] Final download link not found.")
        return

    print("[✅] Latest APK Download Link:")
    print(final_link)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python apkmirror.py <app name>")
    else:
        main(" ".join(sys.argv[1:]))
