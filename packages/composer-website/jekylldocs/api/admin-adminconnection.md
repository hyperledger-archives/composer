---
layout: default
title: AdminConnection (Admin API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1211
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# AdminConnection

This class creates an administration connection to a Hyperledger Composer runtime. The
connection can then be used to:


- Deploy BusinessNetworkDefinitions
- Undeploy BusinessNetworkDefinitions
- Update BusinessNetworkDefinitions
- Send a ping message to the runtime to ensure it is running and correctly configured.
- Store a connection profile document in the connection profile store


Note: that the methods on this class take the 'businessNetworkIdentifier'; this has to match
the name given on the create call. An AdminConnection that has been connected to network-A can
only be used to adminster network-A.

Instances of AdminConnections can be reused for different networks. Call `disconnect(..)` then `connect(..)`.
Calling an api after disconnect and before connect will give an error.

### Details

- **Module** admin



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [connect](#connect) | `Promise` | Connects and logs in to the Hyperledger Fabric using a named connection profile  |
| [constructor](#constructor) | `void` | Create an instance of the AdminConnection class  |
| [deleteCard](#deletecard) | `Promise` | Delete an existing card  |
| [deploy](#deploy) | `Promise` | Deploys a new BusinessNetworkDefinition to the Hyperledger Fabric  |
| [disconnect](#disconnect) | `Promise` | Disconnects this connection  |
| [exportCard](#exportcard) | `Promise` | Exports an network card  |
| [getAllCards](#getallcards) | `Promise` | List all Business Network cards  |
| [getLogLevel](#getloglevel) | `Promise` | Get the current logging level of a business network  |
| [hasCard](#hascard) | `Promise` | Has a existing card  |
| [importCard](#importcard) | `Promise` | Import a business network card  |
| [install](#install) | `Promise` | Installs the Hyperledger Composer runtime to the Hyperledger Fabric in preparation for the business network to be started  |
| [list](#list) | `Promise` | List all of the deployed business networks  |
| [ping](#ping) | `Promise` | Test the connection to the runtime and verify that the version of the runtime is compatible with this level of the node  |
| [reset](#reset) | `Promise` | Resets an existing BusinessNetworkDefinition on the Hyperledger Fabric  |
| [setLogLevel](#setloglevel) | `Promise` | Set the logging level of a business network  |
| [start](#start) | `Promise` | Starts a business network within the runtime previously installed to the Hyperledger Fabric with the same name as the business network to be started  |
| [undeploy](#undeploy) | `Promise` | Undeploys a BusinessNetworkDefinition from the Hyperledger Fabric  |
| [update](#update) | `Promise` | Updates an existing BusinessNetworkDefinition on the Hyperledger Fabric  |
| [upgrade](#upgrade) | `Promise` | Upgrades an existing business network's composer runtime to a later level  |





# Method Details


## new AdminConnection()


Create an instance of the AdminConnection class.
The default cardstore is a filesystem based one that stores files in `~/.composer`







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options**| Object |*Yes*|an optional set of options to configure the instance.|



### Sub-options

| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options.cardStore**| BusinessNetworkCardStore |*Yes*|specify a card store implementation to use.|






## importCard
_Promise importCard( String name, IdCard card )_


Import a business network card. If a card of this name exists, it is replaced.





### Returns
**{@link Promise}** - Resolved when the card is imported, resolves to true if updated, false if added.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**name**| String |*Yes*|Name by which this card should be referred|
|**card**| IdCard |*Yes*|The card to import|










## exportCard
_Promise exportCard( String cardname )_


Exports an network card. Should the card not actually contain the certificates in the card, a exportIdentity will be performed to get the details of the cards





### Returns
**{@link Promise}** - resolved with an instance of the network id card populated




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**cardName**| String |*Yes*|The name of the card that needs to be exported|










## getAllCards
_Promise getAllCards(  )_


List all Business Network cards.





### Returns
**{@link Promise}** - resolved with a  Map of idcard objects keyed by their  String names.




### See also






### Parameters

No parameters









## deleteCard
_Promise deleteCard( String name )_


Delete an existing card.





### Returns
**{@link Promise}** - Resolves true if deleted, false if not deleted, is rejected if an error occurs.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**name**| String |*Yes*|Name of the card to delete.|










## hasCard
_Promise hasCard( String name )_


Has a existing card.





### Returns
**{@link Promise}** - Resolves with true if the card with the name exists, resolved with false if not




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**name**| String |*Yes*|Name of the card to check.|










## connect
_Promise connect( String cardname )_


Connects and logs in to the Hyperledger Fabric using a named connection profile.
The connection profile must exist in the profile store.



### Example
```javascript
// Connect to Hyperledger Fabric
let adminConnection = new AdminConnection();
try {
  await adminConnection.connect('userCard@network')
  // Connected.
} catch(error){
    // Add optional error handling here.
}
```



### Returns
**{@link Promise}** - A promise that when resolved indicates the connection is complete




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**cardName**| String |*Yes*|The name of the business network card|








### Example
```javascript
// Connect to Hyperledger Fabric
let adminConnection = new AdminConnection();
try {
  await adminConnection.connect('userCard@network')
  // Connected.
} catch(error){
    // Add optional error handling here.
}
```



## disconnect
_Promise disconnect(  )_


Disconnects this connection.securityContext



### Example
```javascript
// Disconnect from a Business Network
let adminConnection = new AdminConnection();
try {
  await adminConnection.connect('userCard@network')
  // Connected
  await adminConnection.disconnect()
  // and now disconnected.
} catch(error){
    // Add optional error handling here.
}
```



### Returns
**{@link Promise}** - A promise that will be resolved when the connection is terminated.




### See also






### Parameters

No parameters







### Example
```javascript
// Disconnect from a Business Network
let adminConnection = new AdminConnection();
try {
  await adminConnection.connect('userCard@network')
  // Connected
  await adminConnection.disconnect()
  // and now disconnected.
} catch(error){
    // Add optional error handling here.
}
```



## install
_Promise install( String businessnetworkname, Object installoptions )_


Installs the Hyperledger Composer runtime to the Hyperledger Fabric in preparation for the business network to be started. The connection must be connected for this method to succeed. You must pass the name of the business network that is defined in your archive that this runtime will be started with.



### Example
```javascript
// Install the Hyperledger Composer runtime
let adminConnection = new AdminConnection();
let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
try {
   await adminConnection.connect('adminCard@hlfv1')
   await adminConnection.install(businessNetworkDefinition.getName());
    // Business network definition installed
} catch(error){
    // Add optional error handling here.
}
```



### Returns
**{@link Promise}** - A promise that will be fufilled when the business network has been deployed.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**businessNetworkName**| String |*Yes*|The name of business network which will be used to start this runtime.|
|**installOptions**| Object |*Yes*|connector specific install options|








### Example
```javascript
// Install the Hyperledger Composer runtime
let adminConnection = new AdminConnection();
let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
try {
   await adminConnection.connect('adminCard@hlfv1')
   await adminConnection.install(businessNetworkDefinition.getName());
    // Business network definition installed
} catch(error){
    // Add optional error handling here.
}
```



## start
_Promise start( BusinessNetworkDefinition businessnetworkdefinition, [Object startoptions] )_


Starts a business network within the runtime previously installed to the Hyperledger Fabric with the same name as the business network to be started. The connection must be connected for this method to succeed.



### Example
```javascript
// Start a Business Network Definition
let adminConnection = new AdminConnection();
let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
try {
    await adminConnection.connect('userCard@network')
    await adminConnection.start(businessNetworkDefinition,
             { networkAdmins:
                 [ {userName : 'admin', enrollmentSecret:'adminpw'} ]
             }

    // Business network definition is started
} catch(error){
    // Add optional error handling here.
}
```



### Returns
**{@link Promise}** - A promise that will be fufilled when the business network has been deployed - with a MAP of cards key is name




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**businessNetworkDefinition**| BusinessNetworkDefinition |*Yes*|The business network to start|
|**startOptions**| Object |*Yes*|connector specific start options                  networkAdmins:   [ { userName, certificate } , { userName, enrollmentSecret  }]|








### Example
```javascript
// Start a Business Network Definition
let adminConnection = new AdminConnection();
let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
try {
    await adminConnection.connect('userCard@network')
    await adminConnection.start(businessNetworkDefinition,
             { networkAdmins:
                 [ {userName : 'admin', enrollmentSecret:'adminpw'} ]
             }

    // Business network definition is started
} catch(error){
    // Add optional error handling here.
}
```



## deploy
_Promise deploy( BusinessNetworkDefinition businessnetworkdefinition, Object deployoptions )_


Deploys a new BusinessNetworkDefinition to the Hyperledger Fabric. The connection must be connected for this method to succeed.



### Example
```javascript
// Deploy a Business Network Definition
let adminConnection = new AdminConnection();
let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
try {
   await adminConnection.connect('userCard@network')
   await adminConnection.deploy(businessNetworkDefinition)
   // Business network definition deployed
} catch(error) {
    // Add error handling here.
}
```



### Returns
**{@link Promise}** - A promise that will be fufilled when the business network has been deployed.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**businessNetworkDefinition**| BusinessNetworkDefinition |*Yes*|The business network to deploy|
|**deployOptions**| Object |*Yes*|connector specific deployment options                deployOptions.card the card to use for the NetworkAdmin|








### Example
```javascript
// Deploy a Business Network Definition
let adminConnection = new AdminConnection();
let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
try {
   await adminConnection.connect('userCard@network')
   await adminConnection.deploy(businessNetworkDefinition)
   // Business network definition deployed
} catch(error) {
    // Add error handling here.
}
```



## undeploy
_Promise undeploy( String businessnetworkname )_


Undeploys a BusinessNetworkDefinition from the Hyperledger Fabric. The business network will no longer be able to process transactions.



### Example
```javascript
// Undeploy a Business Network Definition
let adminConnection = new AdminConnection();
try {
   await adminConnection.connect('userCard@network')
   await adminConnection.undeploy('network-name')
   // Undeployed Business Network Definition
} catch(error){
    // Add error handling here.
}
```



### Returns
**{@link Promise}** - A promise that will be fufilled when the business network has been undeployed.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**businessNetworkName**| String |*Yes*|The name of business network that will be used to start this runtime.|








### Example
```javascript
// Undeploy a Business Network Definition
let adminConnection = new AdminConnection();
try {
   await adminConnection.connect('userCard@network')
   await adminConnection.undeploy('network-name')
   // Undeployed Business Network Definition
} catch(error){
    // Add error handling here.
}
```



## update
_Promise update( BusinessNetworkDefinition businessnetworkdefinition )_


Updates an existing BusinessNetworkDefinition on the Hyperledger Fabric. The BusinessNetworkDefinition must have been previously deployed.



### Example
```javascript
// Updates a Business Network Definition
let adminConnection = new AdminConnection();
let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
try {
   await adminConnection.connect('userCard@network')
   await adminConnection.update(businessNetworkDefinition)
   // Business network definition updated
} catch(error){
    // Add optional error handling here.
}
```



### Returns
**{@link Promise}** - A promise that will be fufilled when the business network has been updated.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**businessNetworkDefinition**| BusinessNetworkDefinition |*Yes*|The new BusinessNetworkDefinition|








### Example
```javascript
// Updates a Business Network Definition
let adminConnection = new AdminConnection();
let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
try {
   await adminConnection.connect('userCard@network')
   await adminConnection.update(businessNetworkDefinition)
   // Business network definition updated
} catch(error){
    // Add optional error handling here.
}
```



## reset
_Promise reset( String businessnetworkname )_


Resets an existing BusinessNetworkDefinition on the Hyperledger Fabric. The BusinessNetworkDefinition must have been previously deployed.
Note this will remove ALL the contents of the network registries, but not any system registries



### Example
```javascript
// Resets a Business Network Definition
let adminConnection = new AdminConnection();
let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
try {
   await adminConnection.connect('userCard@network')
   await adminConnection.reset('network-name')
   // Business network data removed
} catch(error){
    // Add error handling here.
}
```



### Returns
**{@link Promise}** - A promise that will be fufilled when the business network has been updated.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**businessNetworkName**| String |*Yes*|The name of business network that will be reset|








### Example
```javascript
// Resets a Business Network Definition
let adminConnection = new AdminConnection();
let businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
try {
   await adminConnection.connect('userCard@network')
   await adminConnection.reset('network-name')
   // Business network data removed
} catch(error){
    // Add error handling here.
}
```



## upgrade
_Promise upgrade( string businessnetworkname, [object upgradeoptions] )_


Upgrades an existing business network's composer runtime to a later level. The connection must be connected specifying the business network identifier as part of the connection for this method to succeed.



### Example
```javascript
// Upgrade the Hyperledger Composer runtime
let adminConnection = new AdminConnection();
try {
   await adminConnection.connect('adminCard@hlfv1')
   await adminConnection.upgrade('digitalproperty-network');

   // Business network definition upgraded
} catch(error) => {
   // Add error handling here.
}
```



### Returns
**{@link Promise}** - A promise that will be fufilled when the composer runtime has been upgraded, or rejected otherwise.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**businessNetworkName**| string |*Yes*|The name of the business network|
|**upgradeOptions**| object |*Yes*|connector specific options|








### Example
```javascript
// Upgrade the Hyperledger Composer runtime
let adminConnection = new AdminConnection();
try {
   await adminConnection.connect('adminCard@hlfv1')
   await adminConnection.upgrade('digitalproperty-network');

   // Business network definition upgraded
} catch(error) => {
   // Add error handling here.
}
```



## ping
_Promise ping(  )_


Test the connection to the runtime and verify that the version of the runtime is compatible with this level of the node.js module.



### Example
```javascript
// Test the connection to the runtime
let adminConnection = new AdminConnection();
try {
   await adminConnection.connect('userCard@network');
   await adminConnection.ping();
    // Connection has been tested
} catch(error){
    // Add error handling here.
}
```



### Returns
**{@link Promise}** - A promise that will be fufilled when the connection has been tested. The promise will be rejected if the version is incompatible.




### See also






### Parameters

No parameters







### Example
```javascript
// Test the connection to the runtime
let adminConnection = new AdminConnection();
try {
   await adminConnection.connect('userCard@network');
   await adminConnection.ping();
    // Connection has been tested
} catch(error){
    // Add error handling here.
}
```



## setLogLevel
_Promise setLogLevel( any newloglevel )_


Set the logging level of a business network. The connection must be connected for this method to succeed.



### Example
```javascript
// Set the logging level of a business network.
let adminConnection = new AdminConnection();
try {
   await adminConnection.connect('userCard@network')
   await adminConnection.setLogLevel('DEBUG')
   console.log('log level set to DEBUG');
} catch(error){
    // Add error handling here.
}
```



### Returns
**{@link Promise}** - A promise that resolves if successful.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**newLogLevel**| any |*Yes*|new logging level|








### Example
```javascript
// Set the logging level of a business network.
let adminConnection = new AdminConnection();
try {
   await adminConnection.connect('userCard@network')
   await adminConnection.setLogLevel('DEBUG')
   console.log('log level set to DEBUG');
} catch(error){
    // Add error handling here.
}
```



## getLogLevel
_Promise getLogLevel(  )_


Get the current logging level of a business network. The connection must be connected for this method to succeed.



### Example
```javascript
// Get the current logging level of a business network.
let adminConnection = new AdminConnection();
try {
   await adminConnection.connect('userCard@network');
   let currentLogLevel = await adminConnection.getLogLevel();
    console.log('current log level is ' + currentLogLevel);
} catch(error){
    // Add error handling here.
}
```



### Returns
**{@link Promise}** - A promise that resolves with the current logging level if successful.




### See also






### Parameters

No parameters







### Example
```javascript
// Get the current logging level of a business network.
let adminConnection = new AdminConnection();
try {
   await adminConnection.connect('userCard@network');
   let currentLogLevel = await adminConnection.getLogLevel();
    console.log('current log level is ' + currentLogLevel);
} catch(error){
    // Add error handling here.
}
```



## list
_Promise list(  )_


List all of the deployed business networks. The connection must be connected for this method to succeed.



### Example
```javascript
// List all of the deployed business networks.
let adminConnection = new AdminConnection();
try {
   await adminConnection.connect('userCard@network');
   let businessNetworks = await adminConnection.list();
   businessNetworks.forEach((businessNetwork) => {
      console.log('Deployed business network', businessNetwork);
   });
} catch(error){
    // Add error handling here.
}
```



### Returns
**{@link Promise}** - A promise that will be resolved with an array of business network identifiers, or rejected with an error.




### See also






### Parameters

No parameters







### Example
```javascript
// List all of the deployed business networks.
let adminConnection = new AdminConnection();
try {
   await adminConnection.connect('userCard@network');
   let businessNetworks = await adminConnection.list();
   businessNetworks.forEach((businessNetwork) => {
      console.log('Deployed business network', businessNetwork);
   });
} catch(error){
    // Add error handling here.
}
```

 

##Inherited methods

 