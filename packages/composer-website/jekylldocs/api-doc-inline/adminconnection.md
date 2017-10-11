---
layout: default
title: AdminConnection (Admin API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1211
---
# AdminConnection

This class creates an administration connection to a Hyperledger Composer runtime. The
connection can then be used to:
<ul>
<li>Deploy BusinessNetworkDefinitions</li>
<li>Undeploy BusinessNetworkDefinitions</li>
<li>Update BusinessNetworkDefinitions</li>
<li>Send a ping message to the runtime to ensure it is running and
correctly configured.</li>
<li>Store a connection profile document in the connection profile store</li>
</ul>

### Details
- **Extends** 
- **Module** admin

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `Promise` | [connect](#connect-string-string-string-string) | Connects and logs in to the Hyperledger Fabric using a named connection  |
| `void` | [constructor](#constructor-object-connectionprofilestore-object) | Create an instance of the AdminConnection class.  |
| `Promise` | [createProfile](#createprofile-string-object) | Stores a connection profile into the profile store being used by this  |
| `Promise` | [deleteProfile](#deleteprofile-string) | Deletes the specified connection profile from the profile store being used by this  |
| `Promise` | [deploy](#deploy-businessnetworkdefinition-object) | Deploys a new BusinessNetworkDefinition to the Hyperledger Fabric. The connection must  |
| `Promise` | [disconnect](#disconnect) | Disconnects this connection.  |
| `Promise` | [exportIdentity](#exportidentity-string-string) | Obtain the credentials associated with a given identity.  |
| `Promise` | [getAllProfiles](#getallprofiles) | Retrieve all connection profiles from the profile store being used by this  |
| `Promise` | [getLogLevel](#getloglevel) | Get the current logging level of a business network. The connection must  |
| `Promise` | [getProfile](#getprofile-string) | Retrieve the specified connection profile from the profile store being  |
| `Promise` | [importIdentity](#importidentity-string-string-string-string) | Import an identity into a profiles' wallet. No connection needs to be established  |
| `Promise` | [install](#install-businessnetworkidentifier-object) | Installs the Hyperledger Composer runtime to the Hyperledger Fabric in preparation  |
| `Promise` | [list](#list) | List all of the deployed business networks. The connection must  |
| `Promise` | [ping](#ping) | Test the connection to the runtime and verify that the version of the  |
| `Promise` | [requestIdentity](#requestidentity-string-string-string) | Request the certificates for an identity. No connection needs to be established  |
| `Promise` | [setLogLevel](#setloglevel-any) | Set the logging level of a business network. The connection must  |
| `Promise` | [start](#start-businessnetworkdefinition-object) | Starts a business network within the runtime previously installed to the Hyperledger Fabric with  |
| `Promise` | [undeploy](#undeploy-string) | Undeploys a BusinessNetworkDefinition from the Hyperledger Fabric. The business network will no  |
| `Promise` | [update](#update-businessnetworkdefinition) | Updates an existing BusinessNetworkDefinition on the Hyperledger Fabric. The BusinessNetworkDefinition  |
| `Promise` | [upgrade](#upgrade) | Upgrades an existing business network's composer runtime to a later level.  |


## Method Details


## new AdminConnection() 




Create an instance of the AdminConnection class.







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options**|`Object`|true|an optional set of options to configure the instance.|
|**options.connectionProfileStore**|`ConnectionProfileStore`|true|specify a connection profile store to use.|
|**options.fs**|`Object`|true|specify an fs implementation to use.|




## connect(string,string,string,string) 




Connects and logs in to the Hyperledger Fabric using a named connection
profile. The connection profile must exist in the profile store.



### Example
```javascript
// Connect to Hyperledger Fabric
var adminConnection = new AdminConnection();
adminConnection.connect('testprofile', 'WebAppAdmin', 'DJY27pEnl16d')
.then(function(){
    // Connected.
})
.catch(function(error){
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise that indicates the connection is complete





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**connectionProfile**|`string`|true|The name of the connection profile|
|**enrollmentID**|`string`|true|the enrollment ID of the user|
|**enrollmentSecret**|`string`|true|the enrollment secret of the user|
|**businessNetworkIdentifier**|`string`|true|the id of the network (for update) or null|




## createProfile(string,object) 




Stores a connection profile into the profile store being used by this
AdminConnection.



### Example
```javascript
// Create a connection profile
var adminConnection = new AdminConnection();
var adminOptions = {
    type: 'hlf',
    keyValStore: '/tmp/keyValStore',
    membershipServicesURL: 'grpc://membersrvc:7054',
    peerURL: 'grpc://vp0:7051',
    eventHubURL: 'grpc://vp0:7053'
};
return adminConnection.createProfile('testprofile', adminOptions)
.then(function(){
    // Created profile
})
.catch(function(error){
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise that indicates that the connection profile is deployed





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**connectionProfile**|`string`|true|The name of the connection profile|
|**data**|`Object`|true|The connection profile data|




## deleteProfile(string) 




Deletes the specified connection profile from the profile store being used by this
AdminConnection.



### Example
```javascript
// Delete a connection profile
var adminConnection = new AdminConnection();
return adminConnection.deleteProfile('testprofile')
.then(function(){
    // Deleted profile
})
.catch(function(error){
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise that indicates that the connection profile is deployed





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**connectionProfile**|`string`|true|The name of the connection profile|




## getProfile(string) 




Retrieve the specified connection profile from the profile store being
used by this AdminConnection.



### Example
```javascript
// Retrieve the connection profile.
const adminConnection = new AdminConnection();
return adminConnection.getProfile('testprofile')
  .then((profile) => {
    // Retrieved profile
    console.log(profile);
  });
```




### Returns
`Promise` - A promise that is resolved with the connection profile data.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**connectionProfile**|`string`|true|The name of the connection profile|




## getAllProfiles() 




Retrieve all connection profiles from the profile store being used by this
AdminConnection.



### Example
```javascript
// Retrieve all the connection profiles.
const adminConnection = new AdminConnection();
return adminConnection.getAllProfiles()
  .then((profiles) => {
    // Retrieved profiles
    for (let profile in profiles) {
      console.log(profile, profiles[profile]);
    }
  });
```




### Returns
`Promise` - A promise that is resolved with the connection profile data.





### Parameters


No parameters



## disconnect() 




Disconnects this connection.



### Example
```javascript
// Disconnect from a Business Network
var adminConnection = new AdminConnection();
return adminConnection.disconnect()
.then(function(){
    // Disconnected.
})
.catch(function(error){
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise that will be resolved when the connection is
terminated.





### Parameters


No parameters



## install(businessnetworkidentifier,object) 




Installs the Hyperledger Composer runtime to the Hyperledger Fabric in preparation
for the business network to be started. The connection mustbe connected for this method to succeed.
You must pass the name of the business network that is defined in your archive that this
runtime will be started with.



### Example
```javascript
// Install the Hyperledger Composer runtime
var adminConnection = new AdminConnection();
var businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
return adminConnection.install(businessNetworkDefinition.getName())
.then(function(){
    // Business network definition installed
})
.catch(function(error){
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise that will be fufilled when the business network has been
deployed.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**businessNetworkIdentifier**|`BusinessNetworkIdentifier`|true|The name of business network which will be used to start this runtime.|
|**installOptions**|`Object`|true|connector specific install options|




## start(businessnetworkdefinition,object) 




Starts a business network within the runtime previously installed to the Hyperledger Fabric with
the same name as the business network to be started. The connection must be connected for this
method to succeed.



### Example
```javascript
// Start a Business Network Definition
var adminConnection = new AdminConnection();
var businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
return adminConnection.start(businessNetworkDefinition)
.then(function(){
    // Business network definition is started
})
.catch(function(error){
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise that will be fufilled when the business network has been
deployed.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**businessNetworkDefinition**|`BusinessNetworkDefinition`|true|The business network to start|
|**startOptions**|`Object`|true|connector specific start options|




## deploy(businessnetworkdefinition,object) 




Deploys a new BusinessNetworkDefinition to the Hyperledger Fabric. The connection must
be connected for this method to succeed.



### Example
```javascript
// Deploy a Business Network Definition
var adminConnection = new AdminConnection();
var businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
return adminConnection.deploy(businessNetworkDefinition)
.then(function(){
    // Business network definition deployed
})
.catch(function(error){
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise that will be fufilled when the business network has been
deployed.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**businessNetworkDefinition**|`BusinessNetworkDefinition`|true|The business network to deploy|
|**deployOptions**|`Object`|true|connector specific deployment options|




## undeploy(string) 




Undeploys a BusinessNetworkDefinition from the Hyperledger Fabric. The business network will no
longer be able to process transactions.



### Example
```javascript
// Undeploy a Business Network Definition
var adminConnection = new AdminConnection();
return adminConnection.undeploy('identifier')
.then(function(){
    // Undeployed Business Network Definition
})
.catch(function(error){
    // Add optional error handling here.
})
```




### Returns
`Promise` - A promise that will be fufilled when the business network has been
undeployed.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**businessNetworkIdentifier**|`string`|true|The identifier of the network to undeploy|




## update(businessnetworkdefinition) 




Updates an existing BusinessNetworkDefinition on the Hyperledger Fabric. The BusinessNetworkDefinition
must have been previously deployed.



### Example
```javascript
// Updates a Business Network Definition
var adminConnection = new AdminConnection();
var businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
return adminConnection.update(businessNetworkDefinition)
.then(function(){
    // Business network definition updated
})
.catch(function(error){
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise that will be fufilled when the business network has been
updated.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**businessNetworkDefinition**|`BusinessNetworkDefinition`|true|The new BusinessNetworkDefinition|




## upgrade() 




Upgrades an existing business network's composer runtime to a later level.
The connection must be connected specifying the business network identifier as part of the
connection for this method to succeed.



### Example
```javascript
// Upgrade the Hyperledger Composer runtime
var adminConnection = new AdminConnection();
var businessNetworkDefinition = BusinessNetworkDefinition.fromArchive(myArchive);
return adminConnection.connect(connectionProfileName, upgradeId, upgradeSecret, businessNetworkDefinition.getName())
.then(() => {
     return adminConnection.upgrade();
})
.then(() => {
    // Business network definition upgraded
})
.catch((error) => {
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise that will be fufilled when the composer runtime has been upgraded,
or rejected otherwise.





### Parameters


No parameters



## ping() 




Test the connection to the runtime and verify that the version of the
runtime is compatible with this level of the node.js module.



### Example
```javascript
// Test the connection to the runtime
var adminConnection = new AdminConnection();
return adminConnection.ping()
.then(function(){
    // Connection has been tested
})
.catch(function(error){
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise that will be fufilled when the connection has
been tested. The promise will be rejected if the version is incompatible.





### Parameters


No parameters



## setLogLevel(any) 




Set the logging level of a business network. The connection must
be connected for this method to succeed.



### Example
```javascript
// Set the logging level of a business network.
var adminConnection = new AdminConnection();
return adminConnection.setLogLevel('DEBUG')
.then(() => {
    console.log('log level set to DEBUG');
})
.catch(function(error){
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise that resolves if successful.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**newLogLevel**|`any`|true|new logging level|




## getLogLevel() 




Get the current logging level of a business network. The connection must
be connected for this method to succeed.



### Example
```javascript
// Get the current logging level of a business network.
var adminConnection = new AdminConnection();
return adminConnection.getLogLevel()
.then((currentLogLevel) => {
    console.log('current log level is ' + currentLogLevel);
})
.catch(function(error){
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise that resolves with the current logging level if successful.





### Parameters


No parameters



## list() 




List all of the deployed business networks. The connection must
be connected for this method to succeed.



### Example
```javascript
// List all of the deployed business networks.
var adminConnection = new AdminConnection();
return adminConnection.list()
.then((businessNetworks) => {
    // Connection has been tested
    return businessNetworks.forEach((businessNetwork) => {
      console.log('Deployed business network', businessNetwork);
    });
})
.catch(function(error){
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise that will be resolved with an array of
business network identifiers, or rejected with an error.





### Parameters


No parameters



## importIdentity(string,string,string,string) 




Import an identity into a profiles' wallet. No connection needs to be established
for this method to succeed.



### Example
```javascript
// Import an identity into a profiles' wallet
var adminConnection = new AdminConnection();
return adminConnection.importIdentity('hlfv1', 'PeerAdmin', certificate, privateKey)
.then(() => {
    // Identity imported
    console.log('identity imported successfully');
})
.catch(function(error){
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise which is resolved when the identity is imported





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**connectionProfile**|`string`|true|Name of the connection profile|
|**id**|`string`|true|The id to associate with this identity|
|**certificate**|`string`|true|The signer cert in PEM format|
|**privateKey**|`string`|true|The private key in PEM format|




## requestIdentity(string,string,string) 




Request the certificates for an identity. No connection needs to be established
for this method to succeed.



### Example
```javascript
// Request the cryptographic material for am identity of a hlf v1 environment.
var adminConnection = new AdminConnection();
return adminConnection.requestIdentity('hlfv1', 'admin', 'adminpw')
.then((response) => {
    // Identity returned
    console.log('public signing certificate:');
    console.log(response.certificate);
    console.log('private key:');
    console.log(response.key);
    console.log('ca root certificate:');
    console.log(response.rootCertificate);
})
.catch(function(error){
    // Add optional error handling here.
});
```




### Returns
`Promise` - A promise which is resolved when the identity is imported





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**connectionProfile**|`string`|true|Name of the connection profile|
|**enrollmentID**|`string`|true|The ID to enroll|
|**enrollmentSecret**|`string`|true|The secret for the ID|




## exportIdentity(string,string) 




Obtain the credentials associated with a given identity.






### Returns
`Promise` - Resolves to credentials in the form <em>{ certificate: String, privateKey: String }</em>.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**connectionProfileName**|`String`|true|Name of the connection profile.|
|**id**|`String`|true|Name of the identity.|


 
