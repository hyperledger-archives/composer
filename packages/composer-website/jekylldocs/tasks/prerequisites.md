---
layout: default
title: Task - Installing Development Pre-requisites
category: tasks
sidebar: sidebars/tasks.md
excerpt: How to install the development pre-requisites
---

# Installing Development Pre-requisites

---

The essential tools you will need are *npm*, *docker*, *docker-compose* and a code editor for example *Atom* or *VSCode*. Samples are held in Github so *git* will be needed as well.

The recommended versions are:
*Docker*: v1.12.5
*Docker-compose*: v1.10.0
*node.js*: v6.9.5



## Installation for Ubuntu 14.04 LTS

There is an automated installation script that will install *node* *docker* *docker-compose*.  
If some of the tools are already installed or to do the installation step-by-step follow the [manual instructions](./manual_prerequisites.md).


```bash
$ curl -O https://raw.githubusercontent.com/mbwhite/sample-applications/master/packages/getting-started/scripts/prereqs-ubuntu.sh
$ chmod u+x prereqs-ubuntu.sh
```

Next run the script - as this uses sudo you will be prompted for your password.

```bash
$ ./prereqs-ubuntu.sh
```

**Important:** You will then need to logout and login again before running the next command

The end of the script does print out the versions installed, if you wish to check here are the version commands.

```bash
$ node --version
v6.10.0
$ npm --version
4.3.0
$ docker --version
Docker version 1.13.1, build 092cba3
$ docker-compose --version
docker-compose version 1.11.1, build 7c5d5e4
```


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
