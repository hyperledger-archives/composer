# Getting started developing Fabric Composer

This guide will help you start to contribute to the Fabric Composer project. It will show you how to set up your local environment and walk through the development, code, test and deploy process. You will do this by creating a small change of your own.

Please note that this is the **Getting Started** for developing Fabric Composer itself, and not a guide to developing applications **using** Fabric Composer.  (Though a lot of the tool chain will be useful for that purpose as well).

## Setup scripts

The requirements for developing Fabric Composer are the same as developing an application using Fabric Composer. Follow these [instructions](https://fabric-composer.github.io/tasks/prerequisites.html)  

If you wish to install manually or review the indiviual tool's own documentation the details are below.

## Tool Chain reference details
This is a summary of the tools that will be required to work on Fabric Composer. Other tools are required but these will be installed automatically.  

- **Git** This is probably already installed on most Linux machines. Setup is well documented on the [ibm.git website](https://help.github.com/enterprise/2.7/user/articles/set-up-git/) . Pay particular attention to[ setting up the SSL keys](https://help.github.com/enterprise/2.7/user/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/#platform-linux) that are required.

- **Docker** Essential for the running of the tests and for running the HyperLedger Fabric.
	- Ubuntu: Firstly the Docker Engine needs to be [installed](https://docs.docker.com/engine/installation/linux/ubuntulinux/), then the [docker-compose tool](https://docs.docker.com/compose/install/) is required with these instructions. Some initial notes on administering docker are [here](https://docs.docker.com/engine/admin/)

- **Node.js  v6** The main runtime of Fabric Composer and also has the NPM tool that is used for a lot of the package management.
	- Ubuntu: Simply installed [follow these notes](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions).


## Forking and cloning the Fabric Composer repository

Once those tools are installed you are ready to get going with the Fabric Composer repository.Let's show you how to create your own version of the Fabric Composer repository in GitHub, and clone it to your local machine to allow you to make your own changes, which you can subsequently contribute to the Fabric Composer project.

- Navigate to the [Fabric Composer organization](https://github.com/fabric-composer) on GitHub to see the
different repositories.
- Select the [fabric-composer repository](https://github.com/fabric-composer/fabric-composer)
- Click on the `Fork` button to fork this repository to your user space.
- Navigate to your home page on GitHub, you'll be able to see your fork of the fabric-composer repository.

## Choosing a location for your clone

If this is your first Git project then you might like to spend a few moments creating a specific directory for all your local git repositories, e.g. ``~/github/`` on unix file systems, which will put the project under your home directory, which is good default location.   Windows note: this will all be done in the git bash shell that was installed for you.

```bash
mkdir -p ~/github
cd ~/github
```

_IMPORTANT_ Do NOT have any directory in the path to the git repository directory you just created, start with a _  (underscore). This is due to the way that the JavaScript documentation tool handles filtering path names. If you do this, then the tool reports there are no source files to produce documentation for.

Final step is to issue the clone command. This format is assuming that you have setup the ssh keys for GitHub.

```bash
git clone git@github.ibm.com:<your-username>/fabric-composer.git
cd fabric-composer
```

### Hyperledger code dependencies

There is a temporary requirement for Fabric Composer to include the Hyperledger source code in its project directory. The following commands will pull the code from the Hyperledger code repository, as defined in the `.gitmodules` file in the Fabric Composer project directory.

```bash
git submodule init
git submodule update
```

You can see where the Hyperledger source code is pulled from; it is saved in the `.git` directory of the Fabric Composer project.

## Installing Fabric Composer prerequisites

Fabric Composer has a number of prerequisites - for its runtime, code hygiene, tests, API documentation, and more.  Before you can develop locally, you need to install these using [npm](https://www.npmjs.com/). These prerequisites are installed as development dependencies. The packages are installed locally rather than globally, so that their versions do not interfere with other projects you may be developing, or global installations of these packages on your local machine.  You can also install these prerequisites globally, though it is required to have some packages locally, e.g. the test framework.

### Installing the npm dependencies

You must install [Lerna](https://lernajs.io) to build this multi-package repository:

    $ npm install -g lerna@2.0.0-beta.32

You must bootstrap the repository so that all of the dependencies are installed and all of the packages are linked together:

    $ lerna bootstrap

You can then work with the packages under [packages/](packages/) on a per-package
basis as any normal node.js package.

Alternatively, you can execute npm commands across all of the packages at once using
Lerna:

    $ lerna run test

We'll now step through each of these prerequisite packages installed by npm to explain what they do. You can [skip this section](#verify) if you are already familiar with these tools.

To clean the updates

    $ lerna clean

### Good coding practices using ESLint

Fabric Composer uses a utility to ensure the codebase conforms to good language practice. Fabric Composer is written in both `node.js` and `golang`, with [ESLint](http://eslint.org/) being used for `node.js`.

The Fabric Composer project includes a set of lint definitions in its initialization file ``.eslintrc.yml`` that will be used whenever lint is run, so you should use the one in the Fabric Composer project, as it contains the default Fabric Composer configurations.

### API documentation using JSDoc

Fabric Composer automatically generates its API documentation from the source code with appropriate annotations using [JSDoc](https://en.wikipedia.org/wiki/JSDoc).  It helps keep the API documentation up-to-date and accurate. PLEASE note the comment at the top regarding the naming of the directory path that contains the git repository. JSDoc filename filters apply to the absolute and not relative path. In summary, don't start any directory with _

### Code coverage using istanbul

The Fabric Composer project uses a code coverage tool called [Istanbul](https://github.com/gotwarlost/istanbul)  to ensure that all the code is tested, including statements, branches and functions. This helps to improve the quality of the Fabric Composer tests.

### Unit Test Framework using mocha

Fabric Composer requires that all code added to the project is provided with unit tests. These tests operate inside a test framework called [mocha]() which controls their execution. Mocha is triggered every time code is pushed to either a user's repository or the Blockchain-WW-Labs Fabric Composer repository.

### System Test Framework using cucumber

Fabric Composer is investigating the use of [cucumber](https://www.npmjs.com/package/cucumber) to for system or integration test.  In contrast to unit tests, these tests are focussed on verifying end-user functionality in a realistic environment.

### Simplify writing tests using the chai assertion library, chai-things and sinon

All code that is contributed to Fabric Composer must have tests associated with it. Fabric Composer tests uses an assertion library called [chai](http://chaijs.com/) to help write these tests, which run in the mocha. Chai allows developers to easily write tests that verify the behaviour of their code using `should`, `expect` and `assert` interfaces.  [chai-things](https://www.npmjs.com/package/chai-things) is a chai extension which helps writing units tests involving arrays.  Fabric Composer sometimes relies on external systems like Hyperledger and to enable the creation of unit tests, Fabric Composer [sinon](https://www.npmjs.com/package/sinon) to create realistic units tests which do not draw in huge amounts of infrastructure.  sinon has technology called "test spies", "stubs" and "mocks" which greatly help this process.

### JavaScript Parsing using acorn

Fabric Composer provides its programming interfaces in JavaScript, and also has the ability to uses JavaScript to express user processing rules which are executed as smart contracts.  [acorn](https://www.npmjs.com/package/acorn) is a JavaScript parsing library that significantly assist this process.

### Checking of files for Fabric Composer license agreement using license-check

Fabric Composer source files are is provided under a license agreement which provides the appropriate level of intellectual property protection, and [license-check](https://www.npmjs.com/package/license-check) is used to enforce that the same agreement terms is in every Fabric Composer file.  These license terms may change during the development lifecycle according to the commercial and community needs of the Fabric Composer.

### Your development environment is ready!

You are now ready to try out your local clone of the Fabric Composer project.

## Testing your local environment

To verify that your local environment is ready for development and to confirm later that the updates are good, run the built-in unit tests provided with the Fabric Composer project.  

    $ lerna run test

This will run the unit tests that are associated with all the modules.
