# Contributing to Composer

* Currently reading -> [Step-by-step development environment setup](./getting-started.md)
* [Suggested IDE setup](./ide-setup.md)
* [Coding Guidelines](./coding-guidelines.md)
* [Pull Request Guidelines](./submitting-pull-request.md)
* [Release process](./release-process/weekly-qa-validation.md)


# Getting Started Developing Hyperledger Composer

This guide will help you start to contribute to the Hyperledger Composer project. It will show you how to set up your local environment and walk through the development, code, test and deploy process. You will do this by creating a small change of your own.

Please note that this is the **Getting Started** for developing Hyperledger Composer itself, and not a guide to developing applications **using** Hyperledger Composer.  (Though a lot of the tool chain will be useful for that purpose as well).

After reading this guide, move on to reading the [coding-guidelines](./coding-guidelines.md) that will explain in more detail the process to follow to make changes.

## Setup Scripts

The requirements for developing Hyperledger Composer are the same as developing an application using Hyperledger Composer. Follow these [instructions](./prerequisites.md)

If you wish to install manually or review the individual tool's own documentation the details are below.

## Tool Chain Reference Details
This is a summary of the tools that will be required to work on Hyperledger Composer. Other tools are required but these will be installed automatically.

- **Git** This is probably already installed on most Linux machines. Setup is well documented on the [ibm.git website](https://help.github.com/enterprise/2.7/user/articles/set-up-git/) . Pay particular attention to[ setting up the SSL keys](https://help.github.com/enterprise/2.7/user/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/#platform-linux) that are required.

- **Docker** Essential for the running of the tests and for running the HyperLedger Fabric.
    - Ubuntu: Firstly the Docker Engine needs to be [installed](https://docs.docker.com/engine/installation/linux/ubuntulinux/), then the [docker-compose tool](https://docs.docker.com/compose/install/) is required with these instructions. Some initial notes on administering docker are [here](https://docs.docker.com/engine/admin/)

- **Node.js v8.9 or higher (but not node v9)** The main runtime of Hyperledger Composer and also has the NPM tool that is used for a lot of the package management.
    - Ubuntu: Simply installed [follow these notes](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions).

- **Chrome** Web test suites use **karma** to launch a browser, and consequently **Chrome** must be installed to prevent test failures without editing the karma configuration to use a supported browser that you already have installed.

- **softhsm 2.0.0** required for the complete integration tests to run as well as a specific set of functional tests. 
   - If you are on Linux first you need to install the openssl headers if not already installed, for example on Ubuntu
```
# install the openssl headers
sudo apt-get -y install libssl-dev
# install softhsm
mkdir softhsm
cd softhsm
curl -O https://dist.opendnssec.org/source/softhsm-2.0.0.tar.gz
tar -xvf softhsm-2.0.0.tar.gz
cd softhsm-2.0.0
./configure --disable-non-paged-memory --disable-gost
make
sudo make install

# now configure slot 0 with pin
sudo mkdir -p /var/lib/softhsm/tokens
sudo chmod 777 /var/lib/softhsm/tokens
softhsm2-util --init-token --slot 0 --label "ForComposer" --so-pin 1234 --pin 98765432
```
On linux the pkcs library you need to reference is usually placed at `/usr/local/lib/softhsm/libsofthsm2.so`

   - For MAC, you might want to consider something like `homebrew` which can provide pre-built versions of softhsm. Make sure you specifically choose 2.0.0 rather than the latest version available. Alternatively you can build softhsm from source yourself but you would either need to obtain a prebuilt version of openssl with libraries and headers again from something like `homebrew` or you could compile openssl from source. 

   - More details about softhsm can be found at https://www.opendnssec.org/softhsm/

## Forking and Cloning the Hyperledger Composer Repository

Once those tools are installed you are ready to get going with the Hyperledger Composer repository. Let's show you how to create your own version of the Hyperledger Composer repository on GitHub, and clone it to your local machine to allow you to make your own changes, which you can subsequently contribute to the Hyperledger Composer project.

- Navigate to the [Hyperledger Project](https://github.com/hyperledger) on GitHub to see the
different Hyperledger Composer repositories.
- Select the [Hyperledger Composer repository](https://github.com/hyperledger/composer)
- Click on the `Fork` button to fork this repository to your user space.
- Navigate to your home page on GitHub, you'll be able to see your fork of the repository.

## Choosing a Location For Your Clone

If this is your first Git project then you might like to spend a few moments creating a specific directory for all your local git repositories, e.g. ``~/github/`` on unix file systems, which will put the project under your home directory, which is good default location. Windows note: this will all be done in the git bash shell that was installed for you.

```bash
$ mkdir -p ~/github
$ cd ~/github
```

_IMPORTANT_ Do NOT have any directory in the path to the git repository directory you just created, start with a _  (underscore). This is due to the way that the JavaScript documentation tool handles filtering path names. If you do this, then the tool reports there are no source files to produce documentation for.

The final step is to issue the clone command. This format is assuming that you have setup the ssh keys for GitHub.

```bash
$ git clone git@github.com:<your-username>/hyperledger/composer.git
$ cd composer
```

## Installing Hyperledger Composer Prerequisites

Hyperledger Composer has a number of prerequisites - for its runtime, code hygiene, tests, API documentation, and more.  Before you can develop locally, you need to install these using [npm](https://www.npmjs.com/). These prerequisites are installed as development dependencies. The packages are installed locally rather than globally so that their versions do not interfere with other projects you may be developing or global installations of these packages on your local machine.  You can also install these prerequisites globally, though it is required to have some packages locally, e.g. the test framework.

To install these dependencies, ensure you are in the top level directory of the composer repository you have just cloned and issue

```bash
$ npm install
```

You can then work with the packages under [packages/](packages/) on a per-package
basis as any normal node.js package.

Alternatively, you can execute npm commands across all of the packages from the top level of the Composer
repository, for example:

    $ npm test

To clean the updates

    $ npm run repoclean


### Your development environment is ready!

You are now ready to try out your local clone of the Hyperledger Composer project.

## Testing your local environment

To verify that your local environment is ready for development and to confirm later that the updates are good, run the built-in unit tests provided with the Hyperledger Composer project.

    $ npm test

This will run the unit tests that are associated with all the modules.

## Next step
Moving on to read

* [Suggested IDE setup](./ide-setup.md)
* [Coding Guidelines](./coding-guidelines.md)

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.