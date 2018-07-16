---
layout: default
title: "Calling external HTTP or REST services"
category: start
section: integrating
status: experimental
index-order: 709
sidebar: sidebars/accordion-toc0.md
excerpt: "[**Transaction processor functions can be used to call external REST services**](./call-out.html). This allows you to move complex computation off the blockchain."
---

# Calling an HTTP or REST API from Transaction Processor Functions

In some cases it is desirable to be able to call HTTP or REST APIs from transaction processor functions. This allows you to move complex or expensive computation from the blockchain to a centrally or peer hosted service.

Alternatively, a transaction processor function may wish to call third party HTTP or REST APIs that provides external data. For example, a third party API may provide data about the current price of a stock, or the current weather and temperature, which can be used to determine whether or not the conditions of a contract have been fulfilled.

{{site.data.conrefs.composer_full}} allows a transaction processor function developer to call an HTTP or REST API from within a transaction processor function.

> Please note that using this function can lead to errors that are caused by consensus failures, and should only be used with care. For more information, see [Consensus considerations](#consensus-considerations) below.

## Using the request module

The `request` module (https://github.com/request/request), is a popular HTTP client used by many Node.js applications. {{site.data.conrefs.composer_full}} embeds the `request` module, so that transaction processor functions can use it to make calls to HTTP or REST APIs.

The standard `request` module uses a callback oriented API. However, transaction processor functions are promise based, and callback oriented APIs result in a lot of unnecessary code to wrap the callbacks in promises. To make the experience easier for transaction processor function developers, we have exposed the promise based `request-promise` module (https://github.com/request/request-promise) instead.

The `request-promise` module is automatically available to all transaction processor functions via the `request` global variable. You do not need to add the `request` or `request-promise` modules to your `package.json` file, nor do you need to use the `require` function to load the modules.

The global `request` method and all of the convenience methods for the various HTTP methods (`request.get`, `request.post`, etc.) are available to transaction processor functions. These methods provide a full set of options for handling request bodies, response bodies, HTTP headers, authentication, cookies, proxies, and TLS/SSL.

For detailed information on these methods and the options available, please review the documentation for the `request` and `request-promise` modules.

## Examples

Make an HTTP GET request to an HTTP server that returns the current stock price as a string:

```javascript
/**
 * Buy a given amount of CONGA stocks.
 * @param {org.example.BuyStocks} transaction The transaction.
 * @transaction
 */
async function buyStocks(transaction) {

    // Look up the current price of the CONGA stock, and parse it into a float.
    const priceAsStr = await request.get('http://stocks.org/CONGA');
    const price = parseFloat(priceAsStr);

    // Get the current participant, and update their stock and balance.
    const participant = getCurrentParticipant();
    const units = transaction.units;
    participant.stockUnits += units;
    participant.balance -= price * units;

    // Update the current participant in the participant registry.
    const participantRegistry = await getParticipantRegistry('org.example.Trader');
    await participantRegistry.update(participant);

}
```

Make an HTTP GET request to an HTTP server that returns the current stock price as a JSON structure:

```javascript
/**
 * Buy a given amount of CONGA stocks.
 * @param {org.example.BuyStocks} transaction The transaction.
 * @transaction
 */
async function buyStocks(transaction) {

    // Look up the current price of the CONGA stock, and extract the price.
    // The option "json: true" automatically parses JSON from the HTTP response.
    const stock = await request.get({ uri: 'http://stocks.org/CONGA', json: true });
    const price = stock.price;

    // Get the current participant, and update their stock and balance.
    const participant = getCurrentParticipant();
    const units = transaction.units;
    participant.stockUnits += units;
    participant.balance -= price * units;

    // Update the current participant in the participant registry.
    const participantRegistry = await getParticipantRegistry('org.example.Trader');
    await participantRegistry.update(participant);

}
```

Make an HTTP POST request to an HTTP server that includes the current participant as the HTTP request body, and returns the current stock price as a string:

```javascript
/**
 * Buy a given amount of CONGA stocks.
 * @param {org.example.BuyStocks} transaction The transaction.
 * @transaction
 */
async function buyStocks(transaction) {

    // Get the current participant.
    const participant = getCurrentParticipant();

    // Look up the current price of the CONGA stock, and extract the price.
    // The option "json" sends the participant as the HTTP request body,
    // and automatically parses JSON from the HTTP response.
    const stock = await request.post({ uri: 'http://stocks.org/CONGA', json: participant });
    const price = stock.price;

    // Get the current participant, and update their stock and balance.
    const units = transaction.units;
    participant.stockUnits += units;
    participant.balance -= price * units;

    // Update the current participant in the participant registry.
    const participantRegistry = await getParticipantRegistry('org.example.Trader');
    await participantRegistry.update(participant);

}
```

Make an HTTP POST request to an HTTP server that returns a serialized instance of a stock asset:

```javascript
/**
 * Buy a given amount of CONGA stocks.
 * @param {org.example.BuyStocks} transaction The transaction.
 * @transaction
 */
async function buyStocks(transaction) {

    // Look up the current price of the CONGA stock, and extract the price.
    // The option "json: true" automatically parses JSON from the HTTP response.
    const json = await request.get({ uri: 'http://stocks.org/CONGA', json: true });

    // Parse the JavaScript object into the stock asset.
    const serializer = getSerializer();
    const stock = serializer.fromJSON(json);
    const price = stock.price;

    // Get the current participant, and update their stock and balance.
    const participant = getCurrentParticipant();
    const units = transaction.units;
    participant.stockUnits += units;
    participant.balance -= price * units;

    // Update the current participant in the participant registry.
    const participantRegistry = await getParticipantRegistry('org.example.Trader');
    await participantRegistry.update(participant);

}
```

## Consensus considerations

In {{site.data.conrefs.hlf_full}}, consensus in a business network is achieved by having peer nodes in multiple organisations endorse transactions. Transactions are endorsed by executing chaincode, and signing the results of that execution. In order for the transaction to be committed by the blockchain network, all peer nodes endorsing the transaction must produce the same results from executing chaincode.

When a business network makes an HTTP request using the APIs described above, those HTTP requests will be executed on all peer nodes endorsing the transaction. This will result in _n_ HTTP requests, where _n_ is the number of peer nodes endorsing the transaction.

In order for consensus to be achieved when business networks make HTTP requests, you must be careful to ensure that transaction processor functions make the same HTTP requests on all peer nodes, and then perform the same processing on the HTTP responses on all peer nodes.

For example, consider a business network that uses an HTTP request to look up a stock price from an external symbol. The business network then uses the stock price to adjust the balance on a participants account. If different peer nodes receive different stock prices, then they will attempt to make different adjustments to the balance on the participants account. This will result in a consensus failure, and the transaction being rejected.

HTTP requests may result in different responses for multiple reasons:

- Peer nodes in different organisations may run in different data centers, in different countries, in different time zones.
- Peer nodes in different organisations may not have access to the HTTP server depending on public internet access and firewall restrictions.
- Peer nodes in different organisations may authenticate to the HTTP server as different users, resulting in different HTTP responses.

In order to minimize the risks of consensus failures when making HTTP requests from a transaction processor function, it is recommended you use make HTTP requests that are either:

- Safe, in that the HTTP request does not modify any state on the HTTP server.
- Idempotent, in that the same HTTP request can be made many times without different outcomes.

## CORS (Cross-Origin Resource Sharing)

Business networks deployed to the Web Browser connection from the {{site.data.conrefs.composer_full}} Playground run inside the web browser. When transaction processor functions inside these business networks make HTTP requests using the APIs described above, those HTTP requests are handled using the HTTP client built into the web browser.

HTTP clients built into the web browser require that the HTTP server is CORS (Cross-Origin Resource Sharing) compliant. If you deploy business networks to the Web Browser connection, then you must ensure that the HTTP server has been configured to be CORS compliant. For more information, see: https://enable-cors.org

## Docker Network Resolution

Business networks deployed to {{site.data.conrefs.hlf_full}} run within a chaincode Docker container. This means that the business networks are subject to the DNS resolution and network services provided by Docker, instead of those services provided by the host machine. Additionally, the chaincode Docker container has its own IP address.

This means that `localhost` resolves to the chaincode Docker container, rather than the host machine. Any HTTP requests made to `localhost`, for example http://localhost:3000/api/Vehicle, will not work as expected. The easiest workaround is to use a DNS name for your REST server that is publicly resolvable.
