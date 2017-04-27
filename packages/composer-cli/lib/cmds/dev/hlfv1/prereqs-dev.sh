# Install useful development prereqs

set -e

# Install Atom
sudo add-apt-repository ppa:webupd8team/atom

sudo apt update; sudo apt install atom

# install xclip
sudo apt-get install xclip

# Get the MICRO editor and unzip and create a link to it
if [ ! -f /opt/micro-1.1.4/micro ]; then
	sudo curl -sL  https://github.com/zyedidia/micro/releases/download/v1.1.4/micro-1.1.4-linux64.tar.gz | tar xz --directory /opt
	sudo ln -s /opt/micro-1.1.4/micro /usr/local/bin/micro
fi

# Install the tree file utility
sudo apt install tree

# NPM utility to pretty the output of JSON files
npm install -g prettyjson


# Install Chrome
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - 
sudo sh -c 'echo "deb https://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
sudo apt-get update
sudo apt-get install google-chrome-stable
