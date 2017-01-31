---
layout: default
title: Fabric Composer Command Line
category: reference
sidebar: sidebars/reference.md
excerpt: Fabric Composer Command Line
---

# Fabric Composer Command Line

The Fabric Composer command line application, `composer`, can be used to perform multiple
administrative, operational, and development tasks.

The Concerto command line application can be installed using npm:

`npm install -g composer-cli`

## Business Network management

`composer network deploy`

Deploy a Business Network Definition: [concerto network deploy](./concerto.network.deploy.md)

`composer network list`

List the contents of a deployed Business Network: [concerto network list](./concerto.network.list.md)

`composer network ping`

Test the connection to a deployed a Business Network: [concerto network ping](./concerto.network.ping.md)

`composer network update`

Update a deployed Business Network: [concerto network update](./concerto.network.update.md)

## Participant and Identity management

`composer participant add`

Adds a participant to a participant registry: [concerto participant add](./concerto.participant.add.md)

`composer identity issue`

Issue an identity to a participant: [concerto identity issue](./concerto.identity.issue.md)

`composer identity revoke`

Revoke an identity from a participant: [concerto identity revoke](./concerto.identity.revoke.md)

## Transaction execution

`composer transaction submit`

Submit a transaction for execution: [concerto transaction submit](./concerto.transaction.submit.md)

## Development accelerators

`composer generator tests`

Generate tests for a Business Network Definition: [concerto generator tests](./concerto.generator.tests.md)
