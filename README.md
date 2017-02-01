# Fabric Composer
Fabric Composer is an application development framework which simplifies and expedites the creation of [Hyperledger fabric](https://hyperledger-fabric.readthedocs.io/en/latest/) blockchain applications. If you're new to Blockchain, Hyperledger fabric or Fabric Composer, we recommend that  you start at the [GitHub pages website](https://fabric-composer.github.io). This site will help you get up and running by developing a sample blockchain application to buy and sell houses and apartments in a digital property business network.

# Using this repository

You must install [Lerna](https://lernajs.io) to build this multi-package repository.

    $ npm install -g lerna

Once Lerna is installed, and this repository is cloned, then you must bootstrap the
repository so that all of the dependencies are installed and all of the packages are
linked together:

    $ lerna bootstrap

You can then work with the packages under [packages/](packages/) on a per-package
basis as any normal node.js package.

Alternatively, you can execute npm commands across all of the packages at once using
Lerna:

    $ lerna run test

You must run the following commands in order to pull the chaincode dependencies down from their repositories:

    $ git submodule init
    $ git submodule update

You should see messages indicating that the required git repositories have been cloned into the correct
vendor subdirectory.
