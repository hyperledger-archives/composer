To start development of Hyperledger Composer, first clone this repository.

  $ git clone git@github.com:hyperledger/composer.git

You must install [Lerna](https://lernajs.io) to build this multi-package repository:

    $ npm install -g lerna@2.0.0-beta.38

The `lerna boostrap` that is required as been included as a target in the `npm run` scripts. Therefore just issue a

   $ cd composer
   $ npm install

You can then work with the packages under [packages/](packages/) on a per-package basis as any normal node.js package.

To run the whole test suite

    $ npm test

You're now ready to start with the Hyperledger Composer project.
