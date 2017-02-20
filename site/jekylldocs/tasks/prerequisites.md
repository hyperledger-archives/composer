---
layout: default
title: Task - Installing Development Pre-requisites
category: tasks
sidebar: sidebars/tasks.md
excerpt: How to install the development pre-requisites
---

# Installing Development Pre-requisites

---

The essential tools you will need are:

- [*git*](#1-installing-git)
- [*node*](#2-installing-nvm) (version 6.x)
- [*npm*](#2-installing-nvm) (version 4.0.x)
- [*docker*](#3-installing-docker-engine) (version 1.12.x)
- [*docker-compose*](#4-installing-docker-compose) (version 1.9.x)

You will also need a code editor, for example [*Atom*](#1-installing-an-editor) or [*VSCode*](#1-installing-an-editor).

There is a script that can be used on Ubuntu to install the essential tools [automatically](#automatic-installation). There are also step by step instructions for [manually](#manual-installation) installing the essential tools or editors in isolation if you have some of them already.

## Automatic Installation

The script to install the pre-requisite tools can be found in [GettingStarted](https://github.com/fabric-composer/sample-applications/tree/master/packages/getting-started) under [scripts](https://github.com/fabric-composer/sample-applications/tree/master/packages/getting-started/scripts) and is named [prereqs-ubuntu.sh](https://github.com/fabric-composer/sample-applications/blob/master/packages/getting-started/scripts/prereqs-ubuntu.sh).

The script must be run twice. On the first run the script will install *git*, *nvm*, *node and npm (via nvm)*, and *docker*.

On the second run, performed after logout and login, and using the 'docker' flag, the script will install *python* and *docker-compose*.

Usage:

```bash
# First run the script
ibm@ubuntu:~/GettingStarted$ ./scripts/prereqs-ubuntu.sh

# IMPORTANT: You will then need to logout and login again before running the next command

# Finishes the installation process
ibm@ubuntu:~/GettingStarted$ ./scripts/prereqs-ubuntu.sh docker
```


**Additional Notes:**

- The installation commands have been tested on Ubuntu 14.04 (trusty), 64-bit. For other versions of Ubuntu, please check the official installation guides found under each instruction.
- The script will not install a code editor. Manual installation of recommended code editors is provided in the [manual installation](#1-installing-an-editor) section.

## Manual Installation

### 1. Installing Git
Git is likely to be pre-installed on your machine, however setup is well documented on the official Git installation [guide](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git).

[Official Git Download](https://git-scm.com/downloads)

### 2. Installing NVM
We highly recommend installing NVM to easily install and manage versions of [node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/). The main runtime uses node.js and npm is used for package management and dependency installation. The runtime requires a version higher than v4.6.0.

[Official nvm Github repository](https://github.com/creationix/nvm)

### 3. Installing Docker Engine
The Docker Engine is essential for running system tests and running the HyperLedger Fabric.

[Official Docker Engine Installation Guide](https://docs.docker.com/engine/installation/)

### 4. Installing Docker Compose
[Docker Compose](https://docs.docker.com/compose/overview/) is used for easily configuring and starting HyperLedger Fabric.

[Official Docker Compose Installation guide](https://docs.docker.com/compose/install/)

## Optional Installs

### 1. Installing an editor
Fabric Composer allows you to edit its project files with any editor.

However, we recommend either using Atom or Visual Studio Code as both have excellent support for Javascript
development. An experimental CTO file syntax highlighting plugin exists for Atom.


**Atom**

[Atom](https://atom.io/) is a very popular editor within the community.

[Official Atom installation guide](http://flight-manual.atom.io/getting-started/sections/installing-atom/)

Suggested Plugins:

Code Highlighting: On top of the existing code highlighting support there is a plugin for model file highlighting. [Atom Concerto Syntax Highlighter](https://github.ibm.com/Blockchain-WW-Labs/Concerto-Atom)

UI: [File Icons](https://atom.io/packages/file-icons) is a useful UI enhancement to show different icons for different files.

**Visual Studio Code**

[Visual Studio Code](https://code.visualstudio.com/) is a lightweight and powerful editor popular with Javascript and Node development.
