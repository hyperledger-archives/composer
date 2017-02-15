# Getting started developing Concerto

This guide will help you start to contribute to the Concerto project. It will show you how to set up your local environment and walk through the development, code, test and deploy process. You will do this by creating a small change of your own, for sharing with the Concerto community.

This guide should take you around 1-2 hour to complete, depending on what tools you already have installed on your workstation. Linux such as Ubuntu or Mac are recommended. Whilst is it possible to do quite on Windows (Windows 10 should be simpler) it is not a natural fit. There are some [suggestions](http:///tbd.com) for how to manage if you have a Windows workstation.



Please note that this is the **Getting Started** for developing Concerto itself, and not a guide to developing applications **using** Concerto.  (though a lot of the tool chain will be useful for that purpose as well).

## Tool Chain details
This is a summary of the tools that will be required to work on Concerto. Other tools are required but these will be installed automatically.  Suggest that you install these first by following the links provided below.

- **Git** This is probably already installed on most Linux machines. Setup is well documented on the [ibm.git website](https://help.github.com/enterprise/2.7/user/articles/set-up-git/) . Pay particular attention to[ setting up the SSL keys](https://help.github.com/enterprise/2.7/user/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/#platform-linux) that are required.
  - Windows: The codebase uses LF as the line terminator; easier therefore to set the git client to keep this when working. Most editors and Windows are tolerant of just LF.  This command will set git globally to use convert CRLF to LF for any file committed, and to keep files using LF when cloned.
```bash
git config --global core.autocrlf
```
- **Docker** Essential for the running of the tests and for running the HyperLedger Fabric.
	- Ubuntu: Firstly the Docker Engine needs to be [installed](https://docs.docker.com/engine/installation/linux/ubuntulinux/), then the [docker-compose tool](https://docs.docker.com/compose/install/) is required with these instructions. Some initial notes on administering docker are [here](https://docs.docker.com/engine/admin/)
	- Windows 7: This is where things start to struggle on Windows. Docker can be installed following the notes provided on the[ Docker website](https://docs.docker.com/docker-for-windows/). However the commands don't quite have same syntax, and the method bridging of the networks is a yet to be correctly determined.  (The docker images run a vm that is running on Windows)
	- Windows 10: Not yet tried but hopefully should be improved.
- **Node.js  v4.6** The main runtime of Concerto and also has the NPM tool that is used for a lot of the package management.
	- Ubuntu: Simply installed [follow these notes](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions).
	- Windows: Just as simple [follow these notes](https://nodejs.org/en/download/package-manager/#windows)
- ** Pythong and C compiler**
	- Ubuntu: this is not an issue as these should come with the systems
	- Windows: if this is not resolved this will appear to be a problem with installing from NPM as [documented here.](http://stackoverflow.com/questions/21365714/nodejs-error-installing-with-npm).  When you have the equivalents installed ensure that the path to the Python exe is specified using the following (note the /c bit is a specifc symbolic link I have my system - this will need to be modified as per you installation directory)
	```bash
	set PYTHON=/c/_tools/Python27
	```

### Installing an editor, Atom recommended

The Concerto project allows you to edit its project files with any editor.  [Atom](https://atom.io/) is a very popular editor and several [contributors](https://github.ibm.com/orgs/Blockchain-WW-Labs/teams/technical-team) use it. [Install](https://atom.io/) atom, and when you have done so, you are required to turn of Google analytics if you work for IBM. Navigate to Atom->Preferences->Packages, search and find the `metrics` package and disable it.

Other links:

	- Ubuntu: Not offical Atom docs, but [simple to follow](http://tipsonubuntu.com/2016/08/05/install-atom-text-editor-ubuntu-16-04/)
	- Windows:  Folllow these notes on the [atom website](http://flight-manual.atom.io/getting-started/sections/installing-atom/).  A portable version is also available for Windows

#### Concerto development and runtime, node.js

Concerto uses [node.js](https://nodejs.org/en/) as its programming language and runtime. We recommend you use the LTS version, and Concerto requires a version higher than v4.6.0.

Visit [node's download page](https://nodejs.org/en/download/) and install the LTS version of `node.js`.

#### Concerto containers, docker

Concerto uses [docker](https://www.docker.com/what-docker#/VM) to create a self-contained, portable environment for consistent behaviour on different platforms, including cloud.  [Install](https://docs.docker.com/) docker on your local machine.  


## Forking and cloning the Concerto repository

Once those tools are installed you are ready to get going with the Concerto repository.
Let's show you how to create your own version of the Concerto repository in GitHub, and clone it to your local machine to allow you to make your own changes, which you can subsequently contribute to the Concerto project.

Navigate to the [Blockchain-WW-Labs organization](https://github.ibm.com/Blockchain-WW-Labs) on GitHub to see the
different repositories for Blockchain solutions.  You'll see a page listing all the different projects

![github1](docs/source/png/github.screenshot1.png)

Select the [Concerto repository](https://github.ibm.com/Blockchain-WW-Labs/Concerto) you'll see the concerto project files.

![github2](docs/source/png/github.screenshot2.png)

You can see that the this Concerto repository is owned by the `Blockchain-WW-Labs` organization. Click on the `Fork` button to fork this repository to your user space.

If you navigate to your home page on GitHub, you'll be able to see your fork of the Concerto repository. It'll look very similar, but you'll see your user name in front of it.

## Choosing a location for your clone of the Concerto project

If this is your first Git project then you might like to spend a few moments creating a specific directory for all your local git repositories, e.g. ``~/git/`` on unix file systems, which will put the project under your home directory, which is good default location.   Windows note: this will all be done in the git bash shell that was installed for you.

```bash
mkdir -p ~/git
cd ~/git
```

Of course, if you have a different preference that's fine - just navigate to the parent location of where you wish the concerto project directory to be located.  In the above example that is the  ``~/git/`` directory.

_IMPORTANT_ Do NOT have any directory in the path to the git repository directory you just created, start with a _  (underscore). This is due to the way that the JavaScript documentation tool handles filtering path names. If you do this, then the tool reports there are no source files to produce documentation for.

Clone your fork of the Concerto project to your local machine.  Windows: ensure that your git setup is such that the files are not translated to the CRLF format. Atom displays the state of any file in the bottom right corner. Double check on any .js file in the lib directory tree.

```bash
git clone git@github.ibm.com:<your-username>/Concerto.git
cd Concerto
```

You now have a local copy of the Concerto repository which can be used to help build your contributions to the Concerto project.

### Hyperledger code dependencies

There is a temporary requirement for Concerto to include the Hyperledger source code in its project directory. The following commands will pull the code from the Hyperledger code repository, as defined in the `.gitmodules` file in the Concerto project directory.

```bash
git submodule init
git submodule update
```

If you're interested in how this command works, look at the `.gitmodules` file to see the details of the location of the Hyperledger source code. It looks something like this:

```bash
[submodule "chaincode/src/concerto/vendor/github.com/hyperledger/fabric"]
	path = chaincode/src/concerto/vendor/github.com/hyperledger/fabric
	url = https://github.com/hyperledger/fabric
	branch = v0.6
```  

You can see where the Hyperledger source code is pulled from; it is saved in the `.git` directory of the Concerto project.

## Installing Concerto prerequisites

Concerto has a number of prerequisites - for its runtime, code hygiene, tests, API documentation, and more.  Before you can develop locally, you need to install these using [npm](https://www.npmjs.com/) which is a part of the . These prerequisites are installed as development dependencies to enable you to develop the Concerto code. The packages are installed locally rather than globally, so that their versions do not interfere with other projects you may be developing, or global installations of these packages on your local machine.  You can also install these prerequisites globally, though it is required to have some packages locally, e.g. the test framework.

### Installing the npm dependencies

To install all the Concerto `node.js` dependencies in a single step, use the standard `npm install` mechanism.

```bash
npm install
```

You can see the exact versions of each prerequisite package in the `package.json` file in the top level Concerto directory, which will look something like this

```bash
"devDependencies": {
  "acorn": "^4.0.3",
  "chai": "^3.5.0",
  "chai-things": "^0.2.0",
  "cucumber": "^1.3.0",
  "eslint": "^3.5.0",
  "istanbul": "^0.4.5",
  "jsdoc": "^3.4.1",
  "license-check": "^1.1.5",
  "mocha": "^3.0.2",
  "path": "^0.12.7",
  "sinon": "^1.17.6"
}
```

We'll now step through each of these prerequisite packages installed by npm to explain what they do. You can [skip this section](#verify) if you are already familiar with these tools.

### Good coding practices using ESLint

Concerto uses a utility to ensure the codebase conforms to good language practice. Concerto is written in both `node.js` and `golang`, with [ESLint](http://eslint.org/) being used for `node.js`.

The Concerto project includes a set of lint definitions in its initialization file ``.eslintrc.yml`` that will be used whenever lint is run, so you should use the one in the Concerto project, as it contains the default Concerto configurations.

### API documentation using JSDoc

Concerto automatically generates its API documentation from the source code with appropriate annotations using [JSDoc](https://en.wikipedia.org/wiki/JSDoc).  It helps keep the API documentation up-to-date and accurate. PLEASE note the comment at the top regarding the naming of the directory path that contains the git repository. JSDoc filename filters apply to the absolute and not relative path. In summary, don't start any directory with _

### Code coverage using istanbul

The Concerto project uses a code coverage tool called [Istanbul](https://github.com/gotwarlost/istanbul)  to ensure that all the code is tested, including statements, branches and functions. This helps to improve the quality of the Concerto tests.

### Unit Test Framework using mocha

Concerto requires that all code added to the project is provided with unit tests. These tests operate inside a test framework called [mocha]() which controls their execution. Mocha is triggered every time code is pushed to either a user's repository or the Blockchain-WW-Labs concerto repository.

### System Test Framework using cucumber

Concerto is investigating the use of [cucumber](https://www.npmjs.com/package/cucumber) to for system or integration test.  In contrast to unit tests, these tests are focussed on verifying end-user functionality in a realistic environment.

### Simplify writing tests using the chai assertion library, chai-things and sinon

All code that is contributed to Concerto must have tests associated with it. Concerto tests uses an assertion library called [chai](http://chaijs.com/) to help write these tests, which run in the mocha. Chai allows developers to easily write tests that verify the behaviour of their code using `should`, `expect` and `assert` interfaces.  [chai-things](https://www.npmjs.com/package/chai-things) is a chai extension which helps writing units tests involving arrays.  Concerto sometimes relies on external systems like Hyperledger and to enable the creation of unit tests, Concerto [sinon](https://www.npmjs.com/package/sinon) to create realistic units tests which do not draw in huge amounts of infrastructure.  sinon has technology called "test spies", "stubs" and "mocks" which greatly help this process.

### JavaScript Parsing using acorn

Concerto provides its programming interfaces in JavaScript, and also has the ability to uses JavaScript to express user processing rules which are executed as smart contracts.  [acorn](https://www.npmjs.com/package/acorn) is a JavaScript parsing library that significantly assist this process.

### Checking of files for Concerto license agreement using license-check

Concerto source files are is provided under a license agreement which provides the appropriate level of intellectual property protection, and [license-check](https://www.npmjs.com/package/license-check) is used to enforce that the same agreement terms is in every concerto file.  These license terms may change during the development lifecycle according to the commercial and community needs of the Concerto. In the first instance, Concerto is envisaged to be provided under a standard IBM license agreement ("Object Code Only" style) for intellectual property protection.

### Your development environment is ready!

You are now ready to try out your local clone of the Concerto project.

## <a name="verify"></a>Verifying your local environment

To verify that your local environment is ready for development, you can run the built-in unit tests provided with the Concerto project.  Concerto makes extensive use of [npm test](https://www.npmjs.com/package/test), the unit test runner.  

To understand the tests being run, look at the `scripts` section in the `package.json` files. The test command will run the pre- and post tests, which chain the other scripts as required. The file looks something like this

```bash
"scripts": {
  "pretest": "pegjs ./lib/parser/parser.pegjs && npm run lint",
  "test": "mocha  --recursive && istanbul cover --report cobertura --report html ./node_modules/mocha/bin/_mocha -- --recursive",
  "posttest": "istanbul check-coverage",
  "lint": "eslint .",
  "postlint": "npm run licchk",
  "licchk": "license-check",
  "postlicchk": "npm run doc",
  "doc": "jsdoc --pedantic --recurse -c jsdoc.conf -t ./node_modules/ink-docstrap/template .",
  "systest": "mocha -t 60000 systest && cucumber-js systest"
}
```

Run the tests for the Concerto project    

```bash
npm test
```

The output should look something like this

```bash
anthonys-mbp:Concerto anthonyodowd$ npm test

> ibm-concerto@0.0.1 pretest /Users/anthonyodowd/git/Concerto
> npm run lint


> ibm-concerto@0.0.1 lint /Users/anthonyodowd/git/Concerto
> eslint .


> ibm-concerto@0.0.1 postlint /Users/anthonyodowd/git/Concerto
> npm run doc


> ibm-concerto@0.0.1 doc /Users/anthonyodowd/git/Concerto
> jsdoc --pedantic .


> ibm-concerto@0.0.1 test /Users/anthonyodowd/git/Concerto
> istanbul cover --report cobertura --report html ./node_modules/mocha/bin/_mocha -- --reporter list


  ․ Concerto #version check version number: 1ms
  ․ Concerto #login check login: 0ms
  ․ Concerto #getAssetRegistry check asset registry: 0ms

  AssetRegistry
     #getAllAssetRegistries
       ✓ should perform a security check
       ✓ should throw when modelManager not specified
       ✓ should throw when factory not specified
       ✓ should throw when serializer not specified
       ✓ should invoke the chain-code and return the list of asset registries
       ✓ should handle an error from the chain-code

...
#deployChainCode
  ✓ should perform a security check
  ✓ should deploy the chain-code and return the result
  ✓ should handle an error from invoking the chain-code
  ✓ should handle an hfc transaction error from invoking the chain-code

	232 passing (2s)

=============================================================================
Writing coverage object [/Users/anthonyodowd/Documents/CTO/GitHub/a-o-dowd/Concerto/coverage/coverage.json]
Writing coverage reports at [/Users/anthonyodowd/Documents/CTO/GitHub/a-o-dowd/Concerto/coverage]
=============================================================================

=============================== Coverage summary ===============================
Statements   : 92.68% ( 734/792 )
Branches     : 86.36% ( 285/330 )
Functions    : 94.54% ( 173/183 )
Lines        : 92.68% ( 734/792 )
================================================================================

> composer@0.0.3 posttest /Users/anthonyodowd/Documents/CTO/GitHub/a-o-dowd/Concerto
> istanbul check-coverage
```

You might like to take a moment to walk through the output on your console and see the tools at work.

Navigate to the `Concerto/coverage` directory and look at the `index.html` file in your browser. It'll look something like this.

![istanbul1](docs/source/png/istanbul.screenshot1.png)

You can see the coverage statistics for statements, branches, functions and lines, and the requirement is to keep these close to 100% for each category.

## Running Concerto system tests locally

**Windows: Don't attempt this section, it won't work. **

We're now going to run more realistic system test, which use the Concerto API, on top of a running Hyperledger fabric.  
These tests are run using the `scripts/run-system-tests.sh` file, and you should spend a moment looking at this file; it uses docker to create 3 Hyperledger process containers - running a peer, membership services, and the system tests using the `npm systest` command.

Type the following Concerto script to set up the system test environment and execute the system tests. These tests will take longer to run!

```bash
./scripts/run-system-tests.sh
```

See if you can match the commands in the script with the output below.  

```bash
# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
 cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd
 dirname "${BASH_SOURCE[0]}"

# Shut down the Docker containers for the system tests.
cd "${DIR}/systest"
docker-compose kill && docker-compose down
Killing systest_vp0_1 ... done
Killing systest_membersrvc_1 ... done
Removing systest_vp0_1 ... done
Removing systest_membersrvc_1 ... done

# Pull and tag the latest Hyperledger Fabric base image.
docker pull hyperledger/fabric-baseimage:x86_64-0.1.0
x86_64-0.1.0: Pulling from hyperledger/fabric-baseimage
Digest: sha256:ac6a2784cfd028ae62f5688f4436f95d7a60eeacd8506eb303c9c6335328c388
Status: Image is up to date for hyperledger/fabric-baseimage:x86_64-0.1.0
docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest

# Start up the Docker containers for the system tests.
docker-compose build
membersrvc uses an image, skipping
vp0 uses an image, skipping
Building concerto
Step 1 : FROM node:argon
 ---> e8428963b85a
Step 2 : RUN mkdir -p /usr/src/app
 ---> Using cache
 ---> 4868b396534e
Step 3 : WORKDIR /usr/src/app
 ---> Using cache
 ---> 17c0ea1fc2be
Step 4 : COPY package.json /usr/src/app/
 ---> Using cache
 ---> 5a11866a586e
Step 5 : RUN npm install --quiet
 ---> Using cache
 ---> 15e3b4969647
Step 6 : COPY . /usr/src/app
 ---> 83b9729c1c37
Removing intermediate container 3564ada439b0
Successfully built 83b9729c1c37

# Run the system tests.
if [ "${TRAVIS}" = "true" ]; then
    docker-compose run -e CONCERTO_PEER_WAIT_SECS=30 -e CONCERTO_DEPLOY_WAIT_SECS=120 --rm concerto npm run systest
else
    docker-compose run --rm concerto npm run systest
fi
Creating systest_membersrvc_1
Creating systest_vp0_1

npm info it worked it ends with ok
npm info using npm@2.15.9
npm info using node@v4.6.0
npm info presystest composer@0.0.3
npm info systest composer@0.0.3

> composer@0.0.3 systest /usr/src/app
> mocha -t 0 systest && cucumber-js systest


  AssetRegistry system tests
Waiting 1 second for vp0 to start ...
Waiting 1 second for vp0 to start ...
Waiting 1 second for vp0 to start ...
Waiting 1 second for vp0 to start ...
vp0 has started
Calling Concerto.connect() ...
Called Concerto.connect()
Calling Concerto.login() ...
Called Concerto.login()
Calling Concerto.deploy() ...
Called Concerto.deploy()
    ✓ should return an empty list of asset registries
    ✓ should throw when getting a non-existent asset registry
    ✓ should add an asset registry (5038ms)
    ✓ should add an asset to the registry (10041ms)


  4 passing (1m)

Feature: Example feature

  Scenario: Trying it out
  ✓ Given I have an empty asset registry
  ✓ When I add the following asset to the asset registry:
      | uri               | data       |
      | http://some/asset | Some asset |
  ✓ Then the asset registry contains the following assets:
      | uri               | data       |
      | http://some/asset | Some asset |

1 scenario (1 passed)
3 steps (3 passed)
0m00.001s
npm info postsystest composer@0.0.3
npm info ok

# Shut down the Docker containers for the system tests.
docker-compose kill && docker-compose down
Killing systest_vp0_1 ... done
Killing systest_membersrvc_1 ... done
Removing systest_vp0_1 ... done
Removing systest_membersrvc_1 ... done

```

You can run all the Concerto tests (unit and system tests) if you use the `scripts/run-all-tests.sh`.  Have a look at this script for a moment, as we'll see it used later on.

Congratulations! You have now tun all the unit tests and system tests on your local machine. Let's now set up the test continuous integration environment, so that you can make code changes on your local clone, push them to your fork of Concerto, and have these same tests run automatically.

## Identifying your Concerto fork to Travis

As you make changes to your version of Concerto, you'll want to commit them to your local fork of the Concerto repository before ultimately sharing them back with the wider community. The Concerto shared repository requires a clean execution of all the test suites in Concerto project before pull requests can be accepted, and this is managed using [Travis CI](https://travis-ci.org/) for continuous integration testing. CI helps to ensure that Concerto code remains fully tested at all times.

The following section will help you set up Travis and identify the Concerto project for continuous integration, so that whenever you push changes from your local machine to your GitHub repository a full set of tests will be run.

Go to the [IBM Travis CI site](https://whitewater.ibm.com/tools/travis) and if necessary sign in with your IBM w3id. Complete the requested information, and you will allow Travis to access your IBM GitHub repositories.

![travis1](docs/source/png/travis.screenshot1.png)

On the [IBM Travis home page](https://travis.innovate.ibm.com/repositories), the left hand pane shows a list of repositories that Travis knows about under the ``My Repositories`` tab.  If you click on the ``+`` next to this, then you will see a list of your repositories that Travis knows about.

![travis1](docs/source/png/travis.screenshot2.png)

On the middle pane, you will see a ``Sync account`` button which will allow Travis to find any new repositories you create.

You should turn on CI for the Concerto repository you have forked to your user space.  Now, every time you push code to your fork from your local machine, a build will run similar to the one on your local machine.  Let's go through that code, test, build process now with a simple sample.

## Creating your first change

Let's now create a small code change, add the tests for it, confirm it's not broken anything, and push to our local repository.

### Creating a branch

Let's start by creating a branch for your first code change. In the console type the following command

```bash
git checkout -b feature-first-concerto
```

You'll see the following response

```bash
Switched to a new branch 'feature-first-concerto'
```

which shows that you've created a new branch off the main `develop` branch and have been switched to it, ready to make your changes. In Concerto, the convention is that all features have the `feature-` prefix, and all fixes have the `fix-` prefix.

### Add a new method to the registry class

Using your favourite editor, edit the `lib/assetRegistry.js` file and add the following code after the `add` method.

```javascript

/**
 * Adds an asset to the asset registry.
 * Simplistic example to demonstrate adding some code and unit tests.
 *
 * @param {SecurityContext} securityContext The user's security context.
 * @param {CObject} asset The asset to be added to the asset registry.
 * @param {string} extraDescription Dummy field to illustrate tests.
 * @return {Promise} A promise that is resolved when the asset is added to
 * the asset registry.
 */
addExtra(securityContext, asset, extraDescription) {
    Util.securityCheck(securityContext);
    if (extraDescription !== 'Avoid') {
		    let data = this.serializer.toJSON(asset);
		    return this.add(securityContext, asset.getIdentifier(), data);
    }
}

```

### Run the unit test suite

Now run the unit test suite to make sure nothing has been broken through the addition of your code.

```bash
npm test
```

As when you ran `npm test` earlier in this exercise, you'll see lots of console output, and it will end with something like the following

```bash
#deployChainCode
	✓ should perform a security check
	✓ should throw when chaincodePath is not specified
	✓ should throw when functionName is not specified
	✓ should throw when args is not specified
	✓ should throw when args contains an invalid value
	✓ should deploy the chain-code and return the result
	✓ should handle an error from invoking the chain-code
	✓ should handle an hfc transaction error from invoking the chain-code


343 passing (2s)

=============================================================================
Writing coverage object [/Users/anthonyodowd/Documents/CTO/GitHub/a-o-dowd/Concerto/coverage/coverage.json]
Writing coverage reports at [/Users/anthonyodowd/Documents/CTO/GitHub/a-o-dowd/Concerto/coverage]
=============================================================================

=============================== Coverage summary ===============================
Statements   : 95.9% ( 1029/1073 )
Branches     : 92.16% ( 435/472 )
Functions    : 97.41% ( 226/232 )
Lines        : 95.9% ( 1029/1073 )
================================================================================

> composer@0.0.3 posttest /Users/anthonyodowd/Documents/CTO/GitHub/a-o-dowd/Concerto
> istanbul check-coverage

```

You can see that 343 tests were run and they all passed - you would get an error message if they didn't. This shows that the newly added code didn't break and of the existing regression tests.

### Add a new unit test for the newly added code

We're now going to add a new unit test for the code we've added and integrate it into the unit test suite. Edit the `test/assetRegistry.js` file in the concerto directory. (You'll see lots of other javascript tests in this directory. They are written using the `chai` framework, and using `sinon` for stubs, mocking, and spies.   

Add the following code after the tests for the registry `add`

```javascript
describe('#add', function () {
	...
});
```

```javascript
describe('#addExtra', function () {

		it('A sample test to show adding a new test suite', function () {

				// Create the asset registry and other test data.
				const json = '{"fake":"json for the test"}';
				serializer.toJSON.returns(json);
				let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
				let asset = sinon.createStubInstance(Resource);
				asset.getIdentifier.returns('dogecar1');

				// Mock the responses from add method.
				sandbox.stub(registry, 'add', function() {
						return Promise.resolve();
				});

				// Invoke the add function.
				return registry
						.addExtra(securityContext, asset, 'OK')
						.then(function () {

						// Check that the query was made successfully.
								sinon.assert.calledOnce(registry.add);

						});
		});

});

```

Now let's run the test suite again.  All the tests in the `test/` directory will be run, which includes your new test!

```bash
npm test
```

You'll see the output stream to the console as before, but you'll see your test run

```bash

#add
	✓ should perform a security check
	✓ should invoke the chain-code
	✓ should handle an error from the chain-code
#addExtra
	✓ A sample test to show adding a new test suite
#update
	✓ should perform a security check
	✓ should invoke the chain-code
	✓ should handle an error from the chain-code
```

... and that the number of unit tests passing has increased by 1!


```bash
344 passing (2s)

=============================================================================
Writing coverage object [/Users/anthonyodowd/Documents/CTO/GitHub/a-o-dowd/Concerto/coverage/coverage.json]
Writing coverage reports at [/Users/anthonyodowd/Documents/CTO/GitHub/a-o-dowd/Concerto/coverage]
=============================================================================

=============================== Coverage summary ===============================
Statements   : 96.27% ( 1033/1073 )
Branches     : 92.37% ( 436/472 )
Functions    : 97.84% ( 227/232 )
Lines        : 96.27% ( 1033/1073 )
================================================================================
```  

Let's now look at the istanbul coverage file. In your browser, open the top level coverage file 'Concerto/coverage/index.html'
It will look something like the following

![istanbul2](docs/source/png/istanbul.screenshot2.png)

If you navigate to 'Concerto/lib' and then 'assetRegsitry.js', you'll see the details of the code coverage for the new function you've added.

![istanbul3](docs/source/png/istanbul.screenshot3.png)

Note that in the above example we've not exercised the else path, as denoted by the `E` next to this line of code!  Ideally, you'd like to fix this by adding another test, or augmenting the existing test. You can try that later!

### Sharing your code

Up to this point you've been developing on your local machine - you've added some new code and new tests, and the build works fine.  You're ready to contribute this code back to Concerto! We're going to commit all the code locally, push it to our local fork on GitHub, where the test suite that we ran locally will run again to confirm our changes are good in a standard environment, and then we're going to make a pull request to ask the code to be added to Concerto.  (We're not actually going to do the very last piece of this final step, but that's OK - it's just a practice run!)  


## Committing your changes to your local branch
On the console type the following command

```bash
git status
```

You'll see the following output

```bash
On branch feature-first-concerto
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

	modified:   lib/assetregistry.js
	modified:   test/assetregistry.js

no changes added to commit (use "git add" and/or "git commit -a")
```

This shows the new code and tests that you've added to these files.  Let's add them to our current branch and commit them, with the following commands.

```bash
git add .
git commit -m "my first concerto feature"
```

You'll see git confirm that the 2 files above have been added to this commit record.

```bash
[feature-first-concerto 79498cb] my first concerto feature
 2 files changed, 46 insertions(+)
```

### Pushing your code to your GitHub fork of Concerto

Now we've captured these changes, and we're ready to push them to our local fork on the IBM GitHub repository.

```bash
git push origin feature-first-concerto
```

```bash
Counting objects: 11, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (11/11), done.
Writing objects: 100% (11/11), 3.74 KiB | 0 bytes/s, done.
Total 11 (delta 7), reused 0 (delta 0)
remote: Resolving deltas: 100% (7/7), completed with 6 local objects.
To git@github.ibm.com:a-o-dowd/Concerto.git
 * [new branch]      feature-first-concerto -> feature-first-concerto
```

You can see that these commits of your new branch have been pushed to your github fork of the Concerto project.

Look on your GitHub Concerto fork, and see the new branch `feature-first-concerto` in the `Branch` dropdown

![github3](docs/source/png/github.screenshot3.png)

### Verifying the build, using Travis CI

As soon as the code is pushed to your local fork of Concerto, because `Travis` has been told about your fork, it will run the build.  You can see more details about the Travis environment in the `.travis.yml` file. It looks something like this

```bash
language: node_js
node_js:
    - '4'
addons:
    apt:
        packages:
            - graphviz
dist: trusty
sudo: required
services:
    - docker
before_install: |
    set -ev
    npm install -g npm
install: ./scripts/install-deps.sh
script: |
    set -ev
    ./scripts/run-all-tests.sh
    ./scripts/generate-uml.sh
after_success: ./scripts/push-docs.sh
deploy:
    provider: script
    script: ./scripts/deploy.sh
    on:
        branch: master
        tags: true
```

You will understand more about this file over time, but for now, notice that the `script:` stanza shows that the `run-all-tests.sh` script is going to be run, which is the same as we ran locally.  There's lots more in the configuration file, and it's worth spending a little time understanding it.

Once you're comfortable with this file, have a look at the [build output](https://travis.ibm.com) on Travis. On the right hand side of this page, you can see the build environment being set up according to the `.travis.yml` configuration file and the individual commands being run. Scroll through it.  

![travis3](docs/source/png/travis.screenshot3.png)

On the left hand side of the pane, you can see the most recent builds from the `Blockchain-WW-Labs` organization.

### Contributing your code to the shared repository

If you look again on your Concerto GitHub page, you'll see a button marked 'New pull request'

![github4](docs/source/png/github.screenshot4.png)

and if you click this button you'll be prompted with a dialog which allows you to open a pull request.

![github5](docs/source/png/github.screenshot5.png)

You could complete the comment field, and create a pull request for this code to be merged in the shared Concerto repository `Blockchain-WW-Labs/Concerto`.  

The moderators of the Concerto repository will decide whether to accept your pull request, and one of the conditions will be that there is a clean build, which uses the same process as your local fork!

### Deleting your branch  

Let's quickly tidy up our GitHub fork and local clone.  

On the your local fork of Concerto, click on `branches`

![github6](docs/source/png/github.screenshot6.png)

You'll see a page similar to the following where you can delete `feature-first-concerto` by clicking on the trash can next to your branch.

![github7](docs/source/png/github.screenshot7.png)

On your local console, switch to the `develop` branch so that you can delete your `feature-first-concerto` branch

```bash
git checkout develop
```

```bash
Switched to branch 'develop'
Your branch is up-to-date with 'origin/develop'.
```

```bash
git branch -d feature-first-concerto
```

and you'll see the local branch deleted.

```bash
Deleted branch feature-first-concerto (was 79498cb).
```

### All Done!

Thanks for reading this guide. We hope it was helpful and that you're now ready to contribute to Concerto!

If you'd like to make changes or additions to this guide, you're very welcome to do so. Just clone the Concerto project, make your changes and create a pull request, very much like you've done in this guide!  

### Related helpful guides and tutorials

The following links are helpful for getting up to speed with different technologies used by the Concerto project.  

[JavaScript Promises](https://scotch.io/tutorials/understanding-javascript-promises-pt-i-background-basics)


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
