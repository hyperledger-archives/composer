# Composer-Playground
The UI for Hyperledger Composer

Check that the versions of 

docker-compose build && docker-compose up -d

You must install [Lerna](https://lernajs.io) to build this multi-package repository:

    $ npm install -g lerna@2.0.0 

You must bootstrap the repository so that all of the dependencies are installed and all of the packages are linked together:

    $ lerna bootstrap

You can then work with the packages under [packages/](packages/) on a per-package
basis as any normal node.js package.

Alternatively, you can execute npm commands across all of the packages at once using
Lerna:

    $ lerna run test

You're now ready to start with the Hyperledger Composer project. 

    $ npm start

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.