---
layout: default
title: Concerto Command Line
category: reference
sidebar: sidebars/reference.md
excerpt: Concerto Command Line
---

# Concerto Command Line

The Concerto command line application, `concerto`, can be used to perform multiple
administrative, operational, and development tasks.

The Concerto command line application can be installed using npm:

`npm install -g composer-cli`

## Business Network management

`concerto network deploy`

Deploy a Business Network Definition: [concerto network deploy](./concerto.network.deploy.md)

`concerto network list`

List the contents of a deployed Business Network: [concerto network list](./concerto.network.list.md)

`concerto network ping`

Test the connection to a deployed a Business Network: [concerto network ping](./concerto.network.ping.md)

`concerto network update`

Update a deployed Business Network: [concerto network update](./concerto.network.update.md)

## Participant and Identity management

`concerto participant add`

Adds a participant to a participant registry: [concerto participant add](./concerto.participant.add.md)

`concerto identity issue`

Issue an identity to a participant: [concerto identity issue](./concerto.identity.issue.md)

`concerto identity revoke`

Revoke an identity from a participant: [concerto identity revoke](./concerto.identity.revoke.md)

## Transaction execution

`concerto transaction submit`

Submit a transaction for execution: [concerto transaction submit](./concerto.transaction.submit.md)

## Development accelerators

`concerto generator tests`

Generate tests for a Business Network Definition: [concerto generator tests](./concerto.generator.tests.md)
