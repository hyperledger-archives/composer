---
layout: default
title: Writing a node.js application
category: start
sidebar: sidebars/applications.md
excerpt: Writing a node.js application
---

# Writing a Node.js Application

---

Let's take a look at the code for a simple Node.js sample application.

Use `git clone` to download the composer-sample-applications repository, available at:

`https://github.com/hyperledger/composer-sample-applications`

The [`landregistry.js`](https://github.com/hyperledger/composer-sample-applications/blob/master/packages/digitalproperty-app/lib/landRegistry.js) file contains a class to the represent the land regsitry and contains methods for listing the land titles, adding default titles, and submitting the transaction.
This has been implemented using a JavaScript class; however you are free to structure your code as you wish. The framework's API is agnostic to this.
The application is also setup as a command line driven application using yargs (see the files in the cmd directory).

We'll look at section of functionality in turn after first looking at the modules that are required and how to connect to a {{site.data.conrefs.composer_full}} hosted application on the {{site.data.conrefs.hlf_full}}.

## Promises
It's worth highlighting that the style of the API is to use promises. Typically {{site.data.conrefs.composer_full}} APIs will return a promise that is resolved when the operation has been successfully completed or with the result of the operation if applicable.

If you're not familiar with Promise based development it's worth reviewing some of the tutorials online to get an idea. For example [https://scotch.io/tutorials/understanding-javascript-promises-pt-i-background-basics]

##  Modules required

```javascript
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
```
For a client application this is only {{site.data.conrefs.composer_full}} require needed. In this getting started application we also use the `cli-table` and `winston` and `config` modules for support processing. We use these to get information from the command line options, formatting of output and logging.

```javascript
const winston = require('winston');
let config = require('config').get('gettingstarted');

// these are the credentials to use to connect to the Hyperledger Fabric
let participantId = config.get('participantId');
let participantPwd = config.get('participantPwd');
const LOG = winston.loggers.get('application');
```


## Connecting to the {{site.data.conrefs.composer_full}} Runtime
We've split the code to connect into two parts, part in the constructor of the object and part in an initialization method. This is an implementation decision made for this example - you are free to structure this in the way that best suits your application. What's important is the API calls and the data.

The key thing here is that we need to create a new BusinessNetworkConnection object; and get from application configuration, the connection profile and the business network identifier needed.

```javascript
this.bizNetworkConnection = new BusinessNetworkConnection();
this.CONNECTION_PROFILE_NAME = config.get('connectionProfile');
this.businessNetworkIdentifier = config.get('businessNetworkIdentifier');
```

The first {{site.data.conrefs.composer_full}} API call that we are going to make here, is the connect() API, to establish the connection to the {{site.data.conrefs.composer_full}} runtime on the Hyperledger Fabric.
This API returns the businessNetworkDefinition if successful - which we hold onto.  The API takes, the connection profile name, business network identifier and participant details.

```javascript
this.bizNetworkConnection.connect(this.CONNECTION_PROFILE_NAME, this.businessNetworkIdentifier, participantId, participantPwd)
.then((result) => {
  this.businessNetworkDefinition = result;
});
```

For a client application this is all the essential setup that is required, from this point on it's up to what the application wants to do as to what APIs are called.

##Adding assets to a regsitry
The {{site.data.conrefs.composer_full}} runtime will create a default registry to store assets in. So in this example, a LandTitle registry will have been created. What we want to do here is get access to that registry and then add some assets. This `getAssetRegistry()` takes the fully qualified asset name as defined in the CTO model file (That's namespace plus asset name). It returns a promise that is resolved with the asset registry, which we hold onto.

```javascript
this.bizNetworkConnection.getAssetRegistry('net.biz.digitalPropertyNetwork.LandTitle')
.then((result) => {
    this.titlesRegistry = result;
});
```

Next step is to create some assets (look for the method `_bootstrapTitles` in the code )

We use a factory style pattern to be able to create assets. A factory is obtained from the businessNetworkDefinition we got early. From this we can create an instance of a 'person'.  Note the use of the namespace and asset name.  Then we can set the properties of this asset. The indentifiers here (firstName lastName) matches with the identifiers in the model.

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
This is using an API to add multiple titles, which returns a promise that is resolved when the assets are added. The last thing we need to do is add the Person, Fred Bloggs. As this is a 'participant', it's added using a different. It is very similar to assets, but this time the getParticipantRegistry API is used.

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
You can see how the owner and title information are being accessed in a very simple manner

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
The getAssetRegistry call should now be looking a bit familar, the get API is used to get a specific land title.
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

That's it!
