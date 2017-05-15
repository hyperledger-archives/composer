---
layout: default
title: Key Concepts in Hyperledger Composer
sidebar: sidebars/introduction.md
excerpt:
---

# Features and Concepts in {{site.data.conrefs.composer_full}}

---

{{site.data.conrefs.composer_full}} is a programming model containing a modeling language, and a set of APIs to quickly define and deploy business networks and applications that allow **participants** to send **transactions** that exchange **assets**.

---

## Framework Features

| Component | Description |
|:---------:|:-----------:|
| composer-admin, composer-client, composer-common | Composer-admin, composer-client, and composer-common contain the APIs to interact with a {{site.data.conrefs.composer_full}} runtime. Composer-admin contains APIs for deploying and updating a business network, composer-client contains APIs for manipulating resources within registries via transactions. |
| composer-cli | Composer-cli contains  |
| composer-runtime | There are several versions of the composer-runtime designed for different environments. The embedded runtime runs within local storage, the hlf and hlfv1 runtimes run on {{site.data.conrefs.hyperledger_fabric_full}} versions 0.6 and 1.0. |
| composer-connector | The composer-connector components connect your {{site.data.conrefs.composer_short}} to a {{site.data.conrefs.hyperledger_fabric_full}} instance. |
| composer-rest-server | The composer-rest-server component creates and connects you to a REST API interface containing APIs for interacting with your business network. |
| generator-fabric-composer | The generator-fabric-composer component contains a Yeoman module for generating applications using data from your business network. |
| loopback-connector-composer | The loopback-connector-composer component allows you to connect loopback-compatible systems to your {{site.data.conrefs.composer_short}} business network. |

---

## Key Concepts in {{site.data.conrefs.composer_full}}

### Blockchain State Storage

The current state of assets and participants are stored on the blockchain, administered by {{site.data.conrefs.hyperledger_fabric_full}}. {{site.data.conrefs.hyperledger_fabric_full}} runs consensus checks to ensure the validity of all blocks in the blockchain. For more information on {{site.data.conrefs.hyperledger_fabric_full}} consensus, see the [{{site.data.conrefs.hyperledger_fabric_full}} documentation](https://hyperledger-fabric.readthedocs.io/en/latest/fabric_model.html#consensus).

---

### Assets

Assets are tangible or intangible goods, services, or property, and are stored in registries. Assets can represent almost anything in a business network, for example, a house for sale, the sale listing, the land registry certificate for that house, and the insurance documents for that house may all be assets in one or more business networks.

Assets must have a unique identifier, but other than that, they can contain whatever properties you define.

---

### Participants

Participants are members of a business network. Participant types can be defined and limited by an access control document which makes up part of the business network definition.

---

### Transactions

Transactions are the mechanism by which participants interact with assets. This could be as simple as a participant placing a bid on a asset in an auction, or an auctioneer marking an auction closed, automatically transferring ownership of the asset to the highest bidder.

---

### Events

Events are defined in the business network definition in the same way as assets or participants. Once events have been defined, they can be included in the transaction processor functions to be emitted as part of a transaction. Applications can subscribe to emitted events through the `composer-client` API.

---

### APIs

The `composer-admin`, `composer-client`, and `composer-common` components contain the APIs to interact with a {{site.data.conrefs.composer_full}} runtime. The `composer-rest-server` component generates a unique RESTful API for interacting with your deployed business network.

---

### Hyperledger Fabric 1.0 Support

{{site.data.conrefs.composer_full}} supports the existing [Hyperledger Fabric blockchain](https://hyperledger.org) infrastructure and runtime, and supports pluggable blockchain consensus protocols to ensure that transactions are validated according to policy by the designated business network participants.

Hyperledger Fabric v1.0 adds support for channels, orderers, and certificate authorities. For more information on Hyperledger Fabric v1.0, see the [Hyperledger Fabric documentation](https://hyperledger.org).

Hyperledger Fabric versions 0.6 and 1.0 are supported.

---
