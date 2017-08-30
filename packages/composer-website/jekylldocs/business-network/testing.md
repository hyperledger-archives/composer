---
layout: default
title: Testing Business Networks
category: tasks
section: business-network
index-order: 505
sidebar: sidebars/accordion-toc0.md
excerpt: How to test business networks
---

# Testing Business Networks

{{site.data.conrefs.composer_full}} supports three types of testing: interactive testing, automated unit testing and automated system testing. All three serve different purposes and are vital to ensuring the success of your blockchain projects.

After you have deployed a business network definition it is often useful to run an interative "smoke test" to ensure that the deployment was successful. The `composer` CLI exposes several commands for running such smoke tests.

At the other end of the spectrum you can write full-blown system tests using Docker Compose and Mocha/Chai, that start a runtime, deploy your business network definition and then programmatically creates assets, submits transactions and inspect the state of asset registries.

In between fall unit tests. Unit tests focus on ensuring that the correct changes to the world-state take place when a transaction is processed.

The execution of both unit tests and system tests may be automated using a CI/CD build pipeline, such as Jenkins, Travis CI, or Circle CI or alternatives.

## Interactive Testing

You can use the Playground to interactively test creating participants, assets and submitting transactions.

## Testing from the Command Line

The command line can be used to inspect the state of the runtime and to submit transactions. Use the `composer network list` command to see the state of asset and participant registries. Use the `composer transaction submit` command to submit transactions.

## Creating Unit Tests

The business logic in transaction processor functions should have unit tests, ideally with 100% code coverage. This will ensure that you do not have typos or logic errors in the business logic.

You can use standard JavaScript testing libraries, such as Mocha, Chai, Sinon and Istanbul to unit test the logic in your transaction processor functions.

The `embedded` runtime is very useful for unit testing, as it allows you to quickly test business logic in a simulated Node.js blockchain environment, without having to stand-up a {{site.data.conrefs.hlf_full}}.

Please refer to the sample networks for examples of unit tests. For example:
https://github.com/hyperledger/composer-sample-networks/blob/master/packages/bond-network/test/Bond.js

## References

* [**Composer CLI commands**](../reference/commands.html)
* [**Mocha**](https://mochajs.org)
* [**Chai**](http://chaijs.com)
* [**Sinon**](http://sinonjs.org)
* [**Istambul**](https://istanbul.js.org)
