---
layout: default
title: BusinessNetworkConnection (Client API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1215
---
# BusinessNetworkConnection

Use this class to connect to and then interact with a deployed BusinessNetworkDefinition.
Use the AdminConnection class in the composer-admin module to deploy BusinessNetworksDefinitions.

### Details
- **Extends** EventEmitter
- **Module** client

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `Promise` | [addAssetRegistry](#addassetregistry-string-string) | Add a new asset registry.  |
| `Promise` | [addParticipantRegistry](#addparticipantregistry-string-string) | Add a new participant registry.  |
| `Promise` | [assetRegistryExists](#assetregistryexists-string) | Determine whether a asset registry exists.  |
| `Promise` | [bindIdentity](#bindidentity-string) | Bind an existing identity to the specified participant.  |
| `Query` | [buildQuery](#buildquery-string) | Build a query ready for later execution. The specified query string must be written  |
| `Promise` | [connect](#connect-string-string-string-string-object) | Connects to a business network using a connection profile, and authenticates to the Hyperledger Fabric.  |
| `void` | [constructor](#constructor-object-connectionprofilestore-object) | Create an instance of the BusinessNetworkConnection class.  |
| `Promise` | [disconnect](#disconnect) | Disconnects from the Hyperledger Fabric.  |
| `Promise` | [getAllAssetRegistries](#getallassetregistries-boolean) | Get a list of all existing asset registries.  |
| `Promise` | [getAllParticipantRegistries](#getallparticipantregistries-boolean) | Get a list of all existing participant registries.  |
| `Promise` | [getAllTransactionRegistries](#getalltransactionregistries-boolean) | Get all transaction registries.  |
| `Promise` | [getAssetRegistry](#getassetregistry-string) | Get an existing asset registry.  |
| `BusinessNetworkDefinition` | [getBusinessNetwork](#getbusinessnetwork) | Returns the currently connected BusinessNetworkDefinition  |
| `Promise` | [getHistorian](#gethistorian) | Get the historian  |
| `Promise` | [getIdentityRegistry](#getidentityregistry) | Get the identity registry.  |
| `Promise` | [getParticipantRegistry](#getparticipantregistry-string) | Get an existing participant registry.  |
| `Promise` | [getRegistry](#getregistry-string) | Given a fully qualified name, works out and looks up the registry that this resource will be found in.  |
| `Promise` | [getTransactionRegistry](#gettransactionregistry-string) | Get the transaction registry.  |
| `Promise` | [issueIdentity](#issueidentity-string-object-boolean) | Issue an identity with the specified name and map it to the specified  |
| `Promise` | [participantRegistryExists](#participantregistryexists-string) | Determine whether a participant registry exists.  |
| `Promise` | [ping](#ping) | Test the connection to the runtime and verify that the version of the  |
| `Promise` | [query](#query-object) | Execute a query defined in a Composer query file, or execute a query built with buildQuery.  |
| `Promise` | [revokeIdentity](#revokeidentity) | Revoke the specified identity by removing any existing mapping to a participant.  |
| `Promise` | [submitTransaction](#submittransaction-resource) | Submit a transaction for processing by the currently connected business network.  |
| `Promise` | [transactionRegistryExists](#transactionregistryexists-string) | Determine whether a transaction registry exists.  |


## Method Details


## new BusinessNetworkConnection() 




Create an instance of the BusinessNetworkConnection class.
must be called to connect to a deployed BusinessNetworkDefinition.







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options**|`Object`|true|an optional set of options to configure the instance.|
|**options.connectionProfileStore**|`ConnectionProfileStore`|true|specify a connection profile store to use.|
|**options.fs**|`Object`|true|specify an fs implementation to use.|




## getBusinessNetwork() 




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
`BusinessNetworkDefinition` - the business network





### Parameters


No parameters



## getAllAssetRegistries(boolean) 




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
`Promise` - A promise that will be resolved with a list of existing
asset registries





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystem**|`boolean`|true|if true the returned list will include the system transaction registries (optional, default to false)|




## getAssetRegistry(string) 




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
`Promise` - A promise that will be resolved with the existing asset
registry, or rejected if the asset registry does not exist.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**|`string`|true|The unique identifier of the asset registry|




## assetRegistryExists(string) 




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
`Promise` - A promise that will be resolved with a boolean indicating whether the asset
registry exists.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**|`string`|true|The unique identifier of the asset registry|




## addAssetRegistry(string,string) 




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
`Promise` - A promise that will be resolved with the new asset
registry after it has been added.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**|`string`|true|The unique identifier of the asset registry|
|**name**|`string`|true|The name of the asset registry|




## getAllParticipantRegistries(boolean) 




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
`Promise` - A promise that will be resolved with a list of existing
participant registries





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystem**|`boolean`|true|if true the returned list will include the system transaction registries (optional, default to false)|




## getParticipantRegistry(string) 




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
`Promise` - A promise that will be resolved with the existing participant
registry, or rejected if the participant registry does not exist.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**|`string`|true|The unique identifier of the participant registry|




## participantRegistryExists(string) 




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
`Promise` - A promise that will be resolved with a boolean indicating whether the participant
registry exists.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**|`string`|true|The unique identifier of the participant registry|




## addParticipantRegistry(string,string) 




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
`Promise` - A promise that will be resolved with the new participant
registry after it has been added.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**|`string`|true|The unique identifier of the participant registry|
|**name**|`string`|true|The name of the participant registry|




## getTransactionRegistry(string) 




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
`Promise` - A promise that will be resolved to the {@link TransactionRegistry}





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**|`string`|true|The unique identifier of the transaction registry|




## getAllTransactionRegistries(boolean) 




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
`Promise` - A promise that will be resolved to the {@link TransactionRegistry}





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystem**|`boolean`|true|if true the returned list will include the system transaction registries (optional, default to false)|




## transactionRegistryExists(string) 




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
`Promise` - A promise that will be resolved with a boolean indicating whether the transaction
registry exists.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**|`string`|true|The unique identifier of the transaction registry|




## getHistorian() 




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
`Promise` - A promise that will be resolved to the {@link Historian}





### Parameters


No parameters



## getIdentityRegistry() 




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
`Promise` - A promise that will be resolved to the {@link IdentityRegistry}





### Parameters


No parameters



## connect(string,string,string,string,object) 




Connects to a business network using a connection profile, and authenticates to the Hyperledger Fabric.



### Example
```javascript
// Connect and log in to HLF
var businessNetwork = new BusinessNetworkConnection();
return businessNetwork.connect('testprofile', 'businessNetworkIdentifier', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(businessNetworkDefinition){
    // Connected
});
```




### Returns
`Promise` - A promise to a BusinessNetworkDefinition that indicates the connection is complete





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**connectionProfile**|`string`|true|The name of the connection profile|
|**businessNetwork**|`string`|true|The identifier of the business network|
|**enrollmentID**|`string`|true|the enrolment ID of the user|
|**enrollmentSecret**|`string`|true|the enrolment secret of the user|
|**additionalConnectOptions**|`Object`|true|Additional configuration options supplied
at runtime that override options set in the connection profile.
which will override those in the specified connection profile.|




## getRegistry(string) 




Given a fully qualified name, works out and looks up the registry that this resource will be found in.
This only gives back the default registry - it does not look in any application defined registry.



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
`Promise` - resolved with the registry that this fqn could be found in by default





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**fullyQualifiedName**|`String`|true|The fully qualified name of the resources|




## disconnect() 




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
`Promise` - A promise that will be resolved when the connection is
terminated.





### Parameters


No parameters



## submitTransaction(resource) 




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
`Promise` - A promise that will be fulfilled when the transaction has
been processed.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**transaction**|`Resource`|true|The transaction to submit. Use {@link
Factory#newTransaction newTransaction} to create this object.|




## buildQuery(string) 




Build a query ready for later execution. The specified query string must be written
in the Composer query language.

This functionality is Blockchain platform dependent. For example, when a Composer
business network is deployed to Hyperledger Fabric v1.0, Hyperledger Fabric must be
configured with the CouchDB database for the world state.



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
`Query` - The built query, which can be passed in a call to query.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**query**|`string`|true|The query string, written using the Composer query language.|




## query(object) 




Execute a query defined in a Composer query file, or execute a query built with buildQuery.

This functionality is Blockchain platform dependent. For example, when a Composer
business network is deployed to Hyperledger Fabric v1.0, Hyperledger Fabric must be
configured with the CouchDB database for the world state.



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
`Promise` - A promise that will be resolved with an array of
{@link module:composer-common.Resource Resource} representing the
resources returned by the query.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**query**|``|true|The name of the query, or a built query.|
|**parameters**|`Object`|true|The parameters for the query.|




## ping() 




Test the connection to the runtime and verify that the version of the
runtime is compatible with this level of the client node.js module.



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
`Promise` - A promise that will be fulfilled when the connection has
been tested. The promise will be rejected if the version is incompatible.





### Parameters


No parameters



## issueIdentity(string,object,boolean) 




Issue an identity with the specified name and map it to the specified
participant.






### Returns
`Promise` - A promise that will be fulfilled when the identity has
been added to the specified participant. The promise will be rejected if
the participant does not exist, or if the identity is already mapped to
another participant.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**participant**|``|true|The participant, a
relationship to the participant, or the fully qualified identifier of
the participant. The participant must already exist.|
|**identityName**|`string`|true|The name for the new identity.|
|**options**|`object`|true|Options for the new identity.|
|**options.issuer**|`boolean`|true|Whether or not the new identity should have
permissions to create additional new identities. False by default.|




## bindIdentity(string) 




Bind an existing identity to the specified participant.






### Returns
`Promise` - A promise that will be fulfilled when the identity has
been added to the specified participant. The promise will be rejected if
the participant does not exist, or if the identity is already mapped to
another participant.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**participant**|``|true|The participant, or the fully qualified
identifier of the participant. The participant must already exist.|
|**certificate**|`string`|true|The certificate for the existing identity.|




## revokeIdentity() 




Revoke the specified identity by removing any existing mapping to a participant.






### Returns
`Promise` - A promise that will be fulfilled when the identity has
been removed from the specified participant. The promise will be rejected if
the participant does not exist, or if the identity is not mapped to the
participant.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**identity**|``|true|The identity, or the identifier of the identity.|


 
