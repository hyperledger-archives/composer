---
layout: default
title: Transaction Processor Functions
section: reference
index-order: 907
sidebar: sidebars/accordion-toc0.md
excerpt: "[**A Hyperledger Composer business network must include one or more script files**](./js_scripts.html) to implement transaction logic. The transaction logic is automatically invoked by the runtime whenever the relavant transactions are submitted."
---

# Transaction Processor Functions

---

A {{site.data.conrefs.composer_full}} Business Network Definition is composed of a set of model files and a set of scripts. The scripts may contain transaction processor functions that implement the transactions defined in the Business Network Definition's model files.

Transaction processor functions are automatically invoked by the runtime when transactions are submitted using the BusinessNetworkConnection API.

Decorators within documentation comments are used to annotate the functions with metadata required for runtime processing.

## Sample Script

The script below defines two transaction processor functions, called `onAnimalMovementDeparture` and `onAnimalMovementArrival`. Note that the model files within the `BusinessNetworkDefinition` must define the two transaction types `com.ibm.composer.mozart.AnimalMovementDeparture` and `com.ibm.composer.mozart.AnimalMovementArrival`.

        'use strict';

        /*eslint-disable no-unused-vars*/
        /*eslint-disable no-undef*/

        /**
        * A transaction processor for AnimalMovementDeparture
        * @param  {com.ibm.composer.mozart.AnimalMovementDeparture} movementDeparture - the transaction to be processed
        * @transaction
        */
        function onAnimalMovementDeparture(movementDeparture) {
            console.log('onAnimalMovementDeparture');
        }

        /**
        * A transaction processor for AnimalMovementArrival
        * @param  {com.ibm.composer.mozart.AnimalMovementArrival} movementArrival - the transaction to be processed
        * @transaction
        */
        function onAnimalMovementArrival(movementArrival) {
            console.log('onAnimalMovementArrival');
        }

        /*eslint-enable no-unused-vars*/
        /*eslint-enable no-undef*/
        }

Transaction processor functions may use the APIs defined in the `composer-runtime` module to access asset registries to create/read/update/delete assets. The `getCurrentParticipant()` function may be called to determine the identity of the caller (identity used to submit a transaction for processing).

## Decorators

JSDoc documentation comments are used to supply metadata about the purpose and
parameters of the functions in the script.

The standard `@param` decorator must be used to specify the types of parameters for functions.

The `@transaction` decorator is added to a function to indicate that it processes incoming transactions. Functions with the @transaction decorator must take a single transaction type parameter. The transaction type must be defined in the model files in the business network definition.

---

## What next?

Transaction processor functions can also be used to:

- [**Define queries**](../business-network/query.html) for retrieving information about the blockchain world-state from a couchDB database.
- [**Define events**](../business-network/publishing-events.html) for sending event data to applications.
