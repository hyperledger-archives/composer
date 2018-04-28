---
layout: default
title: Scenarios
section: performance
sidebar: sidebars/accordion-toc0.md
excerpt: "{{site.data.conrefs.composer_full}} Performance Scenarios"
---
# {{site.data.conrefs.composer_full}} Test Scenarios
Performance benchmark tests are run against available sample networks and Composer API components.

## Sample Network Transactions
Transaction scenarios involve multiple interactions with the underlying blockchain platform and are based on the available {{site.data.conrefs.composer_full}} sample networks. Sample networks are deployed to a Fabric instance, and the test framework populates the business network with a set of artifacts during an initialisation phase. Following this, transactions are issued that relate to the transaction(s) available for the deployed sample network.

### Marbles Network
This scenario investigates the update of an asset. Two participants are created, with one of the participants being assigned as the owner of a number of `Marble` assets. The `TradeMarble` transaction is used to sequentially transfer ownership of marbles from one participant to the other and performs the following:

- Retrieve the `Marble` asset registry
- Update a `Marble` within the `Marble` asset registry based on passed parameters
  - get the `Marble` by identifier
  - modify the `Marble` object
  - update the `Marble` in the registry

### Digital Property Network
This scenario investigates the update of an existing asset. A single participant and a number of `LandTitle` assets are created, owned by the participant. The participant is used to update a set of existing assets through the `RegisterPropertyForSale` transaction. The transaction performs the following:	

- Retrieve the `LandTitle` asset registry
- Update a `LandTitle` within the `LandTitle` asset registry based on passed parameters
  - get the `LandTitle` by identifier
  - modify the `LandTitle` object
  - update the `LandTitle` in the registry

### Bond Network
This scenario investigates the creation of an asset. A single participant is used to create an asset, which contains a relationship to the creator through the `PublishBond` transaction. This transaction performs the following:

- Retrieve the `BondAsset` asset registry
- Define a `BondAsset` resource based on passed parameters
- Add `BondAsset` to the `BondAsset` asset registry
  - Check if `BondAsset` already exists
  - Add `BondAsset` if it does not exist

### Vehicle Lifecycle Network
This scenario investigates three transactions: Creation of an `Order` through a `PlaceOrder` transaction, update of an `Order` through a `UpdateOrderStatus` transaction, and update of the `Vehicle` status through a `ScrapVehicle` transaction.

1)	`PlaceOrder` Transaction process

- Create the new `Order` based on passed parameters
- Retrieve the `Order` asset registry
- Add the new `Order` to the `Order` asset registry
- Create a `PlaceOrderEvent` event
- Emit the `PlaceOrderEvent` event

2)	`UpdateOrderStatus` Transaction process

- Retrieve the `Vehicle` asset egistry
- Retrieve a target `Vehicle` from the `Vehicle` asset registry
- Create multiple new relationships for the `Vehicle` based on passed parameters
- Update the `Vehicle` in the `Vehicle` asset registry
- Retrieve the `Order` asset registry
- Retrieve an `Order` from the `Order` asset registry
- Change the state of the `Order` based on passed parameters
- Update the `Order` in the `Order` asset registry
- Create an `UpdateOrderStatusEvent` event
- Emit the `UpdateOrderStatusEvent` event

3)	`ScrapVehicle` Transaction process

- Retrieve the `Vehicle` asset registry
- Retrieve a `Vehicle` from the `Vehicle` asset registry
- Change the state of the `Vehicle` based on passed parameters
- Update the `Vehicle` in the `Vehicle` asset registry


## Composer API Tests
Micro tests are based on flexing a single aspect of the {{site.data.conrefs.composer_full}} API. Each test is unique, since each test will require a specific initialization bespoke to the test purpose. The main test phase involves using a business network connection to interact with an aspect of the {{site.data.conrefs.composer_full}} API.

### Query 
This test investigates the issuance of a compiled query. Following the creation of a set of assets, a query is compiled that returns a subset of the assets. The test issues the query, and returns once a response is recieved. This API invocation performs the following:

- Passes parameters to use in a named query
- Converts the query for use by the Fabric API
- Issues the query
- Resolves the results of the query
- Checks all results against Access Control rules
- Returns the permitted query objects
