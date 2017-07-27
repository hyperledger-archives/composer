---
layout: default
title: Hyperledger Composer CLI Commands
section: reference
index-order: 908
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

Create a Business Network Archive from a directory on disk: [composer archive create](./composer.archive.create.md)

`composer archive list`

Verify the contents of a Business Network Archive on disk: [composer archive list](./composer.archive.list.md)

## Business Network management

`composer network deploy`

Deploy a Business Network Definition: [composer network deploy](./composer.network.deploy.md)

`composer network undeploy`

Permanently disable a business network definition: [composer network undeploy](./composer.network.undeploy.md)

`composer network list`

List the contents of a deployed Business Network: [composer network list](./composer.network.list.md)

`composer network logLevel`

Return or update the log level for the composer runtime: [`composer network logLevel`](./composer.network.logLevel.md)

`composer network ping`

Test the connection to a deployed a Business Network: [composer network ping](./composer.network.ping.md)

`composer network update`

Update a deployed Business Network: [composer network update](./composer.network.update.md)

`composer network upgrade`

Upgrade the {{site.data.conrefs.composer_full}} runtime of a specific deployed business network: [composer network upgrade](./composer.network.upgrade.md)

`composer network start`

Deploy a business network archive to a {{site.data.conrefs.hlf_full}} peer that already has the {{site.data.conrefs.composer_full}} runtime installed: [composer network start](./composer.network.start.md)

`composer runtime install`

Install the {{site.data.conrefs.composer_full}} runtime to a {{site.data.conrefs.hlf_full}} peer: [composer runtime install](./composer.runtime.install.md)

## Participant and Identity management

`composer participant add`

Adds a participant to a participant registry: [composer participant add](./composer.participant.add.md)

`composer identity issue`

Issue an identity to a participant: [composer identity issue](./composer.identity.issue.md)

`composer identity revoke`

Revoke an identity from a participant: [composer identity revoke](./composer.identity.revoke.md)

`composer identity import`

Import an identity to your local identity wallet: [composer identity import](./composer.identity.import.md)

## Transaction execution

`composer transaction submit`

Submit a transaction for execution: [composer transaction submit](./composer.transaction.submit.md)
