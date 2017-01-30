---
layout: default
title: Task - Installing Development Pre-requisites
category: tasks
sidebar: sidebars/tasks.md
excerpt: How to install the development pre-requisites
---

# Installing Development Pre-requisites

The essential tools you will need are *npm*, *docker*, *docker-compose* and a code editor for example *Atom* or *VSCode*. There are step by step [instructions](#Manual Installation) for installing these if perhaps you have some of them already.

There are also [two scripts](#Automatic Installation) that can be used on Ubuntu to install everything automatically.

The recommended versions are:
*Docker*: v1.12.5
*Docker-compose*: v1.9.0
*node.js*: v4 or v6

## Automatic Installation

The script to install the pre-requisites can be found in [Concerto-GettingStarted](https://github.ibm.com/Blockchain-WW-Labs/Concerto-GettingStarted) under [scripts](https://github.ibm.com/Blockchain-WW-Labs/Concerto-GettingStarted/tree/develop/scripts) and is named [prereqs-ubuntu.sh](https://github.ibm.com/Blockchain-WW-Labs/Concerto-GettingStarted/blob/develop/scripts/prereqs-ubuntu.sh).

Usage:

```bash
# First run the script
ibm@ubuntu:~/Concerto-GettingStarted$ ./scripts/prereqs-ubuntu.sh

# IMPORTANT: You will then need to logout and login again before running the next command

# Finishes the installation process
ibm@ubuntu:~/Concerto-GettingStarted$ ./scripts/prereqs-ubuntu.sh docker
```


**Additional Notes:**

- The installation commands have been tested on Ubuntu 14.04 (trusty), 64-bit. For other versions of Ubuntu, please check the official installation guides found under each instruction.


## Manual Installation

### 1. Installing an editor
The Concerto project allows you to edit its project files with any editor.

However, we recommend either using Atom or Visual Studio Code as both have excellent support for Javascript
development. We have even created an experimental CTO file syntax highlighting plugin for Atom.

### 1.1 Atom
[Atom](https://atom.io/) is a very popular editor and several [contributors](https://github.ibm.com/orgs/Blockchain-WW-Labs/teams/technical-team) use it. Install Atom, and when you have done so, you are required to turn off Google analytics if you work for IBM. Navigate to Atom->Preferences->Packages, search and find the `metrics` package and disable it.

####Installation Commands for Ubuntu:


```bash
# Add Atom Repository
sudo add-apt-repository ppa:webupd8team/atom -y

# Update package lists
sudo apt-get update

# Install Atom
sudo apt-get -y install atom
```
####Suggested Pluginss
Atom is at it's most productive would used with a number of plugins. The ones that we have found to be most useful are below and would suggest that you install these when with developing.

- *Code Highlighting*  On top of the existing code highlighting support there is a plugin for model file highlighting. [Atom Concerto Syntax Highlighter](https://github.ibm.com/Blockchain-WW-Labs/Concerto-Atom)
- *Linting* JavaScript dosn't come with a compiler that can pick up silly mistakes, but a linter is an essential tool to help. The one we have used is [eslint]([https://atom.io/packages/linter-eslint]). The file that we use is in the git repos look for a `.eslint file`. If you use the Yeoman generator for a simple application you will get this file as part of the sample application.
- *UI* [File Icons](https://atom.io/packages/file-icons) is a useful UI enhancement to show different icons for different file

####Installation Commands for MacOS:

```bash
tbd
```

####Additional Notes:

- [Official Atom installation guide](http://flight-manual.atom.io/getting-started/sections/installing-atom/)
- [Atom Concerto Syntax Highlighter](https://github.ibm.com/Blockchain-WW-Labs/Concerto-Atom)

### 1.2 Visual Studio Code
[Visual Studio Code](https://code.visualstudio.com/) is a lightweight and powerful editor.

**Installation Commands for Ubuntu:**

```bash
# Download vscode .deb file
curl -o vscode.deb https://az764295.vo.msecnd.net/stable/7ba55c5860b152d999dda59393ca3ebeb1b5c85f/code_1.7.2-1479766213_amd64.deb

# Install vscode
sudo dpkg -i vscode.deb

# Install dependencies
sudo apt-get install -f
```

**Installation Commands for MacOS:**

```bash
tbd
```

**Additional Notes:**

- [Official VS Code installation guide](https://code.visualstudio.com/docs/setup/setup-overview)

### 2. Installing Git
This is probably already installed on most Linux machines. Setup is well documented on the [ibm.git website](https://help.github.com/enterprise/2.7/user/articles/set-up-git/). Pay particular attention to [setting up the SSL keys](https://help.github.com/enterprise/2.7/user/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/#platform-linux) that are required.

**Installation Commands for Ubuntu:**

```bash
# Install Git
sudo apt-get -y install git
```

**Installation Commands for MacOS:**

```bash
tbd
```

**Additional Notes:**

- [Official Git installation guide](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

### 3. Installing NVM
We highly recommend installing [nvm](https://github.com/creationix/nvm) to easily install and manage versions of [node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/). The main runtime uses node.js and npm is used for package management and dependency installation.
The runtime requires a version higher than v4.6.0.

**Installation Commands for Ubuntu:**

```bash
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
nvm install 4.6.2

# Configure nvm to use version 4.6.2
nvm use 4.6.2.

# Install the latest version of npm
npm install npm@latest -g
```

**Installation Commands for MacOS:**

```bash
tbd
```

**Additional Notes:**

- [Official nvm Github repository](https://github.com/creationix/nvm)

### 4. Installing Docker Engine
The Docker Engine is essential for running system tests and running the HyperLedger Fabric.

**Installation Commands for Ubuntu:**

```bash
# Ensure that CA certificates are installed
sudo apt-get -y install apt-transport-https ca-certificates

# Add new GPG key and add it to adv keychain
sudo apt-key adv \
               --keyserver hkp://ha.pool.sks-keyservers.net:80 \
               --recv-keys 58118E89F3A912897C070ADBF76221572C52609D

# Update where APT will search for Docker Packages
echo "deb https://apt.dockerproject.org/repo ubuntu-trusty main" | sudo tee /etc/apt/sources.list.d/docker.list

# Update package lists
sudo apt-get update

# Verifies APT is pulling from the correct Repository
sudo apt-cache policy docker-engine

# Install kernel packages which allows us to use aufs storage driver
sudo apt-get -y install linux-image-extra-$(uname -r) linux-image-extra-virtual

# Install docker-engine
sudo apt-get -y install docker-engine=1.12.3-0~trusty

# Modify user account
sudo usermod -aG docker $(whoami)

# You will need to logout in order for these changes to take effect!
```

**Installation Commands for MacOS:**

```bash
tbd
```

**Additional Notes:**

- [Official Docker Engine installation guide](https://docs.docker.com/engine/installation/)

### 5. Installing Docker Compose
Docker Compose is used for easily configuring and starting HyperLedger Fabric.

**Installation Commands for Ubuntu:**

```bash
# Install python package management system to easily install docker-compose
sudo apt-get -y install python-pip

# Use pip to install Docker Compose
sudo pip install docker-compose
```

**Installation Commands for MacOS:**

```bash
tbd
```

**Additional Notes:**

- [Official Docker Compose installation guide](https://docs.docker.com/compose/install/)

### 6. Login to npm Whitewater
All of the Fabric Composer packages can be found in the public npm registry.

**Installation Commands for MacOS:**

```bash
tbd
```

**Additional Notes:**

- [npm Whitewater](https://npm.whitewater.ibm.com/)
