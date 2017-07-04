---
layout: default
title: Querying Business Network Data
category: tasks
section: business-network
sidebar: sidebars/businessnetworks.md
excerpt: Queries are used to return data about the blockchain world-state; for example, you could write a query to return all drivers over a defined age parameter, or all drivers with a specific name.
---

# Querying business network data

>**Warning**: The status of this feature is experimental. You **must** use Hyperledger Composer v0.8+ with the the HLFv1 runtime to use queries. We welcome feedback and comments while we continue to iterate upon query functionality. The API may change based on the feedback received.

Queries are used to return data about the blockchain world-state; for example, you could write a query to return all drivers over a defined age parameter, or all drivers with a specific name.

Queries are an optional component of a business network definition, written in a single query file (`queries.qry`).

Note: Queries are supported by the {{site.data.conrefs.hlf_full}} v1.0, embedded and web runtimes. The query support for the embedded and web runtimes currently has limitations and is unstable. When using the {{site.data.conrefs.hlf_full}} v1.0-beta runtime {{site.data.conrefs.hlf_full}} must be configured to use CouchDB persistence. Queries are **not** supported with the {{site.data.conrefs.hlf_full}} v0.6 runtime.

## Writing Queries

Queries must contain a description and a statement. Query descriptions are a string that describe the function of the query. Query statements contain the operators and functions that control the query behavior.

Query descriptions can be any descriptive string. A query statement must include the `SELECT` operator and can optionally include `FROM`, `WHERE`, `AND`, `ORDER BY`, `SKIP`, and `LIMIT`.

Queries should take the following format:

```
query Q1{
  description: "Select all drivers older than 65."
  statement:
      SELECT org.acme.Driver
          WHERE (age>65)
}
```

For more information on the specifics of the {{site.data.conrefs.composer_full}} query language, see the [query language reference documentation](../reference/query-language.html).


## Using Queries

Queries can be invoked by calling the _buildQuery_ or _query_ APIs. The _buildQuery_ API requires the entire query string to be specified as part of the API input. The _query_ API requires you to specify the name of the query you wish to run.

For more information on the query APIs, see the [API documentation](../jsdoc/index.html).

## Access Control for Queries

When returning the results of a query, your access control rules are applied to the results. Any content which the current user does not have authority to view is stripped from the results.

For example, if the current user sends a query that would return all assets, if they only have authority to view a limited selection of assets, the query would return only that limited set of assets.

<!--- {{site.data.conrefs.hlf_full}} v1.0 can be configured to store the world-state in a CouchDB database. CouchDB is a JSON document store, so all data in the world-state is persisted as JSON documents, including Composer assets, participants and transactions.

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

>Note that in the future Composer will define a query language expressed in terms of assets, participants and transactions and automatically marshal the JS objects returned by CouchDB to the corresponding Composer modeled types.
-->
