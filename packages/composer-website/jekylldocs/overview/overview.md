---
layout: default
title: Hyperledger Composer -  Overview
category: overview
sidebar: sidebars/introduction.md
excerpt: Hyperledger Composer overview
---

# Overview

{{site.data.conrefs.composer_full}} is a set of APIs, a modeling language and
a programming model to quickly define and deploy business networks and applications
that allow **participants** to send **transactions** that exchange **assets**.

The IBM Blockchain, based on Open Source [Hyperledger Fabric](https://www.hyperledger.org) technology, is used to store the state of assets in asset registries, while the blockchain consensus protocol ensure that transactions
are validated by concerned organizations in the business network.

## Framework Features

|Feature        |Description  |
| -------------- | ------------ |
| Blockchain State Storage | All state is stored in Hyperledger Fabric, ensuring consensus, immutability etc. |
| Assets | Use Assets and Asset Registries to define the data to be stored and exchanged across the business network |
| Participants | Define Participants and ensure transactions are associated with known and authenticated members of the Hyperledger Fabric |
| Transactions | Define Transactions and provide APIs to submit them for processing |
| Transaction Processors | Write Transaction Processor functions using JavaScript, that can update the state of assets and asset registries |
| REST APIs | Provides REST APIs to interact with assets and the transaction registry |
| Loopback Connector | Provides a Loopback Connector to submit transactions from external systems |
| Analytics and Monitoring integration | Provides integration extension points to send transactions to external analytics data stores |
| Starter Applications | Generate starter applications from a Business Network Definition |

## {{site.data.conrefs.composer_full}} Programming Model

The {{site.data.conrefs.composer_full}} programming model is based on defining and deploying a Business Network
Definition, which contains a data model that defines the name and structure of assets, participants
and transactions in the business network. The business network also specifies *transaction processor functions*
(written in ES5 JavaScript) that are automatically run on a Hyperledger Fabric when transactions are submitted by clients.

{{site.data.conrefs.composer_full}} defines [JavaScript APIs](https://hyperledger.github.io/composer/jsdoc/index.html)to submit transactions and to create, retrieve, update and delete assets within asset registries.

### Roles, Responsibilities and Tasks

A typical project using {{site.data.conrefs.composer_full}} goes through a lifecycle of:

*Model -> Define Business Network -> Deploy Runtime -> Deploying Business Network -> Test -> Generate Application*

These tasks may all be performed by a single full-stack developer, but are more typically performed by:
* Business analyst, responsible for defining the data model
* Technical analyst, responsible for creating the business network definition, including models and writing transaction processor functions, as well as dashboards and analytics to business stakeholders
* Operations engineer, responsible for operating a set of Hyperledger nodes, ensuring business continuity and security
* Application developer, responsible for creating web and batch applications and integrating the applications into existing systems

## Modeling the Business Domain

{{site.data.conrefs.composer_full}} includes a powerful Object-Oriented modeling language, used to specify a domain model; the structure of assets, participants and transactions. The domain model is used across the Framework for code generation, type validation, user interface generation, API generation, amongst other things.

### Sample {{site.data.conrefs.composer_full}} Domain Model

```javascript
namespace net.biz.digitalPropertyNetwork

asset LandTitle identified by titleId {
  o String   titleId
  o Person   owner
  o String   information
  o Boolean  forSale   optional
}

asset SalesAgreement identified by salesId {
  o String    salesId
  o Person    buyer
  o Person    seller
  o LandTitle title
}

participant Person identified by personId {
  o String personId
  o String firstName
  o String lastName
}


transaction RegisterPropertyForSale identified by transactionId{
  o String transactionId
  --> Person seller
  --> LandTitle title
}
```

## Writing Transaction Processor functions

Technical Analysts write transaction processor functions using ES5 JavaScript. These scripts are included in a business network definition and will be automatically executed when a transaction is submitted for processing. The transaction processor scripts can create, update, retrieve and delete assets based on the incoming transaction.

```javascript
'use strict';

/** Process a property that is held for sale
 * @param {net.biz.digitalPropertyNetwork.LandTitle} propertyForSale the property to be sold
 * @transaction
 */
function onRegisterPropertyForSale(propertyForSale){
    console.log('### onRegisterPropertyForSale '+propertyForSale.toString());
    propertyForSale.title.forSale = true;
}
```

## Rapidly Create Applications

{{site.data.conrefs.composer_full}} includes [code generators](../tasks/genapp.md) so that web and mid-tier application developers can quickly generate starter applications that interact with a deployed business network definition. These code generators allow application developers to quickly focus on the integration and visual aspects of their projects, rather than writing boilerplate and configuration.

High-level administration and client APIs provide easy access to a deployed business network.

### Using the JavaScript Client and Admin APIs

Mid-tier developers use JavaScript APIs to interact with the framework. The ```AdminConnection``` API exposes administration operations, such as deploying, undeploying and updating a Business Network Definition.

The ```BusinessNetworkConnection``` API is used to interact with a deployed business network: retrieving assets from asset registries, or submitting transactions.

The sample below uses both the ```AdminConnection``` and ```BusinessNetworkConnection``` APIs to deploy a business network definition, and then connects using the client API to retrieve an asset registry.

```javascript
'use strict';

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const fs = require('fs');

const admin = new AdminConnection();
const composer = new BusinessNetworkConnection();

const config = {
    type: 'hlf',
    keyValStore: '/tmp/keyValStore',
    membershipServicesURL: 'grpc://localhost:7054',
    peerURL: 'grpc://localhost:7051',
    eventHubURL: 'grpc://localhost:7053'
};

const CONNECTION_PROFILE_NAME = 'testprofile';
let businessNetworkIdentifier = null;

return admin.createProfile('testprofile', config)
  .then(() => {
      console.log('Created connection profile');
      return admin.connect(CONNECTION_PROFILE_NAME, 'WebAppAdmin', 'DJY27pEnl16d');
  })
  .then(() => {
      let readFile = fs.readFileSync(__dirname + '/data/businessnetwork.zip');
      return BusinessNetworkDefinition.fromArchive(readFile);
  })
  .then((businessNetwork) => {
      console.log('Read BusinessNetwork archive: ' + businessNetwork.getIdentifier() );
      businessNetworkIdentifier = businessNetwork.getIdentifier();

      console.log('Deploying business network...' );
      return admin.deploy(businessNetwork, false);
  })
  .then(() => {
      console.log('Deployed BusinessNetwork archive');
      return admin.ping();
  })
  .then(() => {
      console.log('Pinged server');
      return admin.disconnect();
  })
  .then(() => {
      console.log('Disconnected admin');
      return composer.connect(CONNECTION_PROFILE_NAME, businessNetworkIdentifier, 'WebAppAdmin', 'DJY27pEnl16d');
  })
  .then(() => {
      console.log('Connected client to ' + businessNetworkIdentifier );
      return composer.addAssetRegistry('com.ibm.composer.mozart.Farmer', 'Farmer Registry');
  })
  .then((registry) => {
      console.log('Found animal asset registry ' + registry );
  })
  .then(() => {
      return composer.disconnect();
  })
  .then(() => {
      console.log('Done');
      return true;
  })
  .catch((err) => {
      console.log('Failed: ' + err);
  });

```

### Developing Web User Interfaces

Front-end developers use domain-specific (dynamically generated from the domain model for the business network definition) to interact with assets and asset registries.

In addition, if they are building an Angular2 application, they may generate Typescript types from the domain model, ensuring type-safety in the user interface code they are writing.
