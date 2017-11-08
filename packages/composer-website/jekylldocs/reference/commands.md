---
layout: default
title: Hyperledger Composer CLI Commands
section: reference
index-order: 1008
sidebar: sidebars/accordion-toc0.md
excerpt: The [**list of all Hyperledger Composer CLI commands**](./commands.html) for performing multiple administrative, operational, and development tasks.
---

# {{site.data.conrefs.composer_full}} Command Line

---

The {{site.data.conrefs.composer_full}} command line application, `composer`, can be used to perform multiple
administrative, operational, and development tasks.

The {{site.data.conrefs.composer_full}} command line application can be installed using npm:

`npm install -g composer-cli`

*Please note: When using Ubuntu this command will fail when running in a root user shell.*

## Business Network Archives

`composer archive create`

Create a Business Network Archive from a directory on disk: [composer archive create](./composer.archive.create.html)

`composer archive list`

Verify the contents of a Business Network Archive on disk: [composer archive list](./composer.archive.list.html)

## Business Network Card Management

`composer card create`

Creates a business network card from a connection profile, business network name, and certificates: [composer card create](./composer.card.create.html)

`composer card delete`

Deletes a business network card which you have imported locally: [composer card delete](./composer.card.delete.html)

`composer card import`

Imports a created card into your local wallet: [composer card import](./composer.card.import.html)

`composer card export`

Exports and packages a card from your wallet: [composer card export](./composer.card.export.html)

`composer card list`

Lists all cards currently in your wallet: [composer card list](./composer.card.list.html)

## Business Network management

`composer network deploy`

Deploy a Business Network Definition: [composer network deploy](./composer.network.deploy.html)

`composer network undeploy`

Permanently disable a business network definition: [composer network undeploy](./composer.network.undeploy.html)

`composer network list`

List the contents of a deployed Business Network: [composer network list](./composer.network.list.html)

`composer network loglevel`

Return or update the log level for the composer runtime: [`composer network loglevel`](./composer.network.logLevel.html)

`composer network ping`

Test the connection to a deployed a Business Network: [composer network ping](./composer.network.ping.html)

`composer network update`

Update a deployed Business Network: [composer network update](./composer.network.update.html)

`composer network upgrade`

Upgrade the {{site.data.conrefs.composer_full}} runtime of a specific deployed business network: [composer network upgrade](./composer.network.upgrade.html)

`composer network start`

Deploy a business network archive to a {{site.data.conrefs.hlf_full}} peer that already has the {{site.data.conrefs.composer_full}} runtime installed: [composer network start](./composer.network.start.html)

`composer runtime install`

Install the {{site.data.conrefs.composer_full}} runtime to a {{site.data.conrefs.hlf_full}} peer: [composer runtime install](./composer.runtime.install.html)

`composer network upgrade`

Upgrade the {{site.data.conrefs.composer_full}} runtime of a specific deployed business network: [composer network upgrade](./composer.network.upgrade.md)


## Participant and Identity management

`composer participant add`

Adds a participant to a participant registry: [composer participant add](./composer.participant.add.html)

`composer identity issue`

Issue a new identity to a participant: [composer identity issue](./composer.identity.issue.html)

`composer identity bind`

Bind an existing identity to a participant: [composer identity bind](./composer.identity.bind.html)

`composer identity list`

List all identities in a business network: [composer identity list](./composer.identity.list.html)

`composer identity revoke`

Revoke an identity from a participant: [composer identity revoke](./composer.identity.revoke.html)

## Transaction execution

`composer transaction submit`

Submit a transaction for execution: [composer transaction submit](./composer.transaction.submit.html)
