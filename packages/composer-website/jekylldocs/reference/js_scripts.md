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
* @param {org.example.sampleTransaction} parameter-name A human description of the parameter
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
* @param {org.example.sampleTransaction} parameter-name A human description of the parameter
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
 * @param {org.acme.sample.SampleTransaction} tx The sample transaction instance.
 * @transaction
 */
async function sampleTransaction(tx) {

    // Save the old value of the asset.
    let oldValue = tx.asset.value;

    // Update the asset with the new value.
    tx.asset.value = tx.newValue;

    // Get the asset registry for the asset.
    let assetRegistry = getAssetRegistry('org.acme.sample.SampleAsset');

    // Update the asset in the asset registry.
    await assetRegistry.update(tx.asset);

    // Emit an event for the modified asset.
    let event = getFactory().newEvent('org.acme.sample', 'SampleEvent');
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
 * @param {org.acme.sample.SampleTransaction} tx The sample transaction instance.
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
namespace org.acme.sample

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
 * @param {org.acme.sample.SampleTransaction} tx The sample transaction instance.
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

## Promise returns in transaction processor functions

Similarly to relationships, transaction processor functions will wait for promises to be resolved before committing the transaction. If a promise is rejected, the transaction will fail.

In the example code below there are several promises, the transaction will not be completed until each promise has returned.

Model file:

```
namespace org.acme.sample

transaction SampleTransaction {

}
```

Node 8 syntax is now supported which means that you can now use `async/await` syntax instead which is far
more concise than using promise chains. This is the recommended style.

Script file:


```javascript
/**
 * Sample transaction processor function.
 * @param {org.acme.sample.SampleTransaction} tx The sample transaction instance.
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
 * @param {org.acme.sample.SampleTransaction} tx The sample transaction instance.
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
namespace org.acme.sample

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
 * @param {org.acme.sample.SampleTransaction} tx The sample transaction instance.
 * @transaction
 */
async function sampleTransaction(tx) {
    // Update the value in the asset.
    let asset = tx.asset;
    asset.value = tx.newValue;
    // Get the asset registry that stores the assets. Note that
    // getAssetRegistry() returns a promise, so we have to await for it.
    let assetRegistry = await getAssetRegistry('org.acme.sample.SampleAsset');

    // Update the asset in the asset registry. Again, note
    // that update() returns a promise, so so we have to return
    // the promise so that Composer waits for it to be resolved.
    await assetRegistry.update(asset);
}
```

### Calling {{site.data.conrefs.hlf_full}} {{site.data.conrefs.hlf_latest}} APIs in transaction processor functions

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

## What next?

Transaction processor functions can also be used to:

- [**Define queries**](../business-network/query.html) for retrieving information about the blockchain world-state from a couchDB database.
- [**Define events**](../business-network/publishing-events.html) for sending event data to applications.
