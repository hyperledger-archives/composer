---
layout: default
title: Glossary and definition of terms
category: reference
sidebar: sidebars/reference.md
excerpt: Glossary
---

# Glossary and definition of terms

---

From [Wikipedia](https://en.wikipedia.org/wiki/Blockchain_(database))

> A blockchain— originally block chain — is a distributed database that maintains a continuously-growing list of records called blocks. Each block contains a timestamp and a link to a previous block. The data in a block cannot be altered retrospectively. Blockchains are an example of a distributed computing system with high byzantine fault tolerance.


**Access Control File**: Access Control Files `.acl` are optional files that provide access control for business network definitions. They are written in the Access Control Language which describes which transactions and assets can be modified by specified participant types.*ASK DAN FOR MORE INFO*

**Asset**: Assets are things of value. A house is an example of a physical asset, that has value because it can be exchanged for other things, themselves of value. We are equally comfortable with non-physical asset classes, such as mortgages.

**Blockchain**: Blockchain is a shared, replicated ledger that can record asset transfers. An implemented blockchain platform is often referred to as a Blockchain Fabric.

**Business Network Archive**: A business network archive (`.bna`) is a compressed business network definition which contains at least a business network model and transaction processor functions and may optionally contain an access control file. Business network archives can be deployed as an administrative action to the {{site.data.conrefs.composer_short}} system running on a Hyperledger fabric.

**Business Network Definition**: *empty*

**Business Network Model**: The business network model describes the business assets and the participants in the Business Network. This model is in effect the entity-relationship or static object structure of the overall business network.

**Connection Profile**: Connection profiles are used by {{site.data.conrefs.composer_full}} to connect to an instance of {{site.data.conrefs.hyperledger_full}}*complete me*

**{{site.data.conrefs.composer_short}} Playground**: *empty*

**Fabric**: Fabric is a platform that user applications connect to in order to interact with a ledger. Examples of blockchain fabrics include Bitcoin, Ethereum, Open Blockchain and Hyperledger.

**Hyperledger**: Hyperledger is a Linux Foundation project to produce an open blockchain platform that is ready for business. It provides an implementation of the shared ledger, smart contracts, privacy and consensus mechanisms. It does not provide any value added services like monitoring or cloud hosting.

**{{site.data.conrefs.composer_full}} Admin API** is an administrative API to build admin applications. This can deploy and update business network definitions on the {{site.data.conrefs.composer_short}} fabric runtime.

**{{site.data.conrefs.composer_full}} Client API** This is the API that is used by applications to connect to a business network and submit transactions. These end applications might be either command line, gui web applications using for example Angular-2.  These APIs permit CRUD operations on the assets that have been defined in the model. It also permits the submission of the transactions to be executed to update assets for example.

**Identity**: An identity is a distinct unique identifier of a participant. When joining a business network, an identity is issued to a participant which is used by the participant to interact with the business network. Identity documents normally expire after a given length of time, but can be issued or revoked maunally. {{site.data.conrefs.composer_full}} uses {{site.data.conrefs.hyperledger_fabric_full}} enrollment certificates as identity documents.

**Modelling language**: The {{site.data.conrefs.composer_full}} modelling language is used in  (Concepts)

**Participant**: Participants represent the organizations or people who take part in the digital business network.

**Registry**: Registries are a store of assets held on the Hyperledger blockchain.

**Transaction**: Transactions are submitted by a participant to affect the assets held in the asset registries on the Hyperledger blockchain; The specification of these assets, transactions, participants.

**Transaction Processor Functions**: Transaction processor functions act on assets and participants to either create, update or delete properties on assets and participants. Written in JS.



The {{site.data.conrefs.composer_short}} system is defined in a number of [modules](../reference/MeetTheModules.html).




To facilitate the application development process there are helper tools to permit the development.
