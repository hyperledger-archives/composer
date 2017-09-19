# Composer-Playground
The UI for Hyperledger Composer

Check that the versions of 

docker-compose build && docker-compose up -d

You must run the following commands in order to pull the Hyperledger fabric chaincode dependencies from their repositories:

    $ git submodule init
    $ git submodule update

You should see messages indicating that the required git repositories have been cloned into the correct vendor subdirectory.

You must install [yarn](https://yarnpkg.com/) and [Lerna](https://lernajs.io) to build this multi-package repository:

    $ npm install -g lerna@2.0.0

    $ curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version 1.1.0

You must run yarn install from the root of the mono repository, so that all of the dependencies are installed and all of the packages are linked together:

    $ yarn install

You can then work with the packages under [packages/](packages/) on a per-package
basis as any normal node.js package.

Alternatively, you can execute npm commands across all of the packages at once using
Lerna:

    $ lerna run test

You're now ready to start with the Hyperledger Composer project. 

    $ npm start
