---
layout: default
title: API Reference
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: APIs
index-order: 1200
---

# Hyperledger Composer API
Hyperledger Composer  is an application development framework for building Blockchain applications based on Hyperledger. This is the JavaScript documentation for the Hyperledger Composer Client, Admin, and Runtime JavaScript APIs.

## Quick Links
[Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)

## Overview
All the classes are listed in the [Class Index](./allData.html)

The major components of Hyperledger Composer are:

1. The Hyperledger Composer language for describing the structure of resources (assets, participants
and transactions) that participate in a blockchain backed business network.
2. JavaScript APIs to query, create, update and delete resources and submit transactions
 from client applications. Hyperledger Composer resources are stored on the Blockchain.
3. JavaScript transaction processor functions that runs on Hyperledger Fabric when transactions are
submitted for processing. These functions may update the state of resources
stored on the Blockchain via server-side Hyperledger Composer APIs.

## JavaScript language support
Applications that are using the client or admin APIs, that are not running inside a transaction function can be written to use ES6.
As an example, it allows the use of the async/await syntax. 

```javascript
  // connect using the 'newUserCard', create an asset, add it to a registry and get all assets. 
  try{
    await businessNetworkConnection.connect('newUserCard');
    let newAsset = factory.newAsset('org.acme.sample','SampleAsset','1148');
    await assestRegistry.add(newAsset);

    result = await assetRegistry.getAll();
    LOG.info(result);

    await businessNetworkConnection.disconnect();
  } catch (error){
      // error handling
  }
```

The promise chain syntax can be used, and must be used within Transaction Functions. 

**All code within a transaction function must use ES5 syntax - along with Promise Chains**

Using promises the example above would be:

```javascript
  // connect using the 'newUserCard', create an asset, add it to a registry and get all assets. 

  return businessNetworkConnection.connect('newUserCard')
    .then( function()  { 
        var newAsset = factory.newAsset('org.acme.sample','SampleAsset','1148');
        return assetRegistry.add(newAsset);
    })
    .then( function() {
       return assetRegistry.getAll();
    }) 
    .then( function(result) {
        LOG.info(result);
        return businessNetworkConnection.disconnect();
    })
    .catch( function (error){
      // error handling
    });
```


## Admin and Client API
These APIs are specifically used to obtain connect to a Business Network Connection to either administer it, or obtain the resources to perform business operations. Business operations could be to add assets, or submit transaction functions.

The starting point for these APIs are the `AdminConnection` or `BusinessNetworkConnection`. Both APIs follow a similar pattern to connect.
A name of an already imported business network card is needed. By default these cards are ready from the file system card store.

```javascript
const AdminConnection = require('composer-admin').AdminConnection;

let adminConnection = new AdminConnection();
await adminConnection.connect('cardNameToUse');

//
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;

let bizNetConnection = new BusinessNetworkConnection();
let businessNetworkDefintion = await bizNetConnection.connect('cardNameToUse');

```

### Registries
A key part of the Client API is are the Regsitry classes. There are the *AssetRegsitry*, *ParticipantRegistry*, *IdentityRegistry*, *TransactionRegistries* and the *Historian*. Each of these have a common super type of *Registry*.

The Registry supports accessing a registry to obtain resources. 

- Add one or more resources
- Update one or more resources
- Remove one or all resources
- Get one or all resources
- Check if a resource exists
- Resolve one or all resources

The difference between resolve and get are that get will no resolve any relationships that are defined in the resource. A reference to the resource will be supplied. A resolve call will iterate over all the relationships.

Registries are automatically created for each asset, participnat, and transaction. Additional registries can be created if required using the addRegistry call. 

## Common API
The Common API contains the APIs used to obtain information about the Business Network you are conencted to and to create new assets, participants, transactions and events. It also provides APIs to find out information about these resources.  

For example to create a new asset

```javascript
let factory = this.businessNetworkDefinition.getFactory();
owner = factory.newResource('net.biz.digitalPropertyNetwork', 'Person', 'PID:1234567890');
owner.firstName = 'Fred';
owner.lastName = 'Bloggs';
```

### Runtime API

The Runtime API is the available API to all transaction functions. It allows access to APIs to
- build and issue queries
- emit events
- get registries of all types
- get the current participant
- get the serializer to create resources from JavaScript objects
- post HTTP REST calls

The Common API calls are also available to interact with resources, together with the Registry APIs. For each 

```javascript
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (driverParticipantRegistry) {
    // Call methods on the driver participant registry.
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```

**NOTE: All transaction functions should be written to ES5 and additional use Promise chains**

### Transaction Functions

The transaction function is the part of Composer that can be considered to be the _smart contract_ execution. It will invoked from a client application application (or via a REST API). It will work on the state of assets, participant etc as held within the underling blockchain worldstate. The operations performed by the transaction function, will then be subject to the endorsment and order protocols as established by the the same underlying blockchain. As such the *source of truth* of the assets is maintained. 

Definition of the transaction functions is within the .cto model file.

```
namespace net.biz.digitalPropertyNetwork

transaction RegisterPropertyForSale identified by transactionId{
  o String transactionId
  --> LandTitle title
}
```

This is then linked to the implementation of the transaction function by annotations in the comment of the function.  `@transaction` marks this function as a transaction function. `@param` connects this transaction to the `RegisterPropertyForSale` defined in the model.

```javascript
/**
 * @param {net.biz.digitalPropertyNetwork} registryProperty
 * @transaction
 */
function codeToImplementatTheTransactionFunction(registryProperty){
 //
}
```

The function argument `registryProperty` for sale will be a fully resolved copy of the transaction resource. The ` --> LandTitle title ` in this example would be a fully resolved LandTitle resource.

#### Restrictions

- Transaction functions should not use random numbers
- Additional transactions can not be submitted from the implemetnation of a transaction function. Other functions can be called but will be considered as part the same transaction. This is irrespective of the annotations of the function called.
- Always use `getCurrentParticipant()` to get the details of the invoking participant
