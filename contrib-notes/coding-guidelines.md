# Contributing to Composer
* [Step-by-step development environment setup](./getting-started.md)
* [Suggested IDE setup](./ide-setup.md)
* Currently reading ->  [Coding Guidelines](./coding-guidelines.md)
* [Pull Request Guidelines](./submitting-pull-request.md)
* [Release process](./release-process/weekly-qa-validation.md)

# Coding Guidelines

As a summary:

 - All changes should be developed in a fork of the relevant Hyperledger Composer repository, and the changes submitted for approval in the form of pull requests.
 - All commits require DCO sign-off
 - All pull request must be linked to an issue
 - All delivered code must follow the linting rules
 - All features or bug fixes must be tested.
 - All public API methods must be documented.
 - Travis-ci is used to build and test all repositories and a build is triggered when a pull request is made. Any pull request that is not 100% clean will be closed.

## GitHub usage

Here is the preferred workflow involved in making a pull request to the Composer Project - this is based around making a change in the `hyperledger/composer repository`. The same would apply for any of the other related repositories.

A first step is ensuring that you have a local development environment configured.

- You must fork the `hyperledger/composer` repository to your own github organization. This is most easily achieved using the [github web-ui](https://help.github.com/articles/fork-a-repo/).
- Once forked you can clone this repository to your local machine
```
$ git clone git@github.com:MyGitName/composer.git
```
- This will configure the `origin` to be your fork of the Composer repository. You must create an `upstream` target to refer to main Composer repository. [the terms origin and upstream are conventions and could be anything. But as in any convention the purpose is to avoid confusion]
```
$ git remote add upstream git@github.com:hyperledger/composer.git
```
- As this is just forked it will be up-to-date. But if you did this previously and now starting on something new, the the next step is to update your master branch.

  *This is the point you would come to generally when starting anything new, a new clone/fork every time is not necessary*

```
$ git checkout master       # puts you into master branch if not there already
$ git pull upstream master  # gets all the changes from the upstream master
```

- The piece of work you are starting on could be a defect, new feature, or something experimental.  The approach is the same for any these and requires working in a new branch.
```
$ git checkout -b defect-1234    # Including reference to the git issue is useful
```
- As you commit changes to your local repository ensure you provide sign-off for that commit using the `-s` option of
`git commit`. For more information see https://github.com/probot/dco#how-it-works

- Time passes, and you now have a change that you are happy with. Next step is to push this to your local repository. First step is to ensure that your branch is update.
```
$ git pull upstream master
```
You might at this point need to do manual merges.
- **Retest to ensure everything is Good**
- Push these changes to your local fork
```
$ git push origin defect-1234   # note the branch you have been working on
```
- The next step is to go to the Github web-ui and create a pull request to the master repository for this fork.
- ...screen shots needed here - wip...
- All Pull Requests should be linked to the issue they are addressing
- All Pull Requests should have a review by another comitter on the Composer project
- Any API, CLI, or major change should be mentioned to a maintainer to ensure consistency

### Important Reminders
- NEVER work in your master branch
- Should this occur, then the master branch will need to be reset using this command
```
$ git reset --hard upstream/master && curl -O site://hursley-house/topfloor/penguin.penance
```

## Development approach

### Adding new Features

We welcome contributions of new features. Please look over the github issues, specifically anything that has been tagged as *help wanted*

When you start working on new issue, please do the following:

- Use the [mailing list](https://lists.hyperledger.org/mailman/listinfo/hyperledger-composer) to notify the community that you are planning to start _feature_ work and notify that the design has been placed in the GitHub issue
  - this is to ensure that there is a persistent record of what is happening
- Say hello, on the composer-dev channel on RocketChat


### Good Coding Practices Using ESLint

Hyperledger Composer uses a utility to ensure the codebase conforms to good language practice. Hyperledger Composer is written in both `node.js` and `golang`, with [ESLint](http://eslint.org/) being used for `node.js`.

The Hyperledger Composer project includes a set of lint definitions in its initialization file ``.eslintrc.yml`` that will be used whenever lint is run, so you should use the one in the project, as it contains the default configurations.

### API Documentation Using JSDoc

Hyperledger Composer automatically generates its API documentation from the source code with appropriate annotations using [JSDoc](https://en.wikipedia.org/wiki/JSDoc). It helps keep the API documentation up-to-date and accurate. PLEASE note the comment at the top regarding the naming of the directory path that contains the git repository. JSDoc filename filters apply to the absolute and not relative path. In summary, don't start any directory with _

If you change APIs, update the documentation. Note that the linter settings will enforce the use of JSDoc comments for all methods and classes. We use these comments to generate high-quality documentation and UML diagrams from source code. Please ensure your code (particularly public APIs) are clearly documented.

## Testing

All changes pushed to Hyperledger Composer must include unit tests that ensure that the new functionality works as designed, or that fixed bugs stay fixed. Pull requests that add code changes without associated automated unit tests will **not** be accepted. Unit tests should aim for 100% code coverage and may be run locally with `npm test`.

Our current test suites make use of:

 - [Mocha](https://mochajs.org/)
 - [Chai](http://chaijs.com/)
 - [Karma](https://karma-runner.github.io/1.0/index.html)
 - [Jasmine](https://jasmine.github.io/)
 - [Istanbul](https://gotwarlost.github.io/istanbul/)

### Unit Test Framework Using Mocha

Hyperledger Composer requires that all code added to the project is provided with unit tests. These tests operate inside a test framework called [mocha](https://mochajs.org/) which controls their execution. Mocha is triggered every time code is pushed to either a user's repository or the Hyperledger Composer repository.

### Unit Test Framework using Karma and Jasmine
The default configuration is set to target the Chrome browser, and this is the target browser during the build process. Unit tests should rigorously test controller files and where appropriate inspect the view to ensure that mapped logic is operating as expected.

### Simplify writing tests using the chai assertion library, chai-things and sinon

Hyperledger Composer tests use an assertion library called [chai](http://chaijs.com/) to help write these tests, which run in the mocha. Chai allows developers to easily write tests that verify the behaviour of their code using `should`, `expect` and `assert` interfaces. [chai-things](https://www.npmjs.com/package/chai-things) is a chai extension which helps writing units tests involving arrays. Hyperledger Composer sometimes relies on external systems like Hyperledger and to enable the creation of unit tests, Hyperledger Composer [sinon](https://www.npmjs.com/package/sinon) to create realistic units tests which do not draw in huge amounts of infrastructure.  sinon has technology called "test spies", "stubs" and "mocks" which greatly help this process.

### Code Coverage Using Istanbul

The Hyperledger Composer project uses a code coverage tool called [Istanbul](https://gotwarlost.github.io/istanbul/) to ensure that all the code is tested, including statements, branches, and functions. This helps to improve the quality of the Hyperledger Composer tests. The output of Istanbul can be used to see where any specific tests need to be added to ensure complete code coverage.

### How to run a local development version of the Playground UI
In order to run Playground UI locally you can:
- Run `scripts/devStart.sh` in the _composer-playground-api_ package; followed by
- Run `npm start` in the _composer-playground_ package
- Visit `localhost:3000` from your browser

The `devStart.sh` script above sets up a local (Verdaccio) npm registry and populates it with development versions of
Composer packages required for deployment to Fabric to work in a local development environment.

### How to run local code inside a real fabric
When fabric builds the image for the chaincode container, it does this by doing an npm install against the package.json
of the business network archive. The install process adds required dependencies on Composer packages to the package.json,
referring to the Composer version used to perform the install. This causes an issue during development since the local
Composer version used to perform the install is one that has not yet been published to the public npm registry, and so
these dependencies cannot be resolved when the business network is started.

A solution to this problem is to package the dependencies required at runtime within the business network archive before
install. To achieve this:

1. Local versions of the following packages should be packaged up using the `npm pack` command:
   - `composer-common`
   - `composer-runtime`
   - `composer-runtime-hlfv1`
2. The package.json of the business network archive updated to refer to these package files on the local file system.

The install process will include these packaged dependencies in the chaincode sent to the Fabric peer.

The following script can be used to create npm packages (ending in _-dev.tgz_) of the required dependencies in the
current working directory, once the `packageDir` variable has been changed to point to the location of the Composer
packages in your development environment.
```bash
#!/bin/bash

localDir="$(pwd)"
packageDir="${HOME}/DEV_DIRECTORY/composer/packages"

for dependency in composer-common composer-runtime composer-runtime-hlfv1; do
    cd "${packageDir}/${dependency}"
    packFile="$(npm pack | tail -1)"
    echo "Created pack file: ${packFile}"
    mv "${packFile}" "${localDir}/${dependency}-dev.tgz"
done
```

The package.json of your business network archive then needs the following dependencies added, which should point to
the actual location of the packages files on your file system.
```javascript
"dependencies": {
  "composer-common": "/PATH/TO/composer-common-dev.tgz",
  "composer-runtime": "/PATH/TO/composer-runtime-dev.tgz",
  "composer-runtime-hlfv1": "/PATH/TO/composer-runtime-hlfv1-dev.tgz"
}
```

Note that the `composer archive create` command will (currently) fail if used to create a new BNA file from a directory
containing a package.json with the package file dependencies above. Instead, just unzip a previously created BNA file,
modify the package.json and zip up again to create the BNA.

A business network archive containing package dependencies can be installed to Fabric directly using the
`composer network install` command. The following provides steps by example on how to do this.

- Ensure you have the latest fabric-dev-servers package
- Start the Fabric using `./startFabric.sh`
- Create and import your PeerAdmin card if you haven't done so before using `./createPeerAdmin.sh`
- Install your pre-prepared business network archive
```
node composer-cli/cli.js network install -c PeerAdmin@hlfv1 -a test-network@0.0.1.bna`
```
- instantiate the chaincode.
```
node composer-cli/cli.js network start -c PeerAdmin@hlfv1 -n test-network -V 0.0.1 -A admin -S adminpw
```

# Next step
Move on to read [Pull Request Guidelines](./submitting-pull-request.md)

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.
