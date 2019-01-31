# Contributing to Composer
* [Step-by-step development environment setup](./getting-started.md)
* Currently reading ->  [Suggested IDE setup](./ide-setup.md)
* [Coding Guidelines](./coding-guidelines.md)
* [Pull Request Guidelines](./submitting-pull-request.md)
* [Release process](./release-process/weekly-qa-validation.md)

# IDE setup for Hyperledger Composer development

Both Atom.io and VS Code are popular editors amongst the Hyperledger Composer contributors.

# Using Atom

[Atom](https://atom.io/) is the preferred code editor for contributors the Hyperledger Composer project.  Many developers find Atom especially productive due to the wide range of plugins availability to assist with code development activities. These include syntax highlighting for node.js code, JavaScript and the Hyperledger Composer modeling language, or *linting* to help eliminate potential bugs and ensure a consistent coding style. Developers can also develop their own plugins. Here's a list of Atom plugins for you consider as you develop within the Hyperledger Composer project.

## JavaScript and Node.js linting

Use the [linter-eslint plugin](https://atom.io/packages/linter-eslint) to help with linting node.js and JavaScript code. For an example of the eslinter config file see [here](../packages/composer-admin/.eslintrc.yml).

## Hyperledger Composer modelling language

Use the [composer-atom plugin](https://github.com/hyperledger/composer-atom-plugin) for syntax highlighting of the Hyperledger Composer modelling language.  Follow the instructions in the README to install the plugin.

## Find unfinished work items

Use the [todo-show](https://atom.io/packages/todo-show) plugin to find indicators that code might not be complete by finding instances of indicative text, such as *TODO*, *FUTURE*, *BUG* etc.

## Match selected keywords

Use the [highlight-selected plugin](https://atom.io/packages/highlight-selected) to find all matches of a keyword in the current file.

## Documentation assistance

Use the [docblockr plugin](https://atom.io/packages/docblockr) to create pretty comments, function prototypes and other helpful code decorations.

## File type visualization

Use the [file-icons plugin](https://atom.io/packages/file-icons) to assign visual representations to file extension to help locate files of a given type.

# Using VSCode
Go to [Hyperledger Composer plugin on VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=HyperledgerComposer.composer-support-client). Copy command at the top of page from the marketplace, then Launch VS Code, Quick Open (Ctrl+P), paste the command from the and press enter.

# Hyperledger Composer Extension for VSCode

Validate Composer model files that define the structure of your business network in terms of Assets, Participants and Transactions.

The extension parses Composer model (.cto) files and reports any validation errors. It is currently in beta; please raise any problems you find as an [issue](https://github.com/hyperledger/composer-vscode-plugin/issues).


## Manual Build and Install

Generate the installable VSIX file:

```
git clone https://github.com/hyperledger/composer-vscode-plugin.git
cd composer-vscode-plugin/server
npm install
npm run compile:server
cd ../client
npm install
npm run package:vsix
```

1. Launch VSCode
2. View > Extensions
3. Press the ... and select "Install from VSIX"
4. Browse to the VSIX file
5. Install and restart VSCode
6. Open a .cto file

# Travis CI build
Developers no longer need a manual build, once you have pulled a request from your private Github repository. The build will be automatically performed by Travis.
A successful build will create an installable VSIX file on the build machine. 
The public release version number is defined in the Client package.json file. 

## Publish Release
Below are steps for publishing a release.
1. Go to https://github.com/hyperledger/composer-vscode-plugin
2. Click Releases tab
3. Click Draft a new release on the right
4. Type a Tag version in the Tag version field. e.g. v0.5.7.1
5. Type a Release title in the Release title field e.g v0.5.7.1
6. Provide a short description of this release under the Write tab
7. Uncheck the box for This is a pre-release at the end of this page
8. Click Publish release button to publish the VSIX file to the VSCode Marketplace

## Check the published release
1. Go to the VSCode Marketplace: https://marketplace.visualstudio.com/
2. Type Composer in the search field and hit return key or search button
3. This will bring you to https://marketplace.visualstudio.com/search?term=Composer&target=VSCode&category=All%20categories&sortBy=Relevance

## Install a new release
1. Open Visual Studio Code in your desktop
2. Open the Extensions by View-->Extensions or Ctrl(cmd)+Shift+x 
3. Search for Composer
4. The new published Hyperledger Composer 0.7.1 is showing on the list
5. Click Install button to install it
6. Update button will be shown if you have already installed the same plugin before.

# Next step

Move on to read  [Coding Guidelines](./coding-guidelines.md)

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.
