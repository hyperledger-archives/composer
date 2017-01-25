# Using Atom for Concerto development
(Atom)[https://atom.io/] is the favoured development environment by many (possibly all) of the contributors on Concerto and related projects. Atom is at it's most productive would used with a number of plugins. The ones that we have found to be most useful are below and would suggest that you install these when with developing Concerto itself or applications using the Concerto API.

Quik

## Code editing

### Concerto File Highlighting
The very first plugin you should install is a syntax highlighter for the Concerto model files. If you only install one thing, make it this one.

[https://github.ibm.com/Blockchain-WW-Labs/Concerto-Atom]

### esLint
JavaScript dosn't come with a compiler that can pick up silly mistakes, but a linter is an essential tool to help. The one we have used is eslint.

[https://atom.io/packages/linter-eslint]

This is the config file that we have used with eslint
```
env:
    es6: true
    node: true
    mocha: true
extends: 'eslint:recommended'
parserOptions:
    sourceType:
        - script
rules:
    indent:
        - error
        - 4
    linebreak-style:
        - error
        - unix
    quotes:
        - error
        - single
    semi:
        - error
        - always
    no-unused-vars:
        - error
        - args: none
    no-console: off
    curly: error
    eqeqeq: error
    no-throw-literal: error
    strict: error
    no-var: error
    dot-notation: error
    no-tabs: error
    no-trailing-spaces: error
    # no-use-before-define: error
    no-useless-call: error
    no-with: error
    operator-linebreak: error
    require-jsdoc:
        - error
        - require:
            ClassDeclaration: true
            MethodDefinition: true
            FunctionDeclaration: true
    valid-jsdoc:
        - error
        - requireReturn: false
    yoda: error
```

### TODO-Show
This can show easily all the TODO: FUTURE: etc that in the codebase
[https://atom.io/packages/todo-show]

### Highlight selected
Click on a keyword or variable and this will show up the matching instances in the file.
[https://atom.io/packages/highlight-selected]

### DocBlockr
Helps to create skeltion doc comments for Functions
[https://atom.io/packages/docblockr]

## General

### FileIcons
Useful UI enhancement to show different icons for different file Types

[https://atom.io/packages/file-icons]
