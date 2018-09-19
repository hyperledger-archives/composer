---
layout: default
title: Interacting with other business networks
category: tutorials
section: tutorials
index-order: 306
sidebar: sidebars/accordion-toc0.md
---

# Interacting with other business networks
{{site.data.conrefs.composer_full}} includes functionality that can be used by a business network to access an asset, participant, or transaction that is recorded in another business network.

This tutorial will demonstrate the steps that a business network developer needs to take in order to invoke a {{site.data.conrefs.composer_full}} business network from a different business network. As part of the tutorial you will deploy the same business network twice. The business networks in this tutorial will be on the same channel, but they can be on different channels. The business network used in this example will be the tutorial network that is outlined in the [developer tutorial](./developer-tutorial.html). This tutorial will refer to the business networks as "A" and "B"

## Prerequisites

1. Before you continue, ensure that you have followed the steps in [installing a development environment](../installing/development-tools.html).

## Step One: Starting a {{site.data.conrefs.hlf_full}} network

In order to follow this tutorial, you must start a {{site.data.conrefs.hlf_full}} network. You can use the simple {{site.data.conrefs.hlf_full}} network provided in the development environment, or you can use your own {{site.data.conrefs.hlf_full}} network that you have built by following the {{site.data.conrefs.hlf_full}} documentation.

The tutorial will assume that you use the simple {{site.data.conrefs.hlf_full}} network provided in the development environment. If you use your own {{site.data.conrefs.hlf_full}} network, then you must map between the configuration detailed below and your own configuration.

1. Start a clean {{site.data.conrefs.hlf_full}} by running the following commands:

        cd ~/fabric-dev-servers
        {{site.data.conrefs.export_fabric_version_command}}
        ./stopFabric.sh
        ./teardownFabric.sh
        ./downloadFabric.sh
        ./startFabric.sh

2. Delete any business network cards that may exist in your wallet. It is safe to ignore any errors that state that the business network cards cannot be found:

        composer card delete -c PeerAdmin@hlfv1

If these commands fail, then you have business network cards from a previous version and you will have to delete the file system card store.

        rm -fr ~/.composer

3. Create the Peer Admin Card by running the following command        

        ./createPeerAdminCard.sh

## Step Two: Define the business networks
1. Follow steps one and two in the [developer tutorial](./developer-tutorial.html). This will be network A.

2. Follow steps one and two again but create a business network called `other-tutorial-network`. This will be network B.

3. The transaction logic needs to be updated in network A and to query an asset in business network B and then update the quantity property of an asset in business network A.

    Replace the contents of the `logic.js` script file to update the transaction processor function to be the following.

                /**
                 * Track the trade of a commodity from one trader to another
                 * @param {org.example.mynetwork.Trade} trade - the trade to be processed
                 * @transaction
                 */
                async function tradeCommodity(trade) {
                    trade.commodity.owner = trade.newOwner;

                    const otherNetworkData = await getNativeAPI().invokeChaincode('other-tutorial-network', ['getResourceInRegistry', 'Asset', 'org.example.mynetwork.Commodity', trade.commodity.tradingSymbol], 'composerchannel');                    
                    const stringAsset = new Buffer(otherNetworkData.payload.toArrayBuffer()).toString('utf8');
                    const asset = getSerializer().fromJSON(JSON.parse(stringAsset));

                    trade.commodity.quantity = asset.quantity;

                    const assetRegistry = await getAssetRegistry('org.example.mynetwork.Commodity');
                    await assetRegistry.update(trade.commodity);
                }

4. Follow step three in the [developer tutorial](./developer-tutorial.html).

## Step Three: Deploy the business networks
1. Install and start business network A using the following commands

        composer network install --card PeerAdmin@hlfv1 --archiveFile tutorial-network@0.0.1.bna
        composer network start --networkName tutorial-network --networkVersion 0.0.1 --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkA.card
        composer card import --file networkA.card --card networkA

2. Install and start business network B using the following commands

        composer network install --card PeerAdmin@hlfv1 --archiveFile other-tutorial-network@0.0.1.bna
        composer network start --networkName other-tutorial-network --networkVersion 0.0.1 --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkB.card
        composer card import --file networkB.card --card networkB

3. To check that the business networks have been deployed successfully run the following commands to ping the business networks

        composer network ping --card networkA
        composer network ping --card networkB

## Step Four: Create the assets

1. Create a participant in business network A. Run the following command.

        composer participant add --card networkA -d '{"$class": "org.example.mynetwork.Trader", "tradeId": "bob@example.com", "firstName": "Bob", "lastName": "Jones"}'

2. Create an asset in business network  A

        composer transaction submit --card networkA -d '{"$class": "org.hyperledger.composer.system.AddAsset", "targetRegistry" : "resource:org.hyperledger.composer.system.AssetRegistry#org.example.mynetwork.Commodity", "resources": [{"$class": "org.example.mynetwork.Commodity","tradingSymbol": "Ag","owner": "resource:org.example.mynetwork.Trader#bob@example.com","description": "a lot of gold", "mainExchange": "exchange", "quantity" : 250}]}'

3. Create a participant in business network B. Run the following command.

        composer participant add --card networkB -d '{"$class": "org.example.mynetwork.Trader", "tradeId": "fred@example.com", "firstName": "Fred", "lastName": "Bloggs"}'

4. Create an asset in business network B. Run the following command. Note the different quantity property.

        composer transaction submit --card networkB -d '{"$class": "org.hyperledger.composer.system.AddAsset", "targetRegistry" : "resource:org.hyperledger.composer.system.AssetRegistry#org.example.mynetwork.Commodity", "resources": [{"$class": "org.example.mynetwork.Commodity","tradingSymbol": "Ag","owner": "resource:org.example.mynetwork.Trader#fred@example.com","description": "a lot of gold", "mainExchange": "exchange", "quantity" : 500}]}'

## Step Five: Bind the identity on network A to the participant on network B  
1. Export the networkA card to get the credentials

        composer card export -c networkA

2. Unzip the card, you may need to rename networkA.card to networkA.zip.

3. Bind the identity to the participant. Run the following command.

        composer identity bind --card networkB --participantId resource:org.hyperledger.composer.system.NetworkAdmin#admin --certificateFile ./networkA/credentials/certificate           

4. Create a card with the bound identity.

        composer card create -p ~/.composer/cards/networkB/connection.json --businessNetworkName other-tutorial-network -u admin -c ./networkA/credentials/certificate  -k ./networkA/credentials/privateKey -f newNetworkB.card

5. Import the card

        composer card import --file newNetworkB.card --card newNetworkB

6. Ping the network to activate the identity

        composer network ping --card newNetworkB

## Step Six: Review the asset data

View the asset to see that the quantity is 250.

        composer network list --card networkA -r org.example.mynetwork.Commodity -a Ag        

## Step Seven: Submit a transaction

Submit a transaction to see the effect of querying an asset on a different business network. Note that NetworkB is only queried and the quantity is not changed.  

        composer transaction submit --card networkA -d '{"$class": "org.example.mynetwork.Trade", "commodity": "resource:org.example.mynetwork.Commodity#Ag", "newOwner": "resource:org.example.mynetwork.Trader#bobId"}'

## Step Eight: Check the updated asset

View the updated asset to check that the quantity was correctly updated to 500.

        composer network list --card networkA -r org.example.mynetwork.Commodity -a Ag

