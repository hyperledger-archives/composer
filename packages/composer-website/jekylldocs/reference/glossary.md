---
layout: default
title: Hyperledger Composer Glossary of Terms
section: reference
index-order: 1010
sidebar: sidebars/accordion-toc0.md
excerpt: The glossary contains [**definitions of all Hyperledger Composer terms**](./glossary.html) for developing a solution with Hyperledger Composer.
---

# Glossary and definition of terms

---

From [Wikipedia](https://en.wikipedia.org/wiki/Blockchain_(database))

> A blockchain— originally block chain — is a distributed database that maintains a continuously-growing list of records called blocks. Each block contains a timestamp and a link to a previous block. The data in a block cannot be altered retrospectively. Blockchains are an example of a distributed computing system with high byzantine fault tolerance.


**Access Control File**: Access Control Files (`.acl`) are optional files within a business network definition. They describe assets or groups of assets and define the participants who can perform operations which affect those assets.

**Asset**: An asset can be anything of value. A house is an example of a physical asset, and a mortgage is an example of non-physical asset. Assets within {{site.data.conrefs.composer_full}} can be defined to encompass any physical or non-physical asset.

**Blockchain**: A blockchain is a shared and replicated ledger that can record asset transfers and changes. An implemented blockchain platform is often referred to as a Blockchain Fabric.

**Business Network Archive**: A business network archive (`.bna`) is a compressed business network definition which contains at least a business network model and transaction processor functions and may optionally contain an access control file. Business network archives can be deployed to a Hyperledger fabric.

**Business Network Definition**: A business network definition is made up of the business network model, transaction processor functions and optionally an access control file. The business network definition describes all assets, participants, transactions, and operations for a given solution, and can be interacted with by using a command line interface or an API.

**Business Network Model**: The business network model describes the assets, participants, and transactions in the business network. The model is in effect the static object structure of the overall business network.

**Connection Profile**: Connection profiles are `.json` files used by {{site.data.conrefs.composer_full}} to connect to an instance of {{site.data.conrefs.hlf_full}}.

**{{site.data.conrefs.composer_short}} Playground**: The {{site.data.conrefs.composer_full}} Playground is an open toolset allowing business networks to be rapidly modelled and tested. Sample business networks can be imported to learn more about {{site.data.conrefs.composer_full}} and business network archives can be exported for local editing or later use.

**Events**: Events are defined in the business network definition in the same way as assets or participants. Once events have been defined, they can be included in the transaction processor functions to be emitted as part of a transaction. Applications can subscribe to emitted events through the `composer-client` API.

**Fabric**: A fabric is a blockchain platform that user applications connect to in order to interact with a ledger. Examples of blockchain fabrics include Bitcoin, Ethereum, Open Blockchain and Hyperledger.

**Hyperledger**: Hyperledger is a Linux Foundation project to produce an open blockchain platform that is ready for business. It provides an implementation of the shared ledger, smart contracts, privacy and consensus mechanisms.

**{{site.data.conrefs.composer_full}} Admin API** is an administrative API to build administrative applications. This API can deploy and update business network definitions on the {{site.data.conrefs.composer_full}} fabric runtime.

**{{site.data.conrefs.composer_full}} Client API** The Client API is used by applications to connect to a business network and submit transactions. These applications could be command line, web applications, or end-user applications. The Client API permits CRUD operations on the assets that have been defined in the model. It also permits the submission of the transactions to be executed to update assets.

**Identity**: An identity is a distinct unique identifier associated with a participant. When joining a business network, an identity is issued to a participant which is used by the participant to interact with the business network. Identity documents normally expire after a given length of time, but can be issued or revoked maunally. {{site.data.conrefs.composer_full}} uses {{site.data.conrefs.hlf_full}} enrollment certificates as identity documents.

**Modelling language**: The {{site.data.conrefs.composer_full}} modelling language is used in the business network definition to describe the assets, participants, and transactions in the business network. For a more in-depth explanation of the modelling language, see [modelling language documentation](../reference/cto_language.html).

**Participant**: Participants represent the organizations or people who take part in the digital business network. Participants are defined in the business network model.

**Registry**: Registries are a stores of assets held on the blockchain. The contents of the registry are validated using the blockchain consensus mechanism.

**Transaction**: Transactions are submitted by a participant to affect the assets held in the asset registries on the Hyperledger blockchain. Transactions with a business network are defined in the business network model, and their operations are defined in the transaction processor function file.

**Transaction Processor Functions**: Transaction processor functions act on assets and participants to either create, update or delete properties on assets and participants. Transactions processor functions are written in JavaScript and contained in a script file as part of a business network definition.

---
