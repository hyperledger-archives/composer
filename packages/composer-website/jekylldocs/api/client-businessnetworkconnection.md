---
layout: default
title: BusinessNetworkConnection (Client API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1213
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# BusinessNetworkConnection

Use this class to connect to and then interact with a deployed BusinessNetworkDefinition.
Use the AdminConnection class in the composer-admin module to deploy BusinessNetworksDefinitions.

### Details

- **Extends** EventEmitter

- **Module** client



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [addAssetRegistry](#addassetregistry) | `Promise` | Add a new asset registry  |
| [addParticipantRegistry](#addparticipantregistry) | `Promise` | Add a new participant registry  |
| [assetRegistryExists](#assetregistryexists) | `Promise` | Determine whether a asset registry exists  |
| [bindIdentity](#bindidentity) | `Promise` | Bind an existing identity to the specified participant  |
| [buildQuery](#buildquery) | `Query` | Build a query ready for later execution  |
| [connect](#connect) | `Promise` | Connects to a business network using a business network card, and authenticates to the Hyperledger Fabric  |
| [constructor](#constructor) | `void` | Create an instance of the BusinessNetworkConnection class  |
| [disconnect](#disconnect) | `Promise` | Disconnects from the Hyperledger Fabric  |
| [getAllAssetRegistries](#getallassetregistries) | `Promise` | Get a list of all existing asset registries  |
| [getAllParticipantRegistries](#getallparticipantregistries) | `Promise` | Get a list of all existing participant registries  |
| [getAllTransactionRegistries](#getalltransactionregistries) | `Promise` | Get all transaction registries  |
| [getAssetRegistry](#getassetregistry) | `Promise` | Get an existing asset registry  |
| [getBusinessNetwork](#getbusinessnetwork) | `BusinessNetworkDefinition` | Returns the currently connected BusinessNetworkDefinition  |
| [getHistorian](#gethistorian) | `Promise` | Get the historian  |
| [getIdentityRegistry](#getidentityregistry) | `Promise` | Get the identity registry  |
| [getParticipantRegistry](#getparticipantregistry) | `Promise` | Get an existing participant registry  |
| [getRegistry](#getregistry) | `Promise` | Given a fully qualified name, works out and looks up the registry that this resource will be found in  |
| [getTransactionRegistry](#gettransactionregistry) | `Promise` | Get the transaction registry  |
| [issueIdentity](#issueidentity) | `Promise` | Issue an identity with the specified name and map it to the specified participant  |
| [participantRegistryExists](#participantregistryexists) | `Promise` | Determine whether a participant registry exists  |
| [ping](#ping) | `Promise` | Test the connection to the runtime and verify that the version of the runtime is compatible with this level of the client node  |
| [query](#query) | `Promise` | Execute a query defined in a Composer query file, or execute a query built with buildQuery  |
| [revokeIdentity](#revokeidentity) | `Promise` | Revoke the specified identity by removing any existing mapping to a participant  |
| [submitTransaction](#submittransaction) | `Promise` | Submit a transaction for processing by the currently connected business network  |
| [transactionRegistryExists](#transactionregistryexists) | `Promise` | Determine whether a transaction registry exists  |





# Method Details


## new BusinessNetworkConnection()


Create an instance of the BusinessNetworkConnection class. must be called to connect to a deployed BusinessNetworkDefinition.







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options**| Object |*Yes*|an optional set of options to configure the instance.|



### Sub-options

| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options.cardStore**| BusinessNetworkCardStore |*Yes*|specify a card store implementation to use.|






## getBusinessNetwork
_BusinessNetworkDefinition getBusinessNetwork(  )_


Returns the currently connected BusinessNetworkDefinition



### Example
```javascript
// Get the Business Network Definition
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getBusinessNetwork();
})
.then(function(BusinessNetworkDefinition){
    // Retrieved Business Network Definition
});
```



### Returns
**{@link common-BusinessNetworkDefinition}** - the business network




### See also






### Parameters

No parameters







### Example
```javascript
// Get the Business Network Definition
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getBusinessNetwork();
})
.then(function(BusinessNetworkDefinition){
    // Retrieved Business Network Definition
});
```



## getAllAssetRegistries
_Promise getAllAssetRegistries( [boolean includesystem] )_


Get a list of all existing asset registries.



### Example
```javascript
// Get all asset registries
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getAllAssetRegistries();
})
.then(function(assetRegistries){
    // Retrieved Asset Registries
});
```



### Returns
**{@link Promise}** - A promise that will be resolved with a list of existing asset registries




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystem**| boolean |*Yes*|if true the returned list will include the system transaction registries (optional, default to false)|








### Example
```javascript
// Get all asset registries
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getAllAssetRegistries();
})
.then(function(assetRegistries){
    // Retrieved Asset Registries
});
```



## getAssetRegistry
_Promise getAssetRegistry( string id )_


Get an existing asset registry.



### Example
```javascript
// Get a asset registry
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getAssetRegistry('businessNetworkIdentifier.registryId');
})
.then(function(assetRegistry){
    // Retrieved Asset Registry
});
```



### Returns
**{@link Promise}** - A promise that will be resolved with the existing asset registry, or rejected if the asset registry does not exist.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The unique identifier of the asset registry|








### Example
```javascript
// Get a asset registry
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getAssetRegistry('businessNetworkIdentifier.registryId');
})
.then(function(assetRegistry){
    // Retrieved Asset Registry
});
```



## assetRegistryExists
_Promise assetRegistryExists( string id )_


Determine whether a asset registry exists.



### Example
```javascript
// Determine whether an asset registry exists
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.assetRegistryExists('businessNetworkIdentifier.registryId');
})
.then(function(exists){
    // if (exists === true) {
    // logic here...
    //}
});
```



### Returns
**{@link Promise}** - A promise that will be resolved with a boolean indicating whether the asset registry exists.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The unique identifier of the asset registry|








### Example
```javascript
// Determine whether an asset registry exists
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.assetRegistryExists('businessNetworkIdentifier.registryId');
})
.then(function(exists){
    // if (exists === true) {
    // logic here...
    //}
});
```



## addAssetRegistry
_Promise addAssetRegistry( string id, string name )_


Add a new asset registry.



### Example
```javascript
// Add a new asset registry
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.addAssetRegistry('registryId','registryName');
});
```



### Returns
**{@link Promise}** - A promise that will be resolved with the new asset registry after it has been added.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The unique identifier of the asset registry|
|**name**| string |*Yes*|The name of the asset registry|








### Example
```javascript
// Add a new asset registry
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.addAssetRegistry('registryId','registryName');
});
```



## getAllParticipantRegistries
_Promise getAllParticipantRegistries( [boolean includesystem] )_


Get a list of all existing participant registries.



### Example
```javascript
// Get all participant registries
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getAllParticipantRegistries();
})
.then(function(participantRegistries){
    // Retrieved Participant Registries
});
```



### Returns
**{@link Promise}** - A promise that will be resolved with a list of existing participant registries




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystem**| boolean |*Yes*|if true the returned list will include the system transaction registries (optional, default to false)|








### Example
```javascript
// Get all participant registries
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getAllParticipantRegistries();
})
.then(function(participantRegistries){
    // Retrieved Participant Registries
});
```



## getParticipantRegistry
_Promise getParticipantRegistry( string id )_


Get an existing participant registry.



### Example
```javascript
// Get a participant registry
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getParticipantRegistry('businessNetworkIdentifier.registryId');
})
.then(function(participantRegistry){
    // Retrieved Participant Registry
});
```



### Returns
**{@link Promise}** - A promise that will be resolved with the existing participant registry, or rejected if the participant registry does not exist.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The unique identifier of the participant registry|








### Example
```javascript
// Get a participant registry
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getParticipantRegistry('businessNetworkIdentifier.registryId');
})
.then(function(participantRegistry){
    // Retrieved Participant Registry
});
```



## participantRegistryExists
_Promise participantRegistryExists( string id )_


Determine whether a participant registry exists.



### Example
```javascript
// Determine whether an asset registry exists
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.participantRegistryExists('businessNetworkIdentifier.registryId');
})
.then(function(exists){
    // if (exists === true) {
    // logic here...
    //}
});
```



### Returns
**{@link Promise}** - A promise that will be resolved with a boolean indicating whether the participant registry exists.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The unique identifier of the participant registry|








### Example
```javascript
// Determine whether an asset registry exists
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.participantRegistryExists('businessNetworkIdentifier.registryId');
})
.then(function(exists){
    // if (exists === true) {
    // logic here...
    //}
});
```



## addParticipantRegistry
_Promise addParticipantRegistry( string id, string name )_


Add a new participant registry.



### Example
```javascript
// Add a new participant registry
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.addParticipantRegistry('registryId','registryName');
});
```



### Returns
**{@link Promise}** - A promise that will be resolved with the new participant registry after it has been added.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The unique identifier of the participant registry|
|**name**| string |*Yes*|The name of the participant registry|








### Example
```javascript
// Add a new participant registry
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.addParticipantRegistry('registryId','registryName');
});
```



## getTransactionRegistry
_Promise getTransactionRegistry( string id )_


Get the transaction registry.



### Example
```javascript
// Get the transaction registry
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getTransactionRegistry('org.acme.exampleTransaction');
})
.then(function(transactionRegistry){
    // Retrieved transaction registry.
});
```



### Returns
**{@link Promise}** - A promise that will be resolved to the {@link TransactionRegistry}




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The unique identifier of the transaction registry|








### Example
```javascript
// Get the transaction registry
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getTransactionRegistry('org.acme.exampleTransaction');
})
.then(function(transactionRegistry){
    // Retrieved transaction registry.
});
```



## getAllTransactionRegistries
_Promise getAllTransactionRegistries( [boolean includesystem] )_


Get all transaction registries.



### Example
```javascript
// Get the transaction registry
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getAllTransactionRegistries();
})
.then(function(transactionRegistries){
    // Retrieved transaction Registries
});
```



### Returns
**{@link Promise}** - A promise that will be resolved to the {@link TransactionRegistry}




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystem**| boolean |*Yes*|if true the returned list will include the system transaction registries (optional, default to false)|








### Example
```javascript
// Get the transaction registry
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getAllTransactionRegistries();
})
.then(function(transactionRegistries){
    // Retrieved transaction Registries
});
```



## transactionRegistryExists
_Promise transactionRegistryExists( string id )_


Determine whether a transaction registry exists.



### Example
```javascript
// Determine whether an transaction registry exists
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetwork){
    return businessNetwork.transactionRegistryExists('businessNetworkIdentifier.registryId');
})
.then(function(exists){
    // if (exists === true) {
    // logic here...
    //}
});
```



### Returns
**{@link Promise}** - A promise that will be resolved with a boolean indicating whether the transaction registry exists.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The unique identifier of the transaction registry|








### Example
```javascript
// Determine whether an transaction registry exists
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetwork){
    return businessNetwork.transactionRegistryExists('businessNetworkIdentifier.registryId');
})
.then(function(exists){
    // if (exists === true) {
    // logic here...
    //}
});
```



## getHistorian
_Promise getHistorian(  )_


Get the historian



### Example
```javascript
// Get the historian
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getHistorian();
})
.then(function(historian){
    // Retrieved historian
});
```



### Returns
**{@link Promise}** - A promise that will be resolved to the {@link Historian}




### See also






### Parameters

No parameters







### Example
```javascript
// Get the historian
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getHistorian();
})
.then(function(historian){
    // Retrieved historian
});
```



## getIdentityRegistry
_Promise getIdentityRegistry(  )_


Get the identity registry.



### Example
```javascript
// Get the identity registry
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getIdentityRegistry();
})
.then(function(identityRegistry){
    // Retrieved identity registry
});
```



### Returns
**{@link Promise}** - A promise that will be resolved to the {@link IdentityRegistry}




### See also






### Parameters

No parameters







### Example
```javascript
// Get the identity registry
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.getIdentityRegistry();
})
.then(function(identityRegistry){
    // Retrieved identity registry
});
```



## connect
_Promise connect( String cardname, [Object additionalconnectoptions] )_


Connects to a business network using a business network card, and authenticates to the Hyperledger Fabric.



### Example
```javascript
// Connect and log in to HLF
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('cardName')
.then(function(businessNetworkDefinition){
    // Connected
});
```



### Returns
**{@link Promise}** - A promise to a BusinessNetworkDefinition that indicates the connection is complete




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**cardName**| String |*Yes*|businessNetworkCard Name (must have been imported already)|
|**additionalConnectOptions**| Object |*Yes*|Additional configuration options supplied at runtime that override options set in the connection profile. which will override those in the specified connection profile.|








### Example
```javascript
// Connect and log in to HLF
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('cardName')
.then(function(businessNetworkDefinition){
    // Connected
});
```



## getRegistry
_Promise getRegistry( String fullyqualifiedname )_


Given a fully qualified name, works out and looks up the registry that this resource will be found in. This only gives back the default registry - it does not look in any application defined registry.



### Example
```javascript
// Locate the registry for a fully qualififed name
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetwork){
    var sampleAssetRegistry = businessNetwork.getRegistry('org.acme.sampleAsset');
    var sampleTransactionRegistry = businessNetwork.getRegistry('org.acme.sampleTransaction');
     var sampleParticipantRegistry = businessNetwork.getRegistry('org.acme.sampleParticipant');
});
```



### Returns
**{@link Promise}** - resolved with the registry that this fqn could be found in by default




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**fullyQualifiedName**| String |*Yes*|The fully qualified name of the resources|








### Example
```javascript
// Locate the registry for a fully qualififed name
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetwork){
    var sampleAssetRegistry = businessNetwork.getRegistry('org.acme.sampleAsset');
    var sampleTransactionRegistry = businessNetwork.getRegistry('org.acme.sampleTransaction');
     var sampleParticipantRegistry = businessNetwork.getRegistry('org.acme.sampleParticipant');
});
```



## disconnect
_Promise disconnect(  )_


Disconnects from the Hyperledger Fabric.



### Example
```javascript
// Disconnects from HLF
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.disconnect();
})
.then(function(){
    // Disconnected.
});
```



### Returns
**{@link Promise}** - A promise that will be resolved when the connection is terminated.




### See also






### Parameters

No parameters







### Example
```javascript
// Disconnects from HLF
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetworkDefinition.disconnect();
})
.then(function(){
    // Disconnected.
});
```



## submitTransaction
_Promise submitTransaction( Resource transaction )_


Submit a transaction for processing by the currently connected business network.



### Example
```javascript
// Submits a transaction
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    var factory = businessNetworkDefinition.getBusinessNetwork().getFactory();
    var transaction = factory.newTransaction('network.transactions', 'TransactionType');
    return businessNetworkDefinition.submitTransaction(transaction);
})
.then(function(){
    // Submitted a transaction.
});
```



### Returns
**{@link Promise}** - A promise that will be fulfilled when the transaction has been processed.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**transaction**| Resource |*Yes*|The transaction to submit. Use {@link common-Factory#newTransaction newTransaction} to create this object.|








### Example
```javascript
// Submits a transaction
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    var factory = businessNetworkDefinition.getBusinessNetwork().getFactory();
    var transaction = factory.newTransaction('network.transactions', 'TransactionType');
    return businessNetworkDefinition.submitTransaction(transaction);
})
.then(function(){
    // Submitted a transaction.
});
```



## buildQuery
_Query buildQuery( string query )_


Build a query ready for later execution. The specified query string must be written in the Composer query language.
This functionality is Blockchain platform dependent. For example, when a Composer business network is deployed to Hyperledger Fabric v1.0, Hyperledger Fabric must be configured with the CouchDB database for the world state.



### Example
```javascript
// Build and execute a query.
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
  .then(function () {
    var query = businessNetwork.buildQuery('SELECT org.acme.sample.SampleAsset WHERE (value == _$inputValue)');
    return businessNetwork.query(query, { inputValue: 'blue' })
  })
  .then(function (assets) {
    assets.forEach(function (asset) {
      // Process each asset.
    });
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link runtime-Query}** - The built query, which can be passed in a call to query.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**query**| string |*Yes*|The query string, written using the Composer query language.|








### Example
```javascript
// Build and execute a query.
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
  .then(function () {
    var query = businessNetwork.buildQuery('SELECT org.acme.sample.SampleAsset WHERE (value == _$inputValue)');
    return businessNetwork.query(query, { inputValue: 'blue' })
  })
  .then(function (assets) {
    assets.forEach(function (asset) {
      // Process each asset.
    });
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## query
_Promise query( string; Query query, [Object parameters] )_


Execute a query defined in a Composer query file, or execute a query built with buildQuery.
This functionality is Blockchain platform dependent. For example, when a Composer business network is deployed to Hyperledger Fabric v1.0, Hyperledger Fabric must be configured with the CouchDB database for the world state.



### Example
```javascript
// Execute the query.
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
  .then(function () {
    return query('Q1', { inputValue: 'blue' })
  })
  .then(function (assets) {
    assets.forEach(function (asset) {
      // Process each asset.
    });
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise that will be resolved with an array of {@link module:composer-common.Resource Resource} representing the resources returned by the query.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**query**| string; Query |*Yes*|The name of the query, or a built query.|
|**parameters**| Object |*Yes*|The parameters for the query.|








### Example
```javascript
// Execute the query.
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
  .then(function () {
    return query('Q1', { inputValue: 'blue' })
  })
  .then(function (assets) {
    assets.forEach(function (asset) {
      // Process each asset.
    });
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## ping
_Promise ping(  )_


Test the connection to the runtime and verify that the version of the runtime is compatible with this level of the client node.js module.



### Example
```javascript
// Test the connection to the runtime
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetwork.ping();
})
.then(function(){
    // Connection tested.
});
```



### Returns
**{@link Promise}** - A promise that will be fulfilled when the connection has been tested. The promise will be rejected if the version is incompatible.




### See also






### Parameters

No parameters







### Example
```javascript
// Test the connection to the runtime
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    return businessNetwork.ping();
})
.then(function(){
    // Connection tested.
});
```



## issueIdentity
_Promise issueIdentity( Resource; Relationship; string participant, string identityname, [object options] )_


Issue an identity with the specified name and map it to the specified participant.





### Returns
**{@link Promise}** - A promise that will be fulfilled when the identity has been added to the specified participant. The promise will be rejected if the participant does not exist, or if the identity is already mapped to another participant.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**participant**| Resource; Relationship; string |*Yes*|The participant, a relationship to the participant, or the fully qualified identifier of the participant. The participant must already exist.|
|**identityName**| string |*Yes*|The name for the new identity.|
|**options**| object |*Yes*|Options for the new identity.|



### Sub-options

| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options.issuer**| boolean |*Yes*|Whether or not the new identity should have permissions to create additional new identities. False by default.|






## bindIdentity
_Promise bindIdentity( Resource; string participant, string certificate )_


Bind an existing identity to the specified participant.





### Returns
**{@link Promise}** - A promise that will be fulfilled when the identity has been added to the specified participant. The promise will be rejected if the participant does not exist, or if the identity is already mapped to another participant.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**participant**| Resource; string |*Yes*|The participant, or the fully qualified identifier of the participant. The participant must already exist.|
|**certificate**| string |*Yes*|The certificate for the existing identity.|










## revokeIdentity
_Promise revokeIdentity( Resource; string identity )_


Revoke the specified identity by removing any existing mapping to a participant.





### Returns
**{@link Promise}** - A promise that will be fulfilled when the identity has been removed from the specified participant. The promise will be rejected if the participant does not exist, or if the identity is not mapped to the participant.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**identity**| Resource; string |*Yes*|The identity, or the identifier of the identity.|








 

##Inherited methods

 