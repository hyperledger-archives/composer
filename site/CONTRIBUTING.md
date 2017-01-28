---
layout: default
title: Contributing to Concerto
category: contributing
sidebar: sidebars/contributing.md
excerpt: Concerto project contribution guidelines
---
# Contributing to Concerto

This document explains how you should work with the Concerto repository.

## Creating a Mac OS X development environment

### Install Homebrew

Follow the instructions at: http://brew.sh

### Install Node Version Manager

From a terminal window, type:

    brew update
    brew install nvm
    mkdir ~/.nvm
    nano ~/.bash_profile

Add these lines to your .bash_profile file:

    export NVM_DIR=~/.nvm
    source $(brew --prefix nvm)/nvm.sh

Then in a terminal type:

    source ~/.bash_profile
    echo $NVM_DIR

### Install Required Version of Node

Use the Node Version Manager (nvm) to install the correct version of
Node for Concerto.

In a terminal window type:

    nvm install 4.6

Note that if you ever change versions of Node you will need to delete your
node_modules directory and rerun 'npm install'.

### Install dependencies

From a terminal window in the Concerto directory run:

    ./scripts/install-deps.sh

### Test the environment

You can now run the Unit Tests to test your development environment works.
From your checkout Concerto directory, switch to a terminal and type:

    npm install
    npm test

The tests should all pass!

## Our development process

All work on Concerto is performed on GitHub Enterprise. Changes should be developed in a fork of the Concerto repository, and the changes submitted for approval in the form of pull requests.

| Workflow |
| :-----: |
|![Workflow diagram](docs/source/png/Contributing.Diagram.png)|

### `develop` branch

All changes and pull requests should be targeted at the `develop` branch. The `develop` branch has been configured as the default branch for the Concerto repository. When you create a pull request, a Travis CI build will automatically run to confirm that your changes build cleanly and pass all known tests. Your changes will **not** be merged into the `develop` branch unless this build runs cleanly.

### `master` branch

We try to keep the `master` branch as stable as possible. Changes are regularly pushed from the `develop` branch up to the `master` branch once they have been confirmed to be *good*. Only specific members of the IBM Blockchain WW Labs team have permission to push to the `master` branch.

### Testing

All changes pushed to Concerto should include unit tests that ensure that the new functionality works as designed, or that fixed bugs stay fixed. Pull requests that add code changes which are not covered by automated unit tests will **not** be accepted.

Unit testing is for ensuring that small units of code *Do The Right Thing*, with an extremely quick turnaround time. An example of this might be the `AssetRegistryFactory.create()` method. The code in this method *probably* needs to do two things; send the correct invoke request to the chain-code, and correctly handle all of the possible responses from that chain-code.

We do not need to stand up the Hyperledger Fabric to unit test this method; we simply need to ensure that the correct calls are made to the **hfc** library. Infact, testing against a running Hyperledger Fabric can actually make this harder - especially when we need to test our code for handling errors and timeouts from the **hfc** library. It is much easier and quicker to inject errors and timeouts into a *mocked* **hfc** library.

Additionally, the Hyperledger team have added unit test support for chain-code. This means that chain-code can be tested as a separate unit, leading to tests such as: given world state *X*, and invoke request *Y*, is the invoke request *Y* successful and is the world state updated correctly?

Obviously, unit testing is not sufficient, and we do need to test the framework against a running Hyperledger Fabric to ensure that the system works as a whole. This is additional functional, system, and performance testing that should automatically be run after the unit test phase. However, these additional testing phases are not yet in place, and so are not currently documented.

We use **mocha** to execute our JavaScript unit tests, and these unit tests can be executed locally with `npm test`. All JavaScript code should include unit tests that can be run without requiring a running Hyperledger Fabric.

We use the testing package built into Go for our Go unit tests, and these unit tests can be executed with `go test`. All Go code (primarily chain-code) should include unit tests that can be run without requiring a running Hyperledger Fabric.

Unit tests should aim for 100% code coverage. For JavaScript code, we use Istanbul is used to ensure that the unit tests meet minimum levels of code coverage.

### Documentation

We use **jsdoc** for our API documentation. If you change APIs, update the documentation. Note that the linter settings
will enforce the use of JSDoc comments for all methods and classes. We use these comments to generate high-quality
documentation and UML diagrams from source code. Please ensure your code (particularly public APIs) are clearly
documented.

### Pull requests

*Before* submitting a pull request, please make sure the following is done:

1. Fork the repo and create your branch from `develop`.
2. If you've added code that should be tested (always), add tests!
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes (`npm test` and `go test`).
5. Make sure your code lints.

## Style guide

Our linter **eslint** will catch most styling issues that may exist in your code. You can check the status of your code styling by simply running `npm lint`.

### Code conventions

* 4 spaces for indentation (no tabs)
* Prefer `'` over `"`
* `'use strict';`
* JSDoc comments are required
