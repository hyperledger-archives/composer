# Installing Development Pre-requisites

The essential tools you will need are *npm*, *docker*, *docker-compose* and a code editor for example *Atom* or *VSCode*. Samples are held in GitHub so *git* will be needed as well.

The recommended *minimum* versions are:
- *Docker*: v17.03
- *Docker-compose*: v1.13.0
- *npm*: v5.5.1
- *node.js*: v8.9.1


## Installation for Ubuntu

### 1. Installing Runtime Components
Supported versions of Ubuntu are: Trusty, Xenial and Yakkety. There is an automated installation script that will install *node* *docker* *docker-compose*.  For Trusty, additional kernel packages that allow the use of the AUFS storage driver required by Docker, will also be installed.

If some of the tools are already installed or to do the installation step-by-step follow the [manual instructions](./manual_prerequisites.md).


```bash
$ curl -O https://hyperledger.github.io/composer/prereqs-ubuntu.sh
$ chmod u+x prereqs-ubuntu.sh
```

Next run the script - as this uses sudo you will be prompted for your password.

```bash
$ ./prereqs-ubuntu.sh
```

**Important:** You will need to logout and login again before continuing.

The script will print out the versions installed

### 2. Installing Git
This is probably already installed on most Linux machines. Pay particular attention to [setting up the SSL keys](https://help.github.com/enterprise/2.7/user/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/#platform-linux) that are required.

[Official Git Download](https://git-scm.com/downloads)


## Optional Installs

### 1. Installing an editor

{{site.data.conrefs.composer_full}} allows you to edit its project files with any editor. We recommend using either Atom or Visual Studio Code, as not only do both have excellent support for Javascript development, a `.cto` file syntax highlighting plugin exists for these editors.

**Atom**

[Atom](https://atom.io/) is a very popular editor and several contributors use it.

[Official Atom installation guide](http://flight-manual.atom.io/getting-started/sections/installing-atom/)

Suggested Plugins:

* [Composer Atom Syntax Highlighter](https://github.com/hyperledger/composer-atom-plugin) A plugin for model file highlighting.

* [File Icons](https://atom.io/packages/file-icons) is a useful UI enhancement to show different icons for different files.

**Visual Studio Code**

[Visual Studio Code](https://code.visualstudio.com/) is a lightweight and powerful editor.

Extensions may be installed into VS Code by searching the Extensions repository for the desired extension package and selecting the install option once identified. Suggested extentions include:

* Composer VS Code Plugin. Provides syntax highlighting for CTO files within VS Code

* ESLint. Integrates ESLint into VS Code.

* TSLint. Integrates the tslint linter for the TypeScript language into VS Code.

* EditorConfig for VS Code. Enables the definition and maintainance of consistent coding styles between different editors and IDEs.
