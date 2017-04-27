#!/bin/bash

# Usage:
#
# ./prereqs-ubuntu.sh
#
# User must then logout and login upon completion of script
#

# Exit on any failure
set -e

# Array of supported versions
declare -a versions=('trusty' 'utopic' 'xenial' 'yakkety');

## check the version and extract codename of ubuntu if release codename not provided by user
if [ -z "$1" ]; then
    source /etc/lsb-release || echo "Release information not found, run script passing Ubuntu version codename as a parameter" exit 1
    CODENAME=$DISTRIB_CODENAME
else 
    CODENAME=$1
fi

# check version is supported
if echo ${versions[@]} | grep -q -w $CODENAME; then 
    echo "Installing Fabric Composer prereqs for Ubuntu $CODENAME"
else 
    echo "Ubuntu $CODENAME is not supported"
    exit 1
fi

# Update package lists
sudo apt-get update

# Install Git
sudo apt-get -y install git

# Install nvm dependencies
sudo apt-get -y install build-essential libssl-dev

# Execute nvm installation script
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash

# Update bash profile
cat <<EOF >> ~/.profile
export NVM_DIR=~/.nvm
[ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"
EOF

# Reload bash profile
source ~/.profile

# Install node and npm
nvm install 6.9.5

# Configure nvm to use version 6.9.5
nvm use 6.9.5
nvm alias default 6.9.5

# Install the latest version of npm
npm install npm@latest -g

# Ensure that CA certificates are installed
sudo apt-get -y install apt-transport-https ca-certificates

# Add new GPG key and add it to adv keychain
sudo apt-key adv \
               --keyserver hkp://ha.pool.sks-keyservers.net:80 \
               --recv-keys 58118E89F3A912897C070ADBF76221572C52609D

# Update where APT will search for Docker Packages
echo "deb https://apt.dockerproject.org/repo ubuntu-$CODENAME main" | sudo tee /etc/apt/sources.list.d/docker.list

# Update package lists
sudo apt-get update

# Verifies APT is pulling from the correct Repository
sudo apt-cache policy docker-engine

# Install kernel packages which allows us to use aufs storage driver if V14 (trusty/utopic)
if [ "$CODENAME" == "trusty" ] || [ "$CODENAME" == "utopic" ] ; then
    sudo apt-get -y install linux-image-extra-$(uname -r) linux-image-extra-virtual
fi

# Install docker-engine
instalDocker="sudo apt-get -y install docker-engine=1.12.3-0~$CODENAME"
eval $instalDocker

# Modify user account
sudo usermod -aG docker $(whoami)

# Install docker compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.10.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Print installation details for user
echo ""
echo "Installation completed, versions installed are:"
echo "Node:"
node --version
echo "npm:"
npm --version
echo "docker:"
docker --version
echo "docker-compose:"
docker-compose --version

# Print reminder of need to logout in order for these changes to take effect!
echo "Please logout then login before continuing."