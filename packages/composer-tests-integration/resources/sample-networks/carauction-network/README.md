# Fabric Composer Car Auction Demo

This is an interactive, distributed, car auction demo, backed by Hyperledger Fabric. Invite participants to join your distributed auction, list assets for sale (setting a reserve price), and watch as assets that have met their reserve price are automatically transferred to the highest bidder at the end of the auction.

## Understanding the Business Network

The easiest way to interact with the demo is using our work-in-progress [Composer Playground web application](http://composer-playground.mybluemix.net). Composer allows you to define a business network (defining the data model and writing transaction processing logic), manage assets & participants and submit transactions.

The data model for the auction business network is defined in a CTO model file, managed in GitHub [here](https://github.com/fabric-composer/sample-networks/blob/master/packages/carauction-network/models/auction.cto).

The data model is very simple (less than 50 lines). It defines the structure of the assets, participants and transactions for a very simple auction.

The business logic is defined in a single Javascript file [here](https://github.com/fabric-composer/sample-networks/blob/master/packages/carauction-network/lib/logic.js). The logic consists of two Javascript functions that are automatically invoked by the Fabric Composer runtime chain code when transactions are submitted for processing.

The `makeOffer` function is called when an `Offer` transaction is submitted. The logic simply checks that the listing for the offer is still for sale, and then adds the offer to the listing, and then updates the offer in the `VehicleListing` asset registry.

The `closeBidding` function is called when a `CloseBidding` transaction is submitted for processing. The logic checks that the listing is still for sale, sorts the offers by bid price, and then if the reserve has been met, transfers the ownership of the vehicle associated with the listing to the highest bidder. Money is transferred from the buyer's account to the seller's account, and then all the modified assets are updated in their respective registries.

Access control for the business network is defined [here](https://github.com/fabric-composer/sample-networks/blob/master/packages/carauction-network/permissions.acl).

### Developer Unit Testing

 > Note that if you `git clone` the [repository](https://github.com/fabric-composer/sample-networks) for the Business Network you can run a unit tests for the logic in the business network using the Fabric Composer embedded runtime which simulates a Hyperledger Fabric using a pure Javascript runtime. Simply run:

 ```
cd packages/carAuction-network
npm install
npm test
```

The unit test [here](https://github.com/fabric-composer/sample-networks/blob/master/packages/carauction-network/test/CarAuction.js) simulates an entire auction and checks that the business logic functions as expected.

## Connect to Composer

You can connect to Composer [here](http://composer-playground.mybluemix.net). If you have used Composer before you may need to clear your cached browser data.

> Playground currently only supports the web profile.

After you are connected make sure that Composer is communicating with the **'hyperledger'** connection profile by clicking the network dropdown at the top-right of the menu. The web profile allows you to test in isolation using a simulated hyperledger, storing the ledger in browser local storage. The 'bluemix' connection profile is to a version of Fabric Composer deployed to bluemix.

## Setting Up the Demo

Before you can hold an auction you need to create and invite some participants to your business network and have something to sell!

### Create Your Participant & Issue an Identity Card

Switch to the Test tab, then click on the `User` participant registry, then click on the `Create Participant` button to create a new instance of a user.

The JSON representation of the User should be:

```
{
  "$class": "org.acme.vehicle.auction.User",
  "email": "daniel.selman@uk.ibm.com",
  "firstName": "Daniel",
  "lastName": "Selman",
  "balance": 10000
}
```

Substitute `daniel.selman@uk.ibm.com` with your email address. Congratulations you are now a participant in this business network!

> Playground does not yet support issuing and managing Fabric identifies.

You now need to issue an identity card for this participant. Click the green ID card icon to the right of your participant. Enter an user id, for example `daniel.selman` and select the "Identity can be used to issue other identities?" checkbox so that this user has permission to invite other users into the business network.

You can switch between identities using the menu option at the top right of the screen.

### Create Assets

Now that you are a participant in the business network and have been issued an identity card you can own assets and take part in an auction.

#### Create a Vehicle

First, let's create a vehicle for auction.

Click on the `Vehicle` asset registry, and then click on the `Create Asset` button to create a new instance of a vehicle that can be auctioned.

The JSON representation of the Vehicle should be:

```
{
  "$class": "org.acme.vehicle.auction.Vehicle",
  "vin": "CAR_001",
  "owner": "daniel.selman@uk.ibm.com"
}
```

Substitute `daniel.selman@uk.ibm.com` for the id of the participant you created above. Congratulations you are now the owner of the vehicle `CAR_001`!

#### Create a Vehicle Listing

The `VehicleListing` asset is used to list vehicles that are available for auction.

Click on the click on the `VehicleListing` asset registry, and then click on the `Create Asset` icon to create a new instance of a vehicle listing.

The JSON representation of the `VehicleListing` should be:

```
{
  "$class": "org.acme.vehicle.auction.VehicleListing",
  "listingId": "LISTING_001",
  "reservePrice": 4000,
  "description": "Ford Mustang",
  "state": "FOR_SALE",
  "vehicle": "CAR_001"
}
```

Congratulations, you've just listed your Ford Mustang for auction, with a reserve price of $4000!

### Create Additional Participants

> Playground does not yet support inviting participants via a URL

An auction with one person is not much fun, so you need to either invite people to use Composer to create their own participants and identities, or you can do it for them. To make it easy for participants that you've created to join the business network (auction) when an identity is issued a personalised URL is generated that you can send to allow participants to join the business network in a single click.

You can send this text via email or Slack to give people an easy mechanism to launch Composer and join your business network.

## Bidding on a VehicleListing

As soon as a `VehicleListing` has been created (and is in the `FOR_SALE` state) participants can submit `Offer` transactions to bid on a vehicle listing.

Click on the Submit Transaction button to submit a new transaction for processing by the business network.

The JSON payload should be:

```
{
  "$class": "org.acme.vehicle.auction.Offer",
  "bidPrice": 250.00,
  "listing": "LISTING_001",
  "user": "daniel.selman@uk.ibm.com"
}
```

Substitute the id of the participant submitting the transaction for `daniel.selman@uk.ibm.com` and set the bid price as high as you'd like to bid. Remember the vehicle will only be sold if the reserve price is met and it will go to the highest bidder!

The `Offer` transaction is processed by the `makeOffer` function described above.

## End the Auction

To end the auction someone has to submit a `CloseBidding` transaction for the listing.

Click on the Submit Transaction button to submit a new transaction for processing by the business network.

The JSON payload should be:

```
{
  "$class": "org.acme.vehicle.auction.CloseBidding",
  "listing": "LISTING_001"
}
```

This simply indicates that the auction for `LISTING_001` is now closed, triggering the `closeBidding` function that was described above.


## Check the Results of the Auction

To see if the Vehicle was sold you need to click on the `Vehicle` asset registry and then check the owner of CAR_001. If the reserve price was met you should see that the owner of the vehicle has been modified.

If you check the state of the VehicleListing is should either be `SOLD` or `RESERVE_NOT_MET`.

If you click on the 'User' asset registry you can check the balance of each User. You should see that the balance of the buyer has been debited by the amount they bid, whilst the balance of the seller has been credited.

## View the Blockchain

> Not yet supported in Playground

You can inspect the blocks and transaction created by Hyperledger during the course of the auction using the Hyperledger Explorer. Details TBD.

## Reset the Auction

To reset the auction you need to edit the VehicleListing to reset its state to `FOR_SALE`. Simply click on the `VehicleListing` registry and then click the pencil icon to update the VehicleListing back to its original state.

The JSON representation of the `VehicleListing` should be:

```
{
  "$class": "org.acme.vehicle.auction.VehicleListing",
  "listingId": "LISTING_001",
  "reservePrice": 4000,
  "description": "Ford Mustang",
  "state": "FOR_SALE",
  "vehicle": "CAR_001"
}
```

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.