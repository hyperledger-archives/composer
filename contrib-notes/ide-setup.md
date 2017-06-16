# Contributing to Composer
* [Step-by-step developement environment setup](./contrib-notes/getting-started.md)
* Currently reading ->  [Suggested IDE setup](./contrib-notes/ide-setup.md)
* [Coding Guidelines](./contrib-notes/coding-guidelines.md)
* [Pull Request Guidelines](./contrib-notes/submitting-pull-request.md)
* [Release process](./contrib-notes/release-process/weekly-qa-validation.md)

# IDE setup for Hyperledger Composer development

Both Atom.io and VS Code are popular editors amongst the Hyperledger Composer contributors.

# Using Atom

[Atom](https://atom.io/) is the preferred code editor for contributors the Hyperledger Composer project.  Many developers find Atom especially productive due to the wide range of plugins availability to assist with code development activities. These include syntax highlighting for node.js code, JavaScript and the Hyperledger Composer modelling language, or *linting* to help eliminate potential bugs and ensure a consistent coding style. Developers can also develop their own plugins. Here's a list of Atom plugins for you consider as you develop within the Hyperledger Composer project.

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
_to do_

# Next step

Move on to read  [Coding Guidelines](./contrib-notes/coding-guidelines.md)
