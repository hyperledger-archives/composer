
# Validation of the quality of Hyperledger Composer

Hyperledger Composer is an open source technology that is developed in the open. Therefore every Pull Request that is merged is a *public* release of code, api, and documentation.

First impressions and the overall first experience do count. Even if something isn't perfect for whatever reason, then we can still retain this new relationship _if_ the solution is easily found.

## Aim
To run over a weekly set of testing that ensures we meet a Minimal Standard for Release.

## Objectives
There are prescriptive things to check (see [Standard Verification](#standard-verification) - but a degree of exploratory testing is good to find out the edge cases etc.

* Is the website instructions still up-to-date?
* Do the pre-reqs still make sense - and can the setup scripts still work?
* Do the tutorials still work?
* Can I get started writing an application without having to make massive leaps?

In addition, an objective is to find and close gaps that have been found within the testing.

## Playbooks

*Note links to some of the information have not been provided - if you can't find it on hyperledger-composer then raise a docs issue - as it should be findable!*

### Pre-requisties

__Assumption__ that stories have been closed off properly

- [ ] Current state of the build is green with all test passing, and all aspects green:  This is for a merge build, not a pull request.
   - This ensures that the code is clean, unit and systests are passing, documentation is being generated, npm and docker images pushed to the repositories, and the Bluemix images have been pushed
- [ ] Ensure that any CRON jobs that are run are also passing

### Standard Verification

Cmd line Installation Verification  (Mac OS X and Ubuntu). These test should be run following the instructions in the web pages.
_These should be run using the unstable releases of the code to validate what is going to be released is good_

This short output shows how to install and update the package.json of the getting started application to use the unstable versions.

```bash
$ npm install -g composer-cli@unstable
<output redacted>
$ composer --version
composer-cli                   v0.5.2-20170313111819
composer-admin                 v0.5.2-20170313111819
composer-client                v0.5.2-20170313111819
composer-common                v0.5.2-20170313111819
composer-runtime-hlf           v0.5.2-20170313111819
composer-connector-hlf         v0.5.2-20170313111819

$ git clone https://github.com/hyperledger/composer-sample-applications.git
<output redacted>
$ cd composer-sample-applications/packages/getting-started
$ sed -i.ORIG 's/\("composer-.*".*\):.*"/\1:"unstable"/g' package.json
$ npm install --tag=unstable
$ npm test

```

- [ ] Running the pre-req scripts on clean platform images (within a virtualized environment, install from ISO image of Ubuntu. Follow the prerequisite tool chain as documented on the website.)
- [ ] Run the QuickStart and follow on tutorials to ensure they are correct [_note currently this means following the instructions on the website, however there is a plan to automate this_]
- [ ] Yo Generator (Angular + CLI) - generates and the code runs successfully
- [ ] Expose as REST API tutorial

*Documentation*

- [ ] Is the overall initial presentation of the website sound?  No broken links of home page (use w3 tools to check)
- [ ] Are the JSDocs being produced and linked correctly
- [ ] Look over the support pages, and the getting started tutorials; are their omissions broken links etc.  

### Playground

- **Composer-Playground** http://composer-playground-unstable.mybluemix.net/

(The stable version of Playground is missing the unstable word from the URL - but this is already released).

*Minimum subset*

 - [ ] Running the Car Auction scenario to validate the Playground

### Exploratory Testing

Different users will attempt different things, be starting from different points with different skill level. Options to consider

 - Add a new asset type to a model and a new transaction, or write a new model from a different business domain
 - Review the questions found in the week on StackOverflow & Rocket.Chat - how did the user get to the position they are in?
 - What new PRs have gone in this week - how could they deployed and used in the existing networks?

##Platforms

We need to validate on a number of platforms.

### For the command line tests

 - Ubuntu 14:04 & Ubuntu 16:04
 - MacOS 10
 - _Windows 10 is not yet ready_

### For the playgrounds

 - Both playgrounds need to be validated; developer preview focussed on the existing labs
 - Chrome, Safari, Firefox, Edge (IE is not a concern) are the browsers we should be concerned with - pick one for initial testing.
