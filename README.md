# Fabric Composer

Fabric Composer is an application development framework which simplifies and expedites the creation of [Hyperledger fabric](https://hyperledger-fabric.readthedocs.io/en/latest/) blockchain applications. If you're new to Blockchain, Hyperledger fabric or Fabric Composer, we recommend that  you start at the [Fabric composer website](https://fabric-composer.github.io). This site will help you get up and running by developing a sample blockchain application to buy and sell houses and apartments in a digital property business network.

[![Build Status](https://travis-ci.org/hyperledger/composer.svg?branch=master)](https://travis-ci.org/hyperledger/composer)

For additional help with Fabric Composer the following are good places

- Ask a question on [Stack Overflow](http://stackoverflow.com/questions/tagged/fabric-composer)
- Chat on the RocketChat [discussion channels](https://chat.hyperledger.org/channel/fabric-composer)

# Contributing to this repository

*Please read the contributing notes before starting. There is a [specific channel](https://chat.hyperledger.org/channel/fabric-composer-dev) on RocketChat for contributors*

To start development of Fabric Composer, first clone this repository.

You must run the following commands in order to pull the Hyperledger fabric chaincode dependencies from their repositories:

    $ git submodule init
    $ git submodule update

You should see messages indicating that the required git repositories have been cloned into the correct vendor subdirectory.

> The git submodule should not be required now, they have been added to the npm install step. When this has been confirmed as working well, this will be updated.

You must install [Lerna](https://lernajs.io) to build this multi-package repository:

    $ npm install -g lerna@2.0.0-beta.38

You must bootstrap the repository so that all of the dependencies are installed and all of the packages are linked together:

    $ lerna bootstrap

You can then work with the packages under [packages/](packages/) on a per-package
basis as any normal node.js package.

Alternatively, you can execute npm commands across all of the packages at once using
Lerna:

    $ lerna run test

You're now ready to start with the Fabric Composer project.
