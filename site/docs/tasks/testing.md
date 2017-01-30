---
layout: default
title: Task - Testing a Business Network Definition
category: tasks
sidebar: sidebars/tasks.md
excerpt: How to test a business network definition
---

# How to Test a Business Network Definition

After you have deployed a business network definition it is often useful to run a "smoke test" to ensure that the deployment was successful. The `concerto` CLI exposes several commands for running such smoke tests.

In addition you can write full-blown system tests using Docker Compose and Chai, that start a Fabric, deploy your business network definition and then programmatically create assets, submit transactions and inspect the state of asset registries.

## Creating Assets

Use the `ibm-concerto-client` module and the `BusinessNetworkConnection` API to add assets to an asset registry.

## Viewing Registries

`concerto network list`

## Submitting Transactions

`concerto transaction submit`

## Writing Assertions

Use popular Javascript assertion libraries such as Sinon and Chai.

# Generating Tests

You may choose to add skeletal tests to your application using the `concerto generator tests` command.
