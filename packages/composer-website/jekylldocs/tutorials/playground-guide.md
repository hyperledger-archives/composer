---
layout: default
title: Playground Tutorial
category: playground
section: playground
index-order: 301
sidebar: sidebars/accordion-toc0.md
excerpt: The Playground guide runs through creating your first business network. In this guide, you'll create participants, assets, and transactions; and verify that the transactions worked correctly. If you want to run the playground guide locally [**install the Playground locally**](../installing/using-playground-locally.html) first, then use the playground guide.
---

# Playground Tutorial

In this step by step tutorial we'll walk through setting up a business network, defining our assets, participants and transactions, and testing our network by creating some participants and an asset, and submitting transactions to change the ownership of the asset from one to another.

## Step One: Open the {{site.data.conrefs.composer_full}} Playground

Open <a href="http://composer-playground.mybluemix.net" target="blank">{{site.data.conrefs.composer_short}} Playground</a>. You should see the **My Wallet** screen. The **My Wallet** page shows you a summary of the business networks you can connect to, and the identities you can use to connect to them. Don't worry about this too much for the time being, as we're going to create our own network.

## Step Two: Creating a new business network

Next, we want to create a new business network from scratch. A business network has a couple of defining properties; a name, and an optional description. You can also choose to base a new business network on an existing template, or import your own template.

1. Click **Deploy a new business network** under the Web Browser heading to get started.

2. The new business network needs a name, let's call it `tutorial-network`.

3. Optionally, you can enter a description for your business network.

4. Next we must select a business network to base ours on, because we want to build the network from scratch, click **empty-business-network**.

5. Now that our network is defined, click **Deploy**.

<video autoplay "autoplay=autoplay" style="display:block; width:100%; height:auto;" loop="loop">
<source src="{{ site.baseurl }}/assets/img/tutorials/playground/vs_code_1.mp4" type="video/mp4" />
</video>


## Step Three: Connecting to the business network

Now that we've created and deployed the business network, you should see a new business network card called _admin_ for our business network _tutorial-network_ in your wallet. The wallet can contain business network cards to connect to multiple deployed business networks.

When connecting to an external blockchain, business network cards represent everything necessary to connect to a business network. They include connection details, authentication material, and metadata.

To connect to our business network click **Connect now** under our business network card.

<video autoplay "autoplay=autoplay" style="display:block; width:100%; height:auto;" loop="loop">
<source src="{{ site.baseurl }}/assets/img/tutorials/playground/vs_code_2.mp4" type="video/mp4" />
</video>

## Step Four: Adding a model file

As you can see, we're in the **Define** tab right now, this tab is where you create and edit the files that make up a business network definition, before deploying them and testing them using the **Test** tab.

As we selected an empty business network template, we need to define our business network files. The first step is to add a model file. Model files define the assets, participants, transactions, and events in our business network.

For more information on our modeling language, check our [documentation](../reference/cto_language.html).

1. Click the **Add a file** button.

2. Click the **Model file** and click **Add**.

3. Delete the lines of code in the model file and replace it with this:


        /**
         * My commodity trading network
         */
        namespace org.acme.mynetwork
        asset Commodity identified by tradingSymbol {
            o String tradingSymbol
            o String description
            o String mainExchange
            o Double quantity
            --> Trader owner
        }
        participant Trader identified by tradeId {
            o String tradeId
            o String firstName
            o String lastName
        }
        transaction Trade {
            --> Commodity commodity
            --> Trader newOwner
        }

      This domain model defines a single asset type `Commodity` and single participant type `Trader` and a single transaction type `Trade` that is used to modify the owner of a commodity.

## Step Five: Adding a transaction processor script file

Now that the domain model has been defined, we can define the transaction logic for the business network. Composer expresses the logic for a business network using JavaScript functions. These functions are automatically executed when a transaction is submitted for processing.

For more information on writing transaction processor functions, check our [documentation](../reference/js_scripts.html).

1. Click the **Add a file** button.

2. Click the **Script file** and click **Add**.

3. Delete the lines of code in the script file and replace it with the following code:

        /**
         * Track the trade of a commodity from one trader to another
         * @param {org.acme.mynetwork.Trade} trade - the trade to be processed
         * @transaction
         */
        function tradeCommodity(trade) {
            trade.commodity.owner = trade.newOwner;
            return getAssetRegistry('org.acme.mynetwork.Commodity')
                .then(function (assetRegistry) {
                    return assetRegistry.update(trade.commodity);
                });
        }


      This function simply changes the `owner` property on a commodity based on the `newOwner` property on an incoming `Trade` transaction. It then persists the modified `Commodity` back into the asset registry, used to store `Commodity` instances.


## Step Six: Access control

Access control files define the access control rules for business networks. Our network is simple, so the default access control file doesn't need editing. The basic file gives the current participant `networkAdmin` full access to business network and system-level operations.

While you can have multiple model or script files, you can only have one access control file in any business network.

For more information on access control files, check our [documentation](../reference/acl_language.html).

## Step Seven: Deploying the updated business network

Now that we have model, script, and access control files, we need to deploy and test our business network.

Click **Update** to deploy the changes to our business network.

<video autoplay "autoplay=autoplay" style="display:block; width:100%; height:auto;" loop="loop">
<source src="{{ site.baseurl }}/assets/img/tutorials/playground/deploy_updates_render.mp4" type="video/mp4" />
</video>

## Step Eight: Testing the business network definition

Next, we need to test our business network by creating some participants (in this case _Traders_), creating an asset (a _Commodity_), and then using our _Trade_ transaction to change the ownership of the _Commodity_.

Click the **Test** tab to get started.

<video autoplay "autoplay=autoplay" style="display:block; width:100%; height:auto;" loop="loop">
<source src="{{ site.baseurl }}/assets/img/tutorials/playground/test_tab_render.mp4" type="video/mp4" />
</video>

## Step Nine: Creating participants

The first thing we should add to our business network is two participants.


1. Ensure that you have the **Trader** tab selected on the left, and click **Create New Participant** in the upper right.

2. What you can see is the data structure of a _Trader_ participant. We want some easily recognizable data, so delete the code that's there and paste the following:

        {
          "$class": "org.acme.mynetwork.Trader",
          "tradeId": "TRADER1",
          "firstName": "Jenny",
          "lastName": "Jones"
        }

3. Click **Create New** to create the participant.

4. You should be able to see the new _Trader_ participant you've created. We need another _Trader_ to test our _Trade_ transaction though, so create another _Trader_, but this time, use the following data:

        {
          "$class": "org.acme.mynetwork.Trader",
          "tradeId": "TRADER2",
          "firstName": "Amy",
          "lastName": "Williams"
        }

Make sure that both participants exist in the _Trader_ view before moving on!

<video autoplay "autoplay=autoplay" style="display:block; width:100%; height:auto;" loop="loop">
<source src="{{ site.baseurl }}/assets/img/tutorials/playground/create_new_participant_render.mp4" type="video/mp4" />
</video>



## Step Ten: Creating an asset

Now that we have two _Trader_ participants, we need something for them to trade. Creating an asset is very similar to creating a participant. The _Commodity_ we're creating will have an _owner_ property indicating that it belongs to the _Trader_ with the _tradeId_ of `TRADER1`.

1. Click the **Commodity** tab under **Assets** and click **Create New Asset**.

2. Delete the asset data and replace it with the following:


        {
          "$class": "org.acme.mynetwork.Commodity",
          "tradingSymbol": "ABC",
          "description": "Test commodity",
          "mainExchange": "Euronext",
          "quantity": 72.297,
          "owner": "resource:org.acme.mynetwork.Trader#TRADER1"
        }


3. After creating this asset, you should be able to see it in the **Commodity** tab.

<video autoplay "autoplay=autoplay" style="display:block; width:100%; height:auto;" loop="loop">
<source src="{{ site.baseurl }}/assets/img/tutorials/playground/create_new_asset_render.mp4" type="video/mp4" />
</video>


## Step Eleven: Transferring the commodity between the participants

Now that we have two _Traders_ and a _Commodity_ to trade between them, we can test our _Trade_ transaction.

Transactions are the basis of all change in a {{site.data.conrefs.composer_full}} business network, if you want to experiment with your own after this tutorial, try creating another business network from the **My Wallet** screen and using a more advanced business network template.

To test the _Trade_ transaction:

1. Click the **Submit Transaction** button on the left.

2. Ensure that the transaction type is _Trade_.

3. Replace the transaction data with the following, or just change the details:

        {
          "$class": "org.acme.mynetwork.Trade",
          "commodity": "resource:org.acme.mynetwork.Commodity#ABC",
          "newOwner": "resource:org.acme.mynetwork.Trader#TRADER2"
        }


4. Click **Submit**.

5. Check that our asset has changed ownership from `TRADER1` to `TRADER2`, by expanding the data section for the asset. You should see that the owner is listed as `resource:org.acme.mynetwork.Trader#TRADER2`.

6. To view the full transaction history of our business network, click **All Transactions** on the left. Here is a list of each transaction as they were submitted. You can see that certain actions we performed using the UI, like creating the _Trader_ participants and the _Commodity_ asset, are recorded as transactions, even though they're not defined as transactions in our business network model. These transactions are known as 'System Transactions' and are common to all business networks, and defined in the {{site.data.conrefs.composer_full}} Runtime.

<video autoplay "autoplay=autoplay" style="display:block; width:100%; height:auto;" loop="loop">
<source src="{{ site.baseurl }}/assets/img/tutorials/playground/submit_transaction_render.mp4" type="video/mp4" />
</video>

## Logging out of the business network

Now that transactions have successfully run, we should log out of the business network, ending up at the **My Wallet** screen where we started.

1. In the upper-right of the screen is a button labelled **admin**. This lists your current identity, to log out, click **admin** to open the dropdown menu, and click **Log Out**.

## What next?

You've completed the initial {{site.data.conrefs.composer_full}} Playground tutorial, you might want to either begin building your own business network using our other samples or templates.

You might want to try the [**Developer Tutorial**](../tutorials/developer-guide.html), to get your local development environment setup, generate a REST API and a skeleton web application.

Or you can [run {{site.data.conrefs.composer_full}} Playground locally](../installing/using-playground-locally.html) connected to a real instance of {{site.data.conrefs.hlf_full}}.
