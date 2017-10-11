---
layout: default
title: "Calling external REST services"
category: start
section: integrating
status: experimental
index-order: 708
sidebar: sidebars/accordion-toc0.md
excerpt: "[**Transaction processor functions can be used to call external REST services**](./call-out.html). This allows you to move complex computation off the blockchain."
---

# Calling a REST API from Transaction Processor Functions

---

> The status of this feature is experimental. We welcome your feedback on the utility of this feature. We may evolve the feature in the future to make it more generally useful. While we will strive to ensure backwards compatibility this cannot be guaranteed.

## Scenario

In some cases it is desirable to be able to call REST APIs from transaction processor functions. This allows you to move complex computation off the blockchain. This allows the transaction processor functions to off-board complex or expensive computation to a centrally or peer hosted service.

## Calling an External REST Service

The `post(url,data)` function is available to transaction processor functions, allowing them to pass a concept, transaction, asset or participant to an external service. The data is serialized to JSON and the data is sent to the url using an HTTP POST using the `application/json` content encoding.

Note that the `post` function is supported in all runtime environments: web (playground), Node.js (embedded) and HLF v1.0.

## Handling Results

The `post` method returns a `Promise` to a JS Object that contains the results returned by the remote server. The JS Object has the following properties:

   - statusCode : the HTTP statusCode
   - body : the HTTP response body

Note that HTTP response codes from 200 to 300 are returned as a resolved Promise, while any other response codes cause the Promise to be rejected. Rejected promises may be handled using a `.catch` Promise handler.

The `body` property of the response is automatically converted to a JS Object if possible, otherwise it is returned as a `string`.

Transaction processor functions may optionally call the `getSerializer().fromJSON(object)` function to convert a reponse body JS Object back into a Composer asset/participant/transaction.

## Examples

```
/**
 * Handle a POST transaction, calling Node-RED running on Bluemix
 * @param {org.example.sample.PostTransaction} postTransaction - the transaction to be processed
 * @transaction
 * @return {Promise} a promise that resolves when transaction processing is complete
 */
function handlePost(postTransaction) {
    var url = 'https://composer-node-red.mybluemix.net/compute';

    return post( url, postTransaction)
      .then(function (result) {
        // alert(JSON.stringify(result));
          postTransaction.asset.value = 'Count is ' + result.body.sum;
          return getAssetRegistry('org.example.sample.SampleAsset')
          .then(function (assetRegistry) {
              return assetRegistry.update(postTransaction.asset);
          });
      });
}
```

## Idempotency and Consensus

The result of the REST request should be a pure function (idempotent) to ensure that all peers get the same results with the same inputs. If this restriction is honored then the risk of consensus failure is minimised.

*Each* peer will make a call to the REST service.

## CORS

HTTP requests from the web browser will need to be CORS compliant. This requires the server be setup to receive the OPTIONS method and return appropriate headers.

## Docker Network Resolution

HTTP request from the HLF chain code container require DNS resolution and network are in place. For example, with the default Docker container one cannot use http://localhost as this does not resolve to the host machine inside the Docker container. The easiest workaround is to use a DNS name that is publicly resolvable.
