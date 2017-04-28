# Contributing to Hyperledger Composer
We welcome contributions to Hyperledger Composer!

This document explains how you should work with the Hyperledger Composer repositories.  More information is in the 'contrib-docs' directory for specific topics

* [Suggested ide setup](./contrib-notes/ide-setup.md)
* [Step-by-step developement environment setup](./contrib-notes/getting-started.md)

There is a contributors [Rocket.Chat channel](https://chat.hyperledger.org/channel/composer-dev) that it is worth introducing yourself on.

## GitHub Repositories

The following is a list of the repositories that are part of the Hyperledger Composer project, the composer repository itself is a monorepo and holds all the source code in multiple npm modules.

| composer  | Main monorepo with the project source code, including tests and documetnation |
| composer-sample-applications | Sample applications for Hyperledger Composer; including the 'Getting Started' tutorial |
| composer-sample-networks     | Sample Hyperledger Composer Business Networks |
| composer-sample-models       | Sample Hyperledger Composer Models |
| composer-atom-plugin | A syntax checker for the Atom.io editor |
| composer-vscode-plugin | A syntax checker for the VSCode editor |
| composer-tools                  | Tools for use with Hyperledger Composser    |

### Our development process

The source and issue tracking system for Hyperledger Composer is [GitHub](https://github.com/hyperledger/composer). All changes should be developed in a fork of the Hyperledger Composer repository, and the changes submitted for approval in the form of pull requests. Travis-ci is used to build and test all repositories and a build is triggered when a pull request is made. Any pull request that is not 100% clean will be closed.

The master branches are currently being used, a release build is run weekly to fix the release at a new level.  See the [release process](./contrib-notes/release-process.md)

### Testing

All changes pushed to Hyperledger Composer must include unit tests that ensure that the new functionality works as designed, or that fixed bugs stay fixed. Pull requests that add code changes which are not covered by automated unit tests will **not** be accepted.

Unit testing is for ensuring that small units of code *Do The Right Thing*, with an extremely quick turnaround time. An example of this might be the `AssetRegistryFactory.create()` method. The code in this method *probably* needs to do two things; send the correct invoke request to the chain-code, and correctly handle all of the possible responses from that chain-code.

We do not need to stand up the Hyperledger Fabric to unit test this method; we simply need to ensure that the correct calls are made to the **hfc** library. Infact, testing against a running Hyperledger Fabric can actually make this harder - especially when we need to test our code for handling errors and timeouts from the **hfc** library. It is much easier and quicker to inject errors and timeouts into a *mocked* **hfc** library.

Additionally, the Hyperledger team have added unit test support for chain-code. This means that chain-code can be tested as a separate unit, leading to tests such as: given world state *X*, and invoke request *Y*, is the invoke request *Y* successful and is the world state updated correctly?

Obviously, unit testing is not sufficient, and we do need to test the framework against a running Hyperledger Fabric to ensure that the system works as a whole. This is additional functional, system, and performance testing that should automatically be run after the unit test phase. However, these additional testing phases are not yet in place, and so are not currently documented.

We use **mocha** to execute our JavaScript unit tests, and these unit tests can be executed locally with `npm test`. All JavaScript code should include unit tests that can be run without requiring a running Hyperledger Fabric. Tests within composer-connector-web and composer-runtime-web use **karma** to launch a browser, and consequently **chrome** must be installed to prevent test failures.

<!-- We use the testing package built into Go for our Go unit tests, and these unit tests can be executed with `go test`. All Go code (primarily chain-code) should include unit tests that can be run without requiring a running Hyperledger Fabric. -->

Unit tests should aim for 100% code coverage. For JavaScript code, we use Istanbul is used to ensure that the unit tests meet minimum levels of code coverage.

### Documentation

We use **jsdoc** for our API documentation. If you change APIs, update the documentation. Note that the linter settings
will enforce the use of JSDoc comments for all methods and classes. We use these comments to generate high-quality
documentation and UML diagrams from source code. Please ensure your code (particularly public APIs) are clearly
documented.

### Pull requests

*Before* submitting a pull request, please make sure the following is done:

1. Fork the repo and create your branch from `master`.
2. If you've added code, add tests!
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes (`npm test`).
5. Make sure your code lints.
6. Pull requests that have associated builds that are not 100% clean will be closed.

### Style guide

Our linter **eslint** will catch most styling issues that may exist in your code. You can check the status of your code styling by simply running `npm lint`.

* 4 spaces for indentation (no tabs)
* Prefer `'` over `"`
* `'use strict';`
* JSDoc comments are required


### Issue Management
Issues are tracked in Github. If you are looking for a place to start with the code then it might be worth [tackling a] defect(https://github.com/hyperledger/composer/issues?q=is%3Aissue+is%3Aopen+label%3Abug) or look for those issues tagged with [*help wanted*](https://github.com/hyperledger/composer/issues?q=is%3Aissue+label%3A%22help+wanted%22)

Please try and use the [issue template](./ISSUE_TEMPLATED.md) when raising new issues.
