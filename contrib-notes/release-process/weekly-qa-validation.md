
# Validation of the quality of Hyperledger Composer

Hyperledger Composer is an open source technology that is developed in the open. Therefore every Pull Request that is merged is a *public* release of code, api, and documentation.

First impressions and the overall first experience do count. Even if something isn't perfect for whatever reason, then we can still retain this new relationship _if_ the solution is easily found.

## Aim
To run over validation that ensures we meet a Minimal Standard for Release. A failure of any of the below listed items, or indeed undocumented exploratory testing that reveals an undesired aspect or behaviour introduced since the previous release, should prevent a release going ahead without a fix first being delivered and subsequently proven.

## Pre-requisties

__Assumption__ is that stories have been closed off properly

- Current state of the build is green with all test passing, and all aspects green:  This is for a merge build, not a pull request. This ensures that the code is clean, unit and systests are passing, documentation is being generated, npm and docker images pushed to the repositories, and the Bluemix images have been pushed
- Ensure that any CRON jobs that are run are also passing


## Process

We wish to validate three core aspects:
 - [User guides](./guide-validation.md)
 - [Runtime](./runtime-validation.md)
 - [Playground](./playground-validation.md)
 - [CLI](./cli-validation.md)

Each link above will provide a guide for validation purposes. It should be possible to follow the guides without reaching an error case. Upon completion of the above valiadtion guides, and in the presence of a clean build, we can progress to the release phase.

## The Release

Once validation has passed, and the consensus is to cut a release, the [release process](./release-process.md) may be followed.

If a major version bump is being performed, it will be necessary to update:
 - composer-sample-applications
 - composer-sample-networks
For the runtime level change, and cut a release of the items listed above.