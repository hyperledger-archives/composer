# Contributing to Hyperledger Composer

We welcome contributions to the code base. There is a contributors [RocketChat channel](https://chat.hyperledger.org/channel/composer-dev) that we would encourage you to join and introduce yourself on.

There are multiple components within Composer, which can be conceptually viewed using the mindmap

![alt text](./contrib-notes/Features.png "Composer Mindmap")

These components are split across multiple Composer repositories within the Hyperledger project. The repositories are:

- [hyperledger/composer](https://github.com/hyperledger/composer) All the code, cli and documentation
- [hyperledger/composer-sample-models](https://github.com/hyperledger/composer-sample-models) Sample Business Models
- [hyperledger/composer-sample-networks](https://github.com/hyperledger/composer-sample-networks) Sample Business Networks
- [hyperledger/composer-sample-applications](https://github.com/hyperledger/composer-sample-applications) Sample Applications using the Composer API (using v0.6 Hyperledger Fabric)
- [hyperledger/composer-sample-applications-hlfv1](https://github.com/hyperledger/composer-sample-applications-hlfv1) Sample Applications using the Composer API (using v1.0.0-alpha Hyperledger Fabric).  **Note this is ALPHA**
- [hyperledger/composer-atom-plugin](https://github.com/hyperledger/composer-atom-plugin) Plugin for the Atom editor
- [hyperledger/composer-vscode-plugin](https://github.com/hyperledger/composer-vscode-plugin) Plugin for the VS Code editor
- [hyperledger/composer-tools](https://github.com/hyperledger/composer-tools) Additional tools to help working with Composer

## Raising an Issue

If you have a question or problem that relates to general support, please ask the question on either [RocketChat](https://chat.hyperledger.org/channel/composer) or [Stack Overflow](http://stackoverflow.com/questions/tagged/hyperledger-composer), where the question should be tagged with 'hyperledger-composer'. We would like to exclusively use GitHub issues for bug reports and feature requests.

If you find a bug in the source code, an error in any documentation, or would like a new feature, you can help us by [raising an issue](./contrib-notes/raising-issues.md) to our GitHub Repository or delivering a fix via a [pull request](./contrib-notes/submitting-pull-request.md).


## Getting Started

In order to assist anybody starting from scratch, we have produced guides on setting up an IDE and a development environment that will enable you to build and run from source:
* [Suggested IDE setup](./contrib-notes/ide-setup.md)
* [Step-by-step developement environment setup](./contrib-notes/getting-started.md)

Everything installed and ready code? Great! Issues are tracked in GitHub, if you are looking for a place to start with the code then it might be worth tackling a [bug](https://github.com/hyperledger/composer/issues?q=is%3Aissue+is%3Aopen+label%3Abug) or look for those issues tagged with [*help wanted*](https://github.com/hyperledger/composer/issues?q=is%3Aissue+label%3A%22help+wanted%22).

## Coding Guidelines

To ensure consistency and quality through the project, we enforce rules detailed within our [Coding Guidelines](./contrib-notes/coding-guidelines.md). As a summary:

 - All changes should be developed in a fork of the relevant Hyperldger Composer repository, and the changes submitted for approval in the form of pull requests.
 - All delivered code must follow the linting rules
 - All features or bug fixes must be tested.
 - All public API methods must be documented.
 - Travis-ci is used to build and test all repositories and a build is triggered when a pull request is made. Any pull request that is not 100% clean will be closed.


## Submitting a Pull Request

To enable us to quickly review and accept your pull requests, always create one pull request per issue and link the issue in the pull request. Never merge multiple requests in one unless they have the same root cause. Be sure to follow our [Coding Guidelines](./contrib-notes/coding-guidelines.md) before following our [Pull Request Guidelines](./contrib-notes/submitting-pull-request.md).


## The Release

The master branches are currently being used as a base to cut new releases. The release process itself follows a process to ensure that the release is of suitable quallity. For more information, please see the [release process](./contrib-notes/weekly-qa-validation.md)