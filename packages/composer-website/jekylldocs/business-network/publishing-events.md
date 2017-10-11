---
layout: default
title: Emitting Events
category: tasks
section: business-network
index-order: 504
sidebar: sidebars/accordion-toc0.md
excerpt: Emitting Events from Transaction Processor Functions
---

# Emitting Events

Events can be emitted by {{site.data.conrefs.composer_full}} and subscribed to by external applications. Events are defined in the model file of a business network definition, and are emitted by transaction JavaScript in the transaction processor functions file.

## Before you begin

Before you begin adding events to your business network, you should have a good understanding of the modeling language for business networks, and what makes up a full business network definition.

## Procedure

1. Events are defined in the model file (`.cto`) of your business network definition, in the same way as assets and participants. Events use the following format:


        event BasicEvent {
        }


2. In order for the event to be published the transaction which creates the event must call three functions, the first is the `getFactory` function. The `getFactory` allows events to be created as part of a transaction. Next, an event must be created by using `factory.newEvent('org.namespace', 'BasicEvent')`. This creates a `BasicEvent` defined in a specified namespace. Then the required properties on the event must be set. Lastly, the event must be emitted by using `emit(BasicEvent)`. A simple transaction which calls this event would look like this:

        /**
         * @param {org.namespace.BasicEventTransaction} basicEventTransaction
         * @transaction
         */
        function basicEventTransaction(basicEventTransaction) {
            var factory = getFactory();

            var basicEvent = factory.newEvent('org.namespace', 'BasicEvent');
            emit(basicEvent);
        }

This transaction creates and emits an event of the `BasicEvent` type as defined in the business network's model file. For more information on the getFactory function, see the [{{site.data.conrefs.composer_short}} API documentation](https://hyperledger.github.io/composer/jsdoc/module-composer-runtime.html#getFactory).

## What next?

* [Subscribing to events](../applications/subscribing-to-events.html)
* [Developing applications](../applications/applications-index.html)

---
