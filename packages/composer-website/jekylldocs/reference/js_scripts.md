---
layout: default
title: Transaction Processor Functions
section: reference
index-order: 1007
sidebar: sidebars/accordion-toc0.md
excerpt: "[**A Hyperledger Composer business network must include one or more script files**](./js_scripts.html) to implement transaction logic. The transaction logic is automatically invoked by the runtime whenever the relevant transactions are submitted."
---

# Transaction Processor Functions

---

A {{site.data.conrefs.composer_full}} Business Network Definition is composed of a set of model files and a set of scripts. The scripts may contain transaction processor functions that implement the transactions defined in the Business Network Definition's model files.

Transaction processor functions are automatically invoked by the runtime when transactions are submitted using the BusinessNetworkConnection API.

Decorators within documentation comments are used to annotate the functions with metadata required for runtime processing.

Each transaction type has an associated registry storing the transactions.

## Transaction processor structure

The structure of transaction processor functions includes decorators and metadata followed by a JavaScript function, both parts are required for a transaction processor function to work.

The first line of comments above a transaction processor function contains a human readable description of what the transaction processor function does. The second line must include the `@param` tag to indicate the parameter definition. The `@param` tag is followed by the resource name of the transaction which triggers the transaction processor function, this takes the format of the namespace of the business network, followed by the transaction name. After the resource name, is the parameter name which will reference the resource, this parameter must be supplied to the JavaScript function as an argument. The third line must contain the `@transaction` tag, this tag identifies the code as a transaction processor function and is required.

```
/**
* A transaction processor function description
* @param {org.example.basic.SampleTransaction} parameter-name A human description of the parameter
* @transaction
*/
```

After the comments is the JavaScript function which powers the transaction. The function can have any name, but must include the parameter name defined in the comment as an argument.

```
function transactionProcessor(parameter-name) {
  //Do some things.
}
```

A complete transaction processor function as detailed above would take the following format:

```
/**
* A transaction processor function description
* @param {org.example.basic.SampleTransaction} parameter-name A human description of the parameter
* @transaction
*/
function transactionProcessor(parameter-name) {
  //Do some things.
}
```

## Writing a transaction processor function

A transaction processor function is the logical operation of a transaction defined in a model file. For example, a transaction processor function of a `Trade` transaction, might use JavaScript to change the `owner` property of an asset from one participant to another.

Here's an example from the `basic-sample-network`, the following `SampleAsset` definition includes a property called `value`, which is defined as a string. The `SampleTransaction` transaction requires a relationship to an asset, the asset to be changed, the new value of the `value` property must be supplied as part of the transaction as a property called `newValue`.


```
asset SampleAsset identified by assetId {
  o String assetId
  --> SampleParticipant owner
  o String value
}

transaction SampleTransaction {
  --> SampleAsset asset
  o String newValue
}
```

The transaction processor function relating to the `SampleTransaction` transaction is what makes the change both to the asset and to the registry where the asset is stored.

The transaction processor function defines the `SampleTransaction` type as the associated transaction, and defines it as the parameter `tx`. It then saves the original value of the asset to be changed by the transaction, replaces it with the value passed in during the submission of the transaction (the `newValue` property in the transaction definition), updates the asset in the registry, and then emits an event.

```javascript
/**
 * Sample transaction processor function.
 * @param {org.example.basic.SampleTransaction} tx The sample transaction instance.
 * @transaction
 */
async function sampleTransaction(tx) {

    // Save the old value of the asset.
    let oldValue = tx.asset.value;

    // Update the asset with the new value.
    tx.asset.value = tx.newValue;

    // Get the asset registry for the asset.
    let assetRegistry = await getAssetRegistry('org.example.basic.SampleAsset');

    // Update the asset in the asset registry.
    await assetRegistry.update(tx.asset);

    // Emit an event for the modified asset.
    let event = getFactory().newEvent('org.example.basic', 'SampleEvent');
    event.asset = tx.asset;
    event.oldValue = oldValue;
    event.newValue = tx.newValue;
    emit(event);
}
```

## Error handling in transaction processor functions

Transaction processor functions will fail and roll back any changes already made an error is thrown. The whole transaction fails, not just the transaction processing, and anything changed by the transaction processor function before the error occurred will be rolled back.

```javascript
/**
 * Sample transaction processor function.
 * @param {org.example.basic.SampleTransaction} tx The sample transaction instance.
 * @transaction
 */
async function sampleTransaction(tx) {
    // Do something.
    throw new Error('example error');
    // Execution stops at this point; the transaction fails and rolls back.
    // Any updates made by the transaction processor function are discarded.
    // Transaction processor functions are atomic; all changes are committed,
    // or no changes are committed.
}
```

Changes made by transactions are atomic, either the transaction is successful and all changes are applied, or the transaction fails and no changes are applied.

## Resolving relationships in transactions

When assets, transactions, or participants involved in a transaction have a property which includes a relationship, the relationships are resolved automatically. All relationships, including nested relationships, are resolved before the transaction processor functions runs.

The following example includes nested relationships, the transaction has a relationship with an asset, which has a relationship with a participant, because all relationships are resolved, the `owner` property of the asset is resolved to the specific participant.

Model file:

```
namespace org.example.basic

participant SampleParticipant identified by participantId {
  o String participantId
}

asset SampleAsset identified by assetId {
  o String assetId
  --> SampleParticipant owner
}

transaction SampleTransaction {
  --> SampleAsset asset
}
```

Script file:

```javascript
/**
 * Sample transaction processor function.
 * @param {org.example.basic.SampleTransaction} tx The sample transaction instance.
 * @transaction
 */
async function sampleTransaction(tx) {
    // The relationships in the transaction are automatically resolved.
    // This means that the asset can be accessed in the transaction instance.
    let asset = tx.asset;
    // The relationships are fully or recursively resolved, so you can also
    // access nested relationships. This means that you can also access the
    // owner of the asset.
    let owner = tx.asset.owner;
}
```

In this example, not only can the specific asset referenced by the relationship in the transaction be referenced using `tx.asset`, the specific participant referenced by the `owner` relationship can be referenced using `tx.asset.owner`. In this case, `tx.asset.owner` would resolve to reference a specific participant.

## Handling asynchronous code and promises in transaction processor functions

Similarly to relationships, transaction processor functions will wait for promises to be resolved before committing the transaction. If a promise is rejected, the transaction will fail.

In the example code below there are several promises, the transaction will not be completed until each promise has returned.

Model file:

```
namespace org.example.basic

transaction SampleTransaction {

}
```

Node 8 syntax is now supported which means that you can now use `async/await` syntax instead which is far
more concise than using promise chains. This is the recommended style.

Script file:


```javascript
/**
 * Sample transaction processor function.
 * @param {org.example.basic.SampleTransaction} tx The sample transaction instance.
 * @transaction
 */
async function sampleTransaction(tx) {
    let assetRegistry = await getAssetRegistry(...);
    await assetRegistry.update(...);
}
```

however if you so wish you can still use old style promise chains

```javascript
/**
 * Sample transaction processor function.
 * @param {org.example.basic.SampleTransaction} tx The sample transaction instance.
 * @transaction
 */
function sampleTransaction(tx) {
    // Transaction processor functions can return promises; Composer will wait
    // for the promise to be resolved before committing the transaction.
    // Do something that returns a promise.
    return Promise.resolve()
        .then(function () {
            // Do something else that returns a promise.
            return Promise.resolve();
        })
        .then(function () {
            // Do something else that returns a promise.
            // This transaction is complete only when this
            // promise is resolved.
            return Promise.resolve();
        });
}
```

## Using APIs in transaction processor functions

The {{site.data.conrefs.composer_full}} and {{site.data.conrefs.hlf_full}} APIs can be called within transaction processor functions.


### Calling the {{site.data.conrefs.composer_full}} APIs in transaction processor functions

The {{site.data.conrefs.composer_full}} API can be called simply by calling API functions with the appropriate arguments in the transaction processor function.

In the code example below, the `getAssetRegistry` call returns a promise which is resolved before the transaction is complete.

Model file:

```
namespace org.example.basic

asset SampleAsset identified by assetId {
  o String assetId
  o String value
}

transaction SampleTransaction {
  --> SampleAsset asset
  o String newValue
}
```

Script file:

```javascript
/**
 * Sample transaction processor function.
 * @param {org.example.basic.SampleTransaction} tx The sample transaction instance.
 * @transaction
 */
async function sampleTransaction(tx) {
    // Update the value in the asset.
    let asset = tx.asset;
    asset.value = tx.newValue;
    // Get the asset registry that stores the assets. Note that
    // getAssetRegistry() returns a promise, so we have to await for it.
    let assetRegistry = await getAssetRegistry('org.example.basic.SampleAsset');

    // Update the asset in the asset registry. Again, note
    // that update() returns a promise, so so we have to return
    // the promise so that Composer waits for it to be resolved.
    await assetRegistry.update(asset);
}
```

### Calling {{site.data.conrefs.hlf_full}} APIs in transaction processor functions

To call the {{site.data.conrefs.hlf_full}} API in a transaction processor function, the function `getNativeAPI` must be called, followed by a function from the {{site.data.conrefs.hlf_full}} API. Using the {{site.data.conrefs.hlf_full}} API gives you access to functionality which is not available in the {{site.data.conrefs.composer_full}} API.

**IMPORTANT: Using the {{site.data.conrefs.hlf_full}} API such as `getState`, `putState`, `deleteState`, `getStateByPartialCompositeKey`, `getQueryResult` functions will bypass the {{site.data.conrefs.composer_full}} access control rules (ACLs).**

In the example below, the {{site.data.conrefs.hlf_full}} API function `getHistoryForKey` is called, which returns the history of a specified asset as an iterator. The transaction processor function then stores the returned data in an array.

For more information on the {{site.data.conrefs.hlf_full}} APIs you can call in a transaction processor function, see the [{{site.data.conrefs.hlf_full}} API documentation](https://fabric-shim.github.io/ChaincodeStub.html).

```javascript
async function simpleNativeHistoryTransaction (transaction) {
    const id = transaction.assetId;
    const nativeSupport = transaction.nativeSupport;

    const nativeKey = getNativeAPI().createCompositeKey('Asset:systest.transactions.SimpleStringAsset', [id]);
    const iterator = await getNativeAPI().getHistoryForKey(nativeKey);
    let results = [];
    let res = {done : false};
    while (!res.done) {
        res = await iterator.next();

        if (res && res.value && res.value.value) {
            let val = res.value.value.toString('utf8');
            if (val.length > 0) {
                results.push(JSON.parse(val));
            }
        }
        if (res && res.done) {
            try {
                iterator.close();
            }
            catch (err) {
            }
        }
    }
}
```

## Returning data from transaction processor functions

Transaction processor functions can optionally return data to client applications. This can be useful for returning a receipt to the submitter of the transaction, or returning an asset modified by the transaction to avoid a separate lookup of the asset after the transaction has been committed. Data can also be returned to the client application via a transaction REST API for the business network, eg a POST method to return data (as described below) to the client application.

The return data for a transaction processor function must be a valid type, either a primitive type (String, Integer, Long, etc.), or a type modelled using the Composer modelling language - a concept, asset, participant, transaction, event or enumeration.

The type of the return data must also be specified on the model for the transaction using the `@returns(Type)` decorator, and the return data must be the last thing returned by the transaction processor function. If you have multiple transaction processor functions for a single transaction, only one of those transaction processor functions can return data. If the return data is missing, or is of the wrong type, then the transaction will fail and will be rejected.

### Returning a primitive type from a transaction processor function

Here is an example of a transaction processor function that returns a String to a client application.

Model file:

    namespace org.sample

    @returns(String)
    transaction MyTransaction {

    }

Transaction processor function:

    /**
     * Handle a transaction that returns a string.
     * @param {org.sample.MyTransaction} transaction The transaction.
     * @returns {string} The string.
     * @transaction
     */
    async function myTransaction(transaction) {
        return 'hello world!';
    }

Client application:

    const bnc = new BusinessNetworkConnection();
    await bnc.connect('admin@sample-network');
    const factory = bnc.getBusinessNetwork().getFactory();
    const transaction = factory.newTransaction('org.sample', 'MyTransaction');
    const string = await bnc.submitTransaction(transaction);
    console.log(`transaction returned ${string}`);

Here is an example of a transaction processor function that returns an array of integers to a client application.

Model file:

    namespace org.sample

    @returns(Integer[])
    transaction MyTransaction {

    }

Transaction processor function:

    /**
     * Handle a transaction that returns an array of integers.
     * @param {org.sample.MyTransaction} transaction The transaction.
     * @returns {number[]} The array of integers.
     * @transaction
     */
    async function myTransaction(transaction) {
        return [1, 2, 3];
    }

Client application:

    const bnc = new BusinessNetworkConnection();
    await bnc.connect('admin@sample-network');
    const factory = bnc.getBusinessNetwork().getFactory();
    const transaction = factory.newTransaction('org.sample', 'MyTransaction');
    const integers = await bnc.submitTransaction(transaction);
    for (const integer of integers) {
        console.log(`transaction returned ${integer}`);
    }

### Returning a complex type from a transaction processor function

Here is an example of a transaction processor function that returns a concept to a client application. The same code can be modified to return an asset, participant, transaction or event as well.

Model file:

    namespace org.sample

    concept MyConcept {
        o String value
    }

    @returns(MyConcept)
    transaction MyTransaction {

    }

Transaction processor function:

    /**
     * Handle a transaction that returns a concept.
     * @param {org.sample.MyTransaction} transaction The transaction.
     * @returns {org.sample.MyConcept} The concept.
     * @transaction
     */
    async function myTransaction(transaction) {
        const factory = getFactory();
        const concept = factory.newConcept('org.sample', 'MyConcept');
        concept.value = 'hello world!';
        return concept;
    }

Client application:

    const bnc = new BusinessNetworkConnection();
    await bnc.connect('admin@sample-network');
    const factory = bnc.getBusinessNetwork().getFactory();
    const transaction = factory.newTransaction('org.sample', 'MyTransaction');
    const concept = await bnc.submitTransaction(transaction);
    console.log(`transaction returned ${concept.value}`);

Here is an example of a transaction processor function that returns an array of concepts to a client application.

Model file:

    namespace org.sample

    concept MyConcept {
        o String value
    }

    @returns(MyConcept[])
    transaction MyTransaction {

    }

Transaction processor function:

    /**
     * Handle a transaction that returns an array of concepts.
     * @param {org.sample.MyTransaction} transaction The transaction.
     * @returns {org.sample.MyConcept[]} The array of concepts.
     * @transaction
     */
    async function myTransaction(transaction) {
        const factory = getFactory();
        const concept1 = factory.newConcept('org.sample', 'MyConcept');
        concept1.value = 'hello alice!';
        const concept2 = factory.newConcept('org.sample', 'MyConcept');
        concept2.value = 'hello bob!';
        const concept3 = factory.newConcept('org.sample', 'MyConcept');
        concept3.value = 'hello charlie!';
        return [ concept1, concept2, concept3 ];
    }

Client application:

    const bnc = new BusinessNetworkConnection();
    await bnc.connect('admin@sample-network');
    const factory = bnc.getBusinessNetwork().getFactory();
    const transaction = factory.newTransaction('org.sample', 'MyTransaction');
    const concepts = await bnc.submitTransaction(transaction);
    for (const concept of concepts) {
        console.log(`transaction returned ${concept.value}`);
    }

### Returning an enumeration from a transaction processor function

Here is an example of a transaction processor function that returns an enumeration to a client application.

Model file:

    namespace org.sample

    enum MyEnum {
        o HELLO
        o WORLD
    }

    @returns(MyEnum)
    transaction MyTransaction {

    }

Transaction processor function:

    /**
     * Handle a transaction that returns an enumeration.
     * @param {org.sample.MyTransaction} transaction The transaction.
     * @returns {org.sample.MyEnum} The enumeration.
     * @transaction
     */
    async function myTransaction(transaction) {
        return 'HELLO';
    }

Client application:

    const bnc = new BusinessNetworkConnection();
    await bnc.connect('admin@sample-network');
    const factory = bnc.getBusinessNetwork().getFactory();
    const transaction = factory.newTransaction('org.sample', 'MyTransaction');
    const enum = await bnc.submitTransaction(transaction);
    console.log(`transaction returned ${enum}`);

Here is an example of a transaction processor function that returns an array of enumerations to a client application.

Model file:

    namespace org.sample

    enum MyEnum {
        o HELLO
        o WORLD
    }

    @returns(MyEnum[])
    transaction MyTransaction {

    }

Transaction processor function:

    /**
     * Handle a transaction that returns an array of enumerations.
     * @param {org.sample.MyTransaction} transaction The transaction.
     * @returns {org.sample.MyEnum[]} The array of enumerations.
     * @transaction
     */
    async function myTransaction(transaction) {
        return [ 'HELLO', 'WORLD' ];
    }

Client application:

    const bnc = new BusinessNetworkConnection();
    await bnc.connect('admin@sample-network');
    const factory = bnc.getBusinessNetwork().getFactory();
    const transaction = factory.newTransaction('org.sample', 'MyTransaction');
    const enums = await bnc.submitTransaction(transaction);
    for (const enum of enums) {
        console.log(`transaction returned ${enum}`);
    }

## Read-only transaction processor functions (query processor functions)

Transactions can be modelled as being read-only by specifying the `@commit(false)` decorator. When a transaction is modelled as read-only, the transaction is submitted as normal, and any transaction processor functions for that transaction are executed as normal. However, the transaction is not committed - it will not be endorsed by multiple peers on the blockchain network, nor will it be sent to the ordering service, nor will it publish any events.

This feature can be useful when the APIs that client applications can use to read data from the business network are too limited for your use case. These APIs include `get(id)` (get by ID), `getAll()` (get all), `exists(id)` (test existence), and `query(q, params)` (execute a complex query). For example, a client application may wish to get all of the assets across multiple business networks deployed to multiple channels in a single call to the blockchain network. Another example is reducing the result set of a query on the "server" (chaincode) side, before returning the result set to the client application, to reduce network traffic and the load on the client application.

Here is an example of a read-only transaction processor function that retrieves a set of assets from the current business network, as well as other business networks, and returns all of the assets to the client application:

Model file:

    namespace org.sample

    asset MyAsset identified by assetId {
        o String assetId
        o String value
    }

    @commit(false)
    @returns(MyAsset[])
    transaction MyTransaction {

    }

Transaction processor function:

    /**
     * Handle a transaction that returns an array of assets.
     * @param {org.sample.MyTransaction} transaction The transaction.
     * @returns {org.sample.MyAsset[]} All the assets.
     * @transaction
     */
    async function myTransaction(transaction) {
        const allAssets = [];
        const assetRegistry = await getAssetRegistry('org.sample.MyAsset');
        const localAssets = await assetRegistry.getAll();
        for (const asset of localAssets) {
            allAssets.push(asset);
        }
        const businessNetworkNames = ['other-network-1', 'other-network-2'];
        for (const businessNetworkName of businessNetworkNames) {
            const response = await getNativeAPI().invokeChaincode(businessNetworkName, ['getAllResourcesInRegistry', 'Asset', 'org.sample.MyAsset'], 'composerchannel');
            const json = JSON.parse(response.payload.toString('utf8'));
            for (const item of json) {
                allAssets.push(getSerializer().fromJSON(item));
            }
        }
        return allAssets;
    }

Client application:

    const bnc = new BusinessNetworkConnection();
    await bnc.connect('admin@sample-network');
    const factory = bnc.getBusinessNetwork().getFactory();
    const transaction = factory.newTransaction('org.sample', 'MyTransaction');
    const assets = await bnc.submitTransaction(transaction);
    for (const asset of assets) {
        console.log(`transaction returned ${asset.value}`);
    }

## What next?

Transaction processor functions can also be used to:

- [**Define queries**](../business-network/query.html) for retrieving information about the blockchain world-state from a couchDB database.
- [**Define events**](../business-network/publishing-events.html) for sending event data to applications.
