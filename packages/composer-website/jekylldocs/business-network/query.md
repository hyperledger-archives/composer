---
layout: default
title: Querying Business Network Data
category: tasks
section: business-network
sidebar: sidebars/businessnetworks.md
excerpt: Using {{site.data.conrefs.hlf_full}} and CouchDB, you can query assets in the stored world-state and return listed assets by using a transaction processor function.
---

# Querying business network data

>Warning
The status of this feature is experimental. You **must** use Hyperledger Composer v0.8+ with the the HLFv1 runtime to use queries. We welcome feedback and comments while we continue to iterate upon query functionality. The API may change based on the feedback received. In future releases we plan to extend this feature with a Composer specific query language, and data-binding to assets, participants and transactions.

{{site.data.conrefs.hlf_full}} v1.0 can be configured to store the world-state in a CouchDB database. CouchDB is a JSON document store, so all data in the world-state is persisted as JSON documents, including Composer assets, participants and transactions.

When {{site.data.conrefs.hlf_full}} is used in CouchDB mode chaincode can execute complex (content-based) queries against the world-state data. The queries are written in the Mango query language, the native CouchDB query language.

An example Mango _selector_ query:
        var q = {
            selector: {
                size: 'SMALL'
            }
        };

This query will select all JSON documents in the document store that contain the property `size` that has the value `SMALL`. Please refer to the CouchDB documentation for the [query syntax for Mango queries](http://docs.couchdb.org/en/2.0.0/api/database/find.html). Note that CouchDB ships with a powerful web interface called [Fauxton](http://couchdb.apache.org/fauxton-visual-guide/). You can use Fauxton to inspect the documents in the document store, run queries, view results etc.

### Running Native CouchDB Mango Queries from Transaction Processor Functions

The Composer runtime API includes the `queryNative(queryString)` method, allowing transaction processor functions to submit native Mango queries to CouchDB. Composer will execute the query against CouchDB, returning a promise to a JS Object that captures the results of running the query.

The JS Object returned is composed of an array of objects, each with a `Key` and `Record` property. `Key` is a string that represents the key of the document in the document store. `Record` is a JS Object that captures the data for the document itself.

### Example

The example below runs a content-based query to select all `SMALL` marbles, verifies the number of marbles returned, and that they are indeed all `SMALL`.

```
/**
 * Executes a CouchDB query and checks the results.
 * @param {org.fabric_composer.marbles.QueryMarbleByOwner} transaction
 * @transaction
 * @return {Promise} a promise to the results of transaction processing
 */
function onQueryMarbleByOwner(transaction) {
    var factory = getFactory();
    // create the query
    var q = {
        selector: {
            size: 'SMALL'
        }
    };
    return queryNative(JSON.stringify(q))
        .then(function (resultArray) {
            print('TP function received query result: ', JSON.stringify(resultArray));
            if (resultArray.length !== 5) {
                throw new Error('The incorrect number of marbles found: ', resultArray.length);
            }
            for (var x = 0; x < resultArray.length; x++) {
                var currentResult = resultArray[x];
                if (currentResult.Record.size !== 'SMALL') {
                    throw new Error('Query returned a marble that is not SMALL!', currentResult.Record);
                }
            }
        });
}
```

Using a selector it is possible to query all assets of a given type, with a given set of properties, and then to convert them back into Composer resources using `getSerializer().fromJSON(jsObject)`. Once the JS object returned by a query have been converted back into a Composer object it can be updated and persisted back into an asset registry.

>Note that in the future Composer will define a query language expressed in terms of assets, participants and transactions and automatically marshall the JS objects returned by CouchDB to the corresponding Composer modelled types.
