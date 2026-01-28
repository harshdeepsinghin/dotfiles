sudo mkdir -p /etc/apt/keyrings

curl -fsSL https://archive.kali.org/archive-key.asc | \
  sudo gpg --dearmor -o /etc/apt/keyrings/kali-archive-keyring.gpg

sudo cp /etc/apt/sources.list /etc/apt/sources.list.backup
echo "deb [signed-by=/etc/apt/keyrings/kali-archive-keyring.gpg] http://http.kali.org/kali kali-rolling main non-free contrib" | sudo tee /etc/apt/sources.list

sudo apt update
sudo apt upgrade -y
sudo apt full-upgrade -y

sudo apt autoremove -y
sudo apt autoclean
