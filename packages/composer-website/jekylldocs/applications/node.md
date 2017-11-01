---
layout: default
title: Writing a Node.js application
section: applications
category: start
index-order: 601
sidebar: sidebars/accordion-toc0.md
excerpt: "[**Developing Node.js applications to work with Hyperledger Composer**](./node.html) allows you to  programmatically connect to a deployed business network, create, read, update and delete assets and participants and to submit transactions."
---

# Writing Node.js Applications


Application developers use the `composer-client` npm module to programmatically connect to a deployed business network, create, read, update and delete assets and participants and to submit transactions. If applications need to be able to deploy or administer business networks, then the `composer-admin` npm module can be used.

The sample [`landregistry.js`](https://github.com/hyperledger/composer-sample-applications/blob/master/packages/digitalproperty-app/lib/landRegistry.js) file contains a class to the represent the land regsitry and contains methods for listing the land titles, adding default titles, and submitting the transaction. This has been implemented using a JavaScript class; however you are free to structure your code as you wish.

It's worth highlighting that the style of the API is to use promises. Typically {{site.data.conrefs.composer_full}} APIs will return a promise that is resolved when the operation has been successfully completed or with the result of the operation if applicable.

If you're not familiar with Promise based development it's worth reviewing some of the tutorials online to get an idea.

## Modules required

```javascript
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
```

For a {{site.data.conrefs.composer_full}} client application this is the only npm module required.

## Connecting to the {{site.data.conrefs.composer_full}} Runtime

A BusinessNetworkConnection instance is created and then used to connect to a runtime:

```javascript
this.bizNetworkConnection = new BusinessNetworkConnection();
this.CONNECTION_PROFILE_NAME = config.get('connectionProfile');
this.businessNetworkIdentifier = config.get('businessNetworkIdentifier');
```

The first {{site.data.conrefs.composer_full}} API call that we are going to make here, is the connect() API, to establish the connection to the {{site.data.conrefs.composer_full}} runtime on the Hyperledger Fabric.
This API returns a Promise to the businessNetworkDefinition if successful:

```javascript
this.bizNetworkConnection.connect(this.CONNECTION_PROFILE_NAME, this.businessNetworkIdentifier, participantId, participantPwd)
.then((result) => {
  this.businessNetworkDefinition = result;
});
```

For a client application this is all the essential setup that is required, from this point on it's up to what the application wants to do as to what APIs are called.

## Adding assets to a registry

The {{site.data.conrefs.composer_full}} runtime will create a default registry for each type of modeled asset. So in this example, a LandTitle registry will have been created. What we want to do here is get access to that registry and then add some assets. The `getAssetRegistry()` method takes the fully qualified asset name as defined in the CTO model file (that is the namespace plus the name of the asset type). It returns a promise that is resolved with the asset registry:

```javascript
this.bizNetworkConnection.getAssetRegistry('net.biz.digitalPropertyNetwork.LandTitle')
.then((result) => {
    this.titlesRegistry = result;
});
```

Next step is to create some assets (look for the method `_bootstrapTitles` in the code )

A factory style pattern is used to create assets. A factory is obtained from the businessNetworkDefinition and used to create instances of all the types defined in the business network.  Note the use of the namespace and asset name.  Then we can set the properties of this asset. The identifiers here (firstName lastName) matches with the properties defined in the model.

```javascript
let factory = this.businessNetworkDefinition.getFactory();
owner = factory.newResource('net.biz.digitalPropertyNetwork', 'Person', 'PID:1234567890');
owner.firstName = 'Fred';
owner.lastName = 'Bloggs';
```

We now have a Person! Now we need a land title. Note how the owner is specified as being the person we just created. (In the actual sample code we do this code twice to create landTitle1 and landTitle2).

```javascript
let landTitle2 = factory.newResource('net.biz.digitalPropertyNetwork', 'LandTitle', 'LID:6789');
landTitle2.owner = owner;
landTitle2.information = 'A small flat in the city';
```

We now have a land title created that needs to be stored in the registry.

```javascript
this.titlesRegistry.addAll([landTitle1, landTitle2]);
```
This is using an API to add multiple titles, which returns a promise that is resolved when the assets are added. The last thing we need to do is add the Person, Fred Bloggs. As this is a 'participant', the getParticipantRegistry API is used.

```javascript
this.bizNetworkConnection.getParticipantRegistry('net.biz.digitalPropertyNetwork.Person')
  .then((personRegistry) => {
      return personRegistry.add(owner);
  })
```

##Listing assets in a regsitry
In the sample application this is handled in a different method `list()`.  The same setup as for putting assets is required, so as before we need to get the asset registry but this tile we call the getAll() API. This returns an array of objects.


```javascript
this.bizNetworkConnection.getAssetRegistry('net.biz.digitalPropertyNetwork.LandTitle')
.then((registry) => {
   return registry.getAll();
})
.then((aResources) => {
  // instantiate
  let table = new Table({
    head: ['TitleID', 'OwnerID', 'First Name', 'Surname', 'Description', 'ForSale']
  });
  let arrayLength = aResources.length;
  for(let i = 0; i < arrayLength; i++) {
    let tableLine = [];
    tableLine.push(aResources[i].titleId);
    tableLine.push(aResources[i].owner.personId);
    tableLine.push(aResources[i].owner.firstName);
    tableLine.push(aResources[i].owner.lastName);
    tableLine.push(aResources[i].information);
    tableLine.push(aResources[i].forSale ? 'Yes' : 'No');
    table.push(tableLine);
  }
  // Put to stdout - as this is really a command line app
  return(table);
})
```
Most of this isn't {{site.data.conrefs.composer_full}} API code - but it shows how to access the details of the objects that have been returned. At this point it's worth just looking again at the model.

```
asset LandTitle identified by titleId {
  o String   titleId
  o Person   owner
  o String   information
  o Boolean  forSale   optional
}

participant Person identified by personId {
  o String personId
  o String firstName
  o String lastName
}
```
You can see how the owner and title information are being accessed in a very simple manner.

## Submitting a transactions
The last thing that we need to do is submit a transaction. This is the definition of the transaction in the model file:

```
transaction RegisterPropertyForSale identified by transactionId{
  o String transactionId
  --> LandTitle title
}
```

The transaction has two fields here, a trandsactionId, and a reference to the land title that should be submitted for sale. The first step is get access to the registry for the landtitle, and get back the specific land title we want to submit for sale.


```javascript
this.bizNetworkConnection.getAssetRegistry('net.biz.digitalPropertyNetwork.LandTitle')
.then((registry) => {
  return registry.get('LID:1148');
})
```
The getAssetRegistry call should now be looking a bit familiar, the get API is used to get a specific land title.
The next step is to create the transaction we want to submit.

```javascript
let serializer = this.businessNetworkDefinition.getSerializer();

let resource = serializer.fromJSON({
  '$class': 'net.biz.digitalPropertyNetwork.RegisterPropertyForSale',
  'title': 'LID:1148'
});

return this.bizNetworkConnection.submitTransaction(resource);

```
What we need to do here is create a 'serializer'.  This is able to create a resource - this resource is then passed to the submitTransaction API. Note that the transaction JSON matches the structure specified in the model file.

## References

* [**JavaScript API Documentation**](../api/api-doc-index.html)
* [**Promises tutorial**](https://scotch.io/tutorials/understanding-javascript-promises-pt-i-background-basics)
