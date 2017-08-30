---
layout: default
title: Subscribing to events
category: tasks
section: applications
index-order: 603
sidebar: sidebars/accordion-toc0.md
excerpt: Node.js applications can [**subscribe to events from a business network**](./subscribing-to-events.html) by using the `composer-client.BusinessNetworkConnection.on` API call. Events are defined in the business network model file and are emitted by specified transactions in the transaction processor function file. 
---

# Subscribing to events

Node.js applications can subscribe to events from a business network by using the `composer-client.BusinessNetworkConnection.on` API call. Events are defined in the business network model file and are emitted by specified transactions in the transaction processor function file. For more information on publishing events, see [publishing events](../business-network/publishing-events.html).

## Before you begin

Before an application can subscribe to events, you must have defined some events and the transactions which will emit them. The business network must also be deployed and you must have a connection profile that can connect to it.

## Procedure

1. An application must send a specific API call to subscribe to events emitted transactions in a business network. Currently, an application which subscribes to events will receive all events which are emitted. The API call should take the following format:

```Javascript
businessNetworkConnection.on('event', (event) => {
    // event: { "$class": "org.namespace.BasicEvent", "eventId": "0000-0000-0000-000000#0" }
    console.log(event);
});
```

  This includes an event called `BasicEvent` which was created in the [publishing events](../business-network/publishing-events.html) documentation. The `eventId` property is always the same as the `transactionId` of the transaction which emitted the event, with an appended number in the form `"transactionId": "<transactionId>#number"`.

## What next?

The application will now receive all of the events emitted by the business network, and it's up to the application to choose to what extent those events are integrated.

---
