---
layout: default
title: Api (Runtime API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1249
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# Api

A class that contains the root of the transaction processor API. Methods in this
class are made available as global functions which can be called by transaction
processor functions. The transaction processor API should expose no internal
properties or internal methods which could be accessed or misused.

### Details

- **Module** runtime



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [buildQuery](#buildquery) | `Query` | Build a query ready for later execution  |
| [emit](#emit) | `void` | Emit an event defined in the transaction  |
| [getAssetRegistry](#getassetregistry) | `Promise` | Get an existing asset registry using the unique identifier of the asset registry  |
| [getCurrentParticipant](#getcurrentparticipant) | `module:composer-common.Resource` | Get the current participant  |
| [getFactory](#getfactory) | `module:composer-runtime.Factory` | Get the factory  |
| [getParticipantRegistry](#getparticipantregistry) | `Promise` | Get an existing participant registry using the unique identifier of the participant registry  |
| [getSerializer](#getserializer) | `module:composer-common.Serializer` | Get the serializer  |
| [post](#post) | `Promise` | Post a typed instance to a HTTP URL  |
| [query](#query) | `Promise` | Execute a query defined in a Composer query file, or execute a query built with buildQuery  |





# Method Details


## getFactory
_module:composer-runtime.Factory getFactory(  )_


Get the factory. The factory can be used to create new instances of assets, participants, and transactions for storing in registries. The factory can also be used for creating relationships to assets, particpants, and transactions.



### Example
```javascript
// Get the factory.
var factory = getFactory();
```



### Returns
**{@link module:composer-runtime.Factory}** - The factory.




### See also
- {@link module:composer-runtime.Factory}




### Parameters

No parameters







### Example
```javascript
// Get the factory.
var factory = getFactory();
```



## getSerializer
_module:composer-common.Serializer getSerializer(  )_


Get the serializer. The serializer can be used to create new instances of assets, participants, and transactions from a JavaScript object, or to create a JavaScript object suitable for long-lived persistence.



### Example
```javascript
// Get the serializer.
var ser = getSerializer();
```



### Returns
**{@link module:composer-common.Serializer}** - The serializer.




### See also






### Parameters

No parameters







### Example
```javascript
// Get the serializer.
var ser = getSerializer();
```



## getAssetRegistry
_Promise getAssetRegistry( string id )_


Get an existing asset registry using the unique identifier of the asset registry. An asset registry can be used to retrieve, update, or delete existing assets, or create new assets.



### Example
```javascript
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Call methods on the vehicle asset registry.
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved with an {@link module:composer-runtime.AssetRegistry AssetRegistry} instance representing the asset registry if it exists. If the asset registry does not exist, or the current user does not have access to the asset registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The ID of the asset registry.|








### Example
```javascript
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Call methods on the vehicle asset registry.
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## getParticipantRegistry
_Promise getParticipantRegistry( string id )_


Get an existing participant registry using the unique identifier of the participant registry. An participant registry can be used to retrieve, update, or delete existing participants, or create new participants.



### Example
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



### Returns
**{@link Promise}** - A promise. The promise is resolved with an {@link module:composer-runtime.ParticipantRegistry ParticipantRegistry} instance representing the participant registry if it exists. If the participant registry does not exist, or the current user does not have access to the participant registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The ID of the participant registry.|








### Example
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



## getCurrentParticipant
_module:composer-common.Resource getCurrentParticipant(  )_


Get the current participant. The current participant is determined by the identity that was used to submit the current transaction.



### Example
```javascript
// Get the current participant.
var currentParticipant = getCurrentParticipant();
// Check to see if the current participant is a driver.
if (currentParticipant.getFullyQualifiedType() !== 'org.acme.Driver') {
  // Throw an error as the current participant is not a driver.
  throw new Error('Current participant is not a driver');
}
// Check to see if the current participant is the first driver.
if (currentParticipant.getFullyQualifiedIdentifier() !== 'org.acme.Driver#DRIVER_1') {
  // Throw an error as the current participant is not a driver.
  throw new Error('Current participant is not the first driver');
}
```



### Returns
**{@link module:composer-common.Resource}** - The current participant, or null if the transaction was submitted using an identity that does not map to a participant.




### See also






### Parameters

No parameters







### Example
```javascript
// Get the current participant.
var currentParticipant = getCurrentParticipant();
// Check to see if the current participant is a driver.
if (currentParticipant.getFullyQualifiedType() !== 'org.acme.Driver') {
  // Throw an error as the current participant is not a driver.
  throw new Error('Current participant is not a driver');
}
// Check to see if the current participant is the first driver.
if (currentParticipant.getFullyQualifiedIdentifier() !== 'org.acme.Driver#DRIVER_1') {
  // Throw an error as the current participant is not a driver.
  throw new Error('Current participant is not the first driver');
}
```



## post
_Promise post( string url, Typed typed, object options )_


Post a typed instance to a HTTP URL





### Returns
**{@link Promise}** - A promise. The promise is resolved with a HttpResponse that represents the result of the HTTP POST.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**url**| string |*Yes*|The URL to post the data to|
|**typed**| Typed |*Yes*|The typed instance to be posted. The instance will be serialized to JSON.|
|**options**| object |*Yes*|The options that are passed to Serializer.toJSON|










## emit
_ emit( Resource event )_


Emit an event defined in the transaction







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**event**| Resource |*Yes*|The event to be emitted|










## buildQuery
_Query buildQuery( string query )_


Build a query ready for later execution. The specified query string must be written in the Composer query language.
This functionality is Blockchain platform dependent. For example, when a Composer business network is deployed to Hyperledger Fabric v1.0, Hyperledger Fabric must be configured with the CouchDB database for the world state.



### Example
```javascript
// Build a query.
var query = buildQuery('SELECT org.acme.sample.SampleAsset WHERE (value == _$inputValue)');
// Execute the query.
return query(query, { inputValue: 'blue' })
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
// Build a query.
var query = buildQuery('SELECT org.acme.sample.SampleAsset WHERE (value == _$inputValue)');
// Execute the query.
return query(query, { inputValue: 'blue' })
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
return query('Q1', { inputValue: 'blue' })
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
return query('Q1', { inputValue: 'blue' })
  .then(function (assets) {
    assets.forEach(function (asset) {
      // Process each asset.
    });
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```

 

##Inherited methods

 