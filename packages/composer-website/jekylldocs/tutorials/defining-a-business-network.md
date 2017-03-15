---
layout: default
title: Tutorial 1: Building your first business network
category: tasks
sidebar: sidebars/tutorials.md
excerpt: This tutorial walks you through the basics of defining a business network of your own, the contents of a business network, and how they come together to form a business network archive.
---

# Building your first business network

---

Defining a business network is the entry point to any {{site.data.conrefs.fabric_composer_full}} project. The business network contains participants, assets, and transactions. This tutorial walks you through the basics of defining a business network of your own, the contents of a business network, and how they come together to form a business network archive.

---

## Before you begin

Before beginning this tutorial you will need:

* A GitHub account

---

## Let's get started

1. Open the [{{site.data.conrefs.composer_short}} Playground](http://fabric-composer-next.mybluemix.net/editor). On the left are three files, a script file, `lib/logic.js` which represents transaction logic, a model file, `lib/org.acme.biznet.cto` which defines the participants assets and transactions of the business network, and an access control file, `permissions.acl` which defines the access different participants have.

2. To get set up with a sample business network click **Import/Replace**. This dialog allows you to import your own business network archive `.bna` files, or to import our premade business network samples. For now we'll use a pre-built sample from the {{site.data.conrefs.composer_short}} GitHub repository. Click **Authenticate with GitHub** then log into your GitHub account and click **Authorize application**.

3. From the menu, select **carauction-network** and click **Deploy**. This imports the car auction sample business network into your playground instance. In the model file `lib/org.acme.vehicle.auction.cto` there are the definitions of asset types, participant types, and transactions. The entries in the `.cto` file define the expected format of each asset, participant, and transaction. The script file `lib/logic.js` contains JavaScript
which controls the transactions, in this script file, there is JavaScript logic controlling the `Close Bidding` and `Make Offer` transactions.

4. To get a better understanding of how business network definitions work in practise, click the **Test** tab at the top. From this screen, we can create assets and participants, and submit transactions.

5. To start with, add a *Member* participant by clicking **Member** then clicking **Create New Participant**. Enter the balance, email, and name credentials for the new participant in the following format, then click **Create New**. The credentials which are required for each participant are defined in the `.cto` file viewable in the **Define** tab.
```
{
  "$class": "org.acme.vehicle.auction.Member",
  "balance": "100",
  "email": "alice@biznet.org",
  "firstName": "Alice",
  "lastName": "Smith"
}
```

6. Create two more *Members* in the same way as step 5, with different balance, email, and name credentials. Then, click the **Auctioneer** participant type on the left, and then create an Auctioneer participant by click **Create New Participant**.

7. Now that there are three *Members*; two to bid against each other and another to be the initial owner of the *Vehicle* asset. We also have an *Auctioneer* to close the bidding. Next we need an assets, in this case a *Vehicle* asset, for them to bid over, and a *Vehicle Listing* asset to control the reserve price and record the current highest offer.

8. To create a *Vehicle* asset, click **Vehicle**, then **Create New Asset**. Enter the VIN (Vehicle Identification Number) and the email address of the owner. In this case, enter the email address of one of the *Members* created in step 5 or 6, then click **Create New** to finish creating the asset. Now, the asset exists and has a set owner. The *Vehicle* asset credentials must be in the following format, as defined in the `.cto` file.
```
{
  "$class": "org.acme.vehicle.auction.Vehicle",
  "vin": "1234",
  "owner": "dave@biznet.org"
}
```

9. Next, to sell the car at auction, an auction listing asset must be created. Assets can be any tangible or intangible goods or services, in this case, the auction listing itself. To create the auction listing, click **VehicleListing** then click **Create New Asset**. The *VehicleListing* requires several properties:
  * `listingId` is the unique identifier of this car listing. For the purposes of this tutorial, you can enter anything here.
  * `reservePrice` is the minimum price which the allow ownership of the car to be transferred once the auction is closed, this function is defined in the script file which makes up part of this business network.
  * `description` is the description of the auction, for this tutorial you can enter anything here.
  * `state` is the property which defines whether the listing is open, closed, or closed with the reserve price not met.
  * `offers` should be left blank, and will be populated automatically as participants make offers.
  * `vehicle` defines the vehicle which is for sale, this should be the same as the `vin` field on the *Vehicle* asset created in step 8.

  A complete *VehicleListing* asset should appear in the following format:
```
{
  "$class": "org.acme.vehicle.auction.VehicleListing",
  "listingId": "listing_1",
  "reservePrice": 2000,
  "description": "dave's car",
  "state": "FOR_SALE",
  "offers": [],
  "vehicle": "1234"
}
```
  Once the *VehicleListing* is complete, click **Create new** to add it as an asset.

10. Now that you have *Members* to own and bid on an asset, an *Auctioneer*, a *Vehicle* asset with registered ownership, and a *VehicleListing* asset to track the bids, reserve price, and state of the auction. The next step is to begin using transactions to interact with assets. This sample includes the *Offer* and *CloseBidding* transactions. Transactions, combined with assets and participants, make up the economic model of a business network. Transactions can modify, transfer, or otherwise alter assets, as in this sample, where transactions allow participants to place bids or allow the auctioneer to close the auction.

  Placing a bid uses the *Offer* transaction. To submit a transaction, click the **Submit Transaction** button. In the dialog box, use the dropdown to select the *Offer* transaction type. The *Offer* transaction requires a number of properties:

  * `bidPrice` is the amount that the member submitting the transaction is bidding.
  * `listing` is the `listingId` of the auction the bid should be associated with.
  * `member` is the email address of the member making the offer.

  When you've entered the required information, the *Offer* transaction should follow this format, click **Submit** to submit the transaction.
```
{
  "$class": "org.acme.vehicle.auction.Offer",
  "bidPrice": "1000",
  "listing": "listing_1",
  "member": "alice@biznet.org",
}
```

11. Now that you've submitted an *Offer* transaction, we can check that it has been successfully applied to the *VehicleListing* asset. Click **VehicleListing** and then click **Show All** in your listing entry. You should see that there is now an entry for the *Offer* transaction in the `offers` property of the listing asset. Congratulations, you've just made your first bid!

12. To represent a counter-offer or raise from another member, repeat step 10, increasing the `bidPrice` property and changing the `member` who is placing the bid. After you have submitted a second *Offer* transaction, the *VehicleListing* asset should update to show that both bids have been placed.

13. When you've placed as many bids as you like, the next step is to submit the *CloseBidding* transaction to close the auction. The *CloseBidding* transaction pays the previous owner of the *Vehicle* asset listed in the *VehicleListing* the current highest offer and transfers ownership of the *Vehicle* asset, as listed in the `owner` property, to the highest bidder. To submit the *CloseBidding* 

## What to do next

learn more about business networks: docs.
Read docs: applications.

---
