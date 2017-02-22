---
layout: default
title: Task - Installing Development Pre-requisites
category: tasks
sidebar: sidebars/tasks.md
excerpt: How to install the development pre-requisites
---

# Installing Development Pre-requisites

---

The essential tools you will need are *npm*, *docker*, *docker-compose* and a code editor for example *Atom* or *VSCode*.

The recommended versions are:
*Docker*: v1.12.5
*Docker-compose*: v1.10.0
*node.js*: v6.9.5

## Automatic Installation

First clone the Getting Started repository

```bash
git clone http://github.com/fabric-composer/sample-applications
cd sample-applications/packages/getting-started
```

Next run the script

```bash
user@ubuntu:~/getting-started$ ./scripts/prereqs-ubuntu.sh
```

**Important:** You will then need to logout and login again before running the next command

This command completes the installation process

```bash
user@ubuntu:~/getting-started$ ./scripts/prereqs-ubuntu.sh docker
```

**Additional Notes:**

The installation commands have been tested on Ubuntu 14.04 (trusty), 64-bit. For other versions of Ubuntu, please check the official installation guides found under each instruction.

## Manual Installation

### 1. Installing NVM
We highly recommend installing NVM to easily install and manage versions of [node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/). The main runtime uses node.js and npm is used for package management and dependency installation. The runtime requires a version higher than v4.6.0.

[Official nvm Github repository](https://github.com/creationix/nvm)

### 2. Installing Docker Engine
The Docker Engine is essential for running system tests and running the HyperLedger Fabric.

[Official Docker Engine Installation Guide](https://docs.docker.com/engine/installation/)

### 3. Installing Docker Compose
[Docker Compose](https://docs.docker.com/compose/overview/) is used for easily configuring and starting HyperLedger Fabric.

[Official Docker Compose Installation guide](https://docs.docker.com/compose/install/)

## Optional Installs

### 1. Installing an editor
Fabric Composer allows you to edit its project files with any editor.

However, we recommend either using Atom or Visual Studio Code as both have excellent support for Javascript
development. We have even created an experimental CTO file syntax highlighting plugin for Atom.


**Atom**

[Atom](https://atom.io/) is a very popular editor and several contributors use it.

[Official Atom installation guide](http://flight-manual.atom.io/getting-started/sections/installing-atom/)

Suggested Plugins:

Code Highlighting: On top of the existing code highlighting support there is a plugin for model file highlighting. [Atom Concerto Syntax Highlighter](https://github.ibm.com/Blockchain-WW-Labs/Concerto-Atom)

UI: [File Icons](https://atom.io/packages/file-icons) is a useful UI enhancement to show different icons for different files.

**Visual Studio Code**

[Visual Studio Code](https://code.visualstudio.com/) is a lightweight and powerful editor.

### 2. Installing Git
This is probably already installed on most Linux machines. Pay particular attention to [setting up the SSL keys](https://help.github.com/enterprise/2.7/user/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/#platform-linux) that are required.

[Official Git Download](https://git-scm.com/downloads)
