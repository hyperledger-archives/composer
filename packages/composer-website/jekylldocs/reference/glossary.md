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

**Blockchain** is a shared, replicated ledger that can record asset transfers. An implemented blockchain platform is often referred to as a Blockchain Fabric.

**Blockchain fabric** or just fabric. This is a platform that user applications connect to in order to interact with such a ledger, as well as the ledger itself. Examples of blockchain fabrics include Bitcoin, Ethereum, Open Blockchain and of course Hyperledger ...

**Hyperledger** is the name of the Linux Foundation project to produce an open blockchain platform that is ready for business. It will provide an implementation of the shared ledger, smart contracts, privacy and consensus mechanisms. It will not provide any value added services (like monitoring or cloud hosting). IBM is one of many sponsors of the Hyperledger project.

# Fabric Composer Narrative

An **Economic Business Network** refers to the organizations that work together to take part in the digital business network. In many (all!) such networks there are multiple organisations that need to correlate their business process. In addition, in some industries, there are regulators that oversee the market. For example, within the food distribution network, the regulator is DEFRA in the UK or the Department of Agriculture in the US. To have a system that, for example, tracks food assets and the participants in the network, is very applicable to a Blockchain's quality of service. However, writing direct to the Hyperledger's core SDK requires a very low level API - and one that is not readily available or accessible to in-house developers. There is a high barrier to entry for practically solving business problems. So to help address this problem the ..tbc

**Fabric Composer**

Fabric Composer has been developed to permit architects and developers to use a runtime, tooling, client and administration APIs, that runs utilising a Hyperledger blockchain to provide a business-centric programming model, the starting point for this is the ...tbc

**Domain Specific Language** that they can use to describe the ...tbc

**Participants** that represent the organizations or people who take part in the digital business network.

**Asset** is a term used to describe things of value both in the physical world and the equally real intangible world.  A house is an example of a physical asset, and it has value because it can be exchanged for other things, themselves of value. We are equally comfortable with non-physical asset classes, such as a mortgage. A mortgage is valuable because it enables the mortgagee to purchase a house, while at the same time providing the mortgage holder with a recurring return which ultimately totals to more than the sum lent to the mortgagee. Assets are held within ...tbc

**Asset Registries** that are a store of assets held on the Hyperledger blockchain.

**Transactions** are submitted by a participant to affect the assets held in the asset registries on the Hyperledger blockchain; The specification of these assets, transactions, participants etc are written in standard source files, the conglomeration of which is the ...tbc

**Business Network Definition** is logically comprised of two parts.  The first part is the

**Model** which describes, using a domain specific language, the business assets and the participants in the Business Network. This model is in effect the entity-relationship or static object structure of the overall business network.  To provide dynamic behaviour this is coupled with a

**Transaction Processor Functions** written in JavaScript that act on assets and participants to either create, update or delete properties on assets and participants. The set of scripts that define transaction processor functions, and Model (which may be split between multiple source files) form the Business Network Definition. In order to use these with the Concerto system, they are bundled together to form a

**Business Network Archive** that can be deployed as an administrative action to the Concerto system running on a Hyperledger fabric.

# Development of a system using Fabric Composer

There are two 'phases' to running an application using the Concerto framework; the Business Network Definition should be deployed to a Hyperledger Fabric; then the application will run against this fabric, but using APIs applicable to the business model.

The Concerto system is defined in a number of [modules](MeetTheModules.html).

**Fabric Composer Client API** This is the API that is used by applications to connect to a business network and submit transactions. These end applications might be either command line, gui web applications using for example Angular-2.  These APIs permit CRUD operations on the assets that have been defined in the model. It also permits the submission of the transactions to be executed to update assets for example.

**Fabric Composer Admin API** is an administrative API to build admin applications. This can deploy and update business network definitions on the concerto fabric runtime.

To facilitate the application development process there are helper tools to permit the development.
