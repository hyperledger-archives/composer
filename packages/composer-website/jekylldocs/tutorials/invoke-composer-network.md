---
layout: default
title: Invoking a Composer business network from another business network using Hyperledger Fabric
category: tutorials
section: tutorials
index-order: 306
sidebar: sidebars/accordion-toc0.md
---

# Invoking a {{site.data.conrefs.composer_full}} business network from another business network
{{site.data.conrefs.composer_full}} includes functionality that can be used by a business network to access an asset, participant, or transaction that is recorded in another business network. 

This tutorial will demonstrate the steps that a business network developer needs to take in order to invoke a {{site.data.conrefs.composer_full}} business network from a different business network. As part of the tutorial you will deploy the same business network twice. The business networks can be on the same channel or different channels. The business network used in this example will be the tutorial network that is outlined in the [developer tutorial](./developer-tutorial.html). This tutorial will refer to the business networks as "A" and "B"

## Prerequisites

1. Before you continue, ensure that you have followed the steps in [installing a development environment](../installing/development-tools.html).

## Step One: Starting a {{site.data.conrefs.hlf_full}} network

In order to follow this tutorial, you must start a {{site.data.conrefs.hlf_full}} network. You can use the simple {{site.data.conrefs.hlf_full}} network provided in the development environment, or you can use your own {{site.data.conrefs.hlf_full}} network that you have built by following the {{site.data.conrefs.hlf_full}} documentation.

The tutorial will assume that you use the simple {{site.data.conrefs.hlf_full}} network provided in the development environment. If you use your own {{site.data.conrefs.hlf_full}} network, then you must map between the configuration detailed below and your own configuration.

1. Start a clean {{site.data.conrefs.hlf_full}} by running the following commands:

        cd ~/fabric-tools
        ./stopFabric.sh
        ./teardownFabric.sh
        export FABRIC_VERSION=hlfv11
        ./downloadFabric.sh
        ./startFabric.sh

2. Delete any business network cards that may exist in your wallet. It is safe to ignore any errors that state that the business network cards cannot be found:

        composer card delete -n PeerAdmin@hlfv1

If these commands fail, then you have business network cards from a previous version and you will have to delete the file system card store.

        rm -fr ~/.composer

3. Create the Peer Admin Card by running the following command        
        
        ./createPeerAdminCard.sh

## Step Two: Create a second channel (Optional)

The simple network config used in the previous step only creates one channel by default. If business network B is to be deployed to a different channel, then the channel should be created now by using the Hyperledger Fabric operational tools.

After the channel has been created a business network card needs to be created to deploy to this channel.

1. Create a connection profile that specifies the second channel

2. To create the business network card run the following commands.

        export PRIVATE_KEY=~/fabric-tools/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/114aab0e76bf0c78308f89efc4b8c9423e31568da0c340ca187a9b17aa9a4457_sk
        export CERT=~/fabric-tools/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem
        composer card create -p <Path to profile> -u PeerAdmin -c ${CERT} -k ${PRIVATE_KEY} -r PeerAdmin -r ChannelAdmin --file otherPeerAdmin@hlfv1.card
        composer card import -f otherPeerAdmin@hlfv1.card -n otherPeerAdmin@hlfv1        

## Step Three: Define the business networks
1. Follow steps one and two in the [developer tutorial](./developer-tutorial.html). If business network A and business network B are being deployed to the same channel then a second business network will need to be created with a different name but with the same model, script and ACL files. This tutorial will assume this will be called `other-tutorial-network`.

2. The transaction logic needs to be updated to query an asset in business network B and then update the quantity property of an asset in business network A.
 
    Replace the contents of the `logic.js` script file to update the transaction processor function to be the following. Where \<CHANNEL\> needs to be replaced with either the name of the channel created in step two, or `composerchannel` if the business networks are on the same channel; and where \<BUSINESS NEWORK NAME\> is either `tutorial-network` if the networks are on different channels, or `other-tutorial-network` if the network are on the same channel.
                
                /**
                 * Track the trade of a commodity from one trader to another
                 * @param {org.acme.biznet.Trade} trade - the trade to be processed
                 * @transaction
                 */
                async function tradeCommodity(trade) {
                    trade.commodity.owner = trade.newOwner;
                    
                    const otherNetworkData = await getNativeAPI().invokeChaincode(<BUSINESS NETWORK NAME>, ['getResourceInRegistry', 'Asset', 'org.acme.biznet.Commodity', trade.commodity.tradingSymbol], <CHANNEL>);                    
                    const stringAsset = new Buffer(otherNetworkData.payload.toArrayBuffer()).toString('utf8');
                    const asset = getSerializer().fromJSON(JSON.parse(stringAsset));
                    
                    trade.commodity.quantity = asset.quantity;
                  
                    const assetRegistry = await getAssetRegistry('org.acme.biznet.Commodity');
                    await assetRegistry.update(trade.commodity);
                }    
                
3. Follow step three in the [developer tutorial](./developer-tutorial.html).

4. If business network B is going to be deployed on the same channel as business network A, then repeat steps 1-3 but create a network call `other-tutorial-network`.                        
              
## Step Four: Deploy the business networks
1. Install and start business network A using the following commands

        composer runtime install --card PeerAdmin@hlfv1 --businessNetworkName tutorial-network
        composer network start --card PeerAdmin@hlfv1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile tutorial-network@0.0.1.bna --file networkA.card
        composer card import --file networkA.card --name networkA
        
2. Install and start business network B using the following commands    
   
   If business network B will be on a different channel:
    
        composer runtime install --card otherPeerAdmin@hlfv1 --businessNetworkName tutorial-network
        composer network start --card otherPeerAdmin@hlfv1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile tutorial-network@0.0.1.bna --file networkB.card
        composer card import --file networkB.card --name networkB
        
   If business network B will be on the same channel:    
   
        composer runtime install --card PeerAdmin@hlfv1 --businessNetworkName other-tutorial-network
        composer network start --card PeerAdmin@hlfv1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile other-tutorial-network@0.0.1.bna --file networkB.card
        composer card import --file networkB.card --name networkB 
    
3. To check that the business networks have been deployed successfully run the following commands to ping the business networks
    
        composer network ping --card networkA
        composer network ping --card networkB
         
## Step Five: Create the assets

1. Create a participant in business network A. Run the following command.

        composer participant add --card networkA -d '{"$class": "org.acme.biznet.Trader", "tradeId": "bob@example.com", "firstName": "Bob", "lastName": "Jones"}'

2. Create an asset in business network  A

        composer transaction submit --card networkA -d '{"$class": "org.hyperledger.composer.system.AddAsset","registryType": "Asset","registryId": "org.acme.biznet.Commodity", "targetRegistry" : "resource:org.hyperledger.composer.system.AssetRegistry#org.acme.biznet.Commodity", "resources": [{"$class": "org.acme.biznet.Commodity","tradingSymbol": "Ag","owner": "resource:org.acme.biznet.Trader#bob@example.com","description": "a lot of gold", "mainExchange": "exchange", "quantity" : 250}]}'
                
3. Create a participant in business network B. Run the following command.

        composer participant add --card networkB -d '{"$class": "org.acme.biznet.Trader", "tradeId": "fred@example.com", "firstName": "Fred", "lastName": "Bloggs"}'

4. Create an asset in business network B. Run the following command. Note the different quantity property.

        composer transaction submit --card networkB -d '{"$class": "org.hyperledger.composer.system.AddAsset","registryType": "Asset","registryId": "org.acme.biznet.Commodity", "targetRegistry" : "resource:org.hyperledger.composer.system.AssetRegistry#org.acme.biznet.Commodity", "resources": [{"$class": "org.acme.biznet.Commodity","tradingSymbol": "Ag","owner": "resource:org.acme.biznet.Trader#fred@example.com","description": "a lot of gold", "mainExchange": "exchange", "quantity" : 500}]}'
     
## Step Six: Bind the identity on network A to the participant on network B  
1. Export the networkA card to get the credentials

        composer card export -n networkA

2. Unzip the card

3. Bind the identity to the participant. Run the following command.

        composer identity bind --card networkB --participantId resource:org.hyperledger.composer.system.NetworkAdmin#admin --certificateFile ./networkA/credentials/certificate           

4. Create a card with the bound identity. Where \<PATH TO CONNECTION PROFILE FOR NETWORK B\> should be the one to connect to networkB and \<NAME OF BUSINESS NETWORK B\> should be the name of business network B

        composer card create -p \<PATH TO CONNECTION PROFILE FOR NETWORK B\> --businessNetworkName <NAME OF BUSINESS NETWORK B> -u admin -c ./networkA/credentials/certificate  -k ./networkA/credentials/privateKey -f newNetworkB.card

5. Import the card

        composer card import --file newNetworkB.card --name newNetworkB

6. Ping the network to activate the identity

        composer network ping --card newNetworkB

## Step Seven: Submit a transaction

Submit a transaction to see the effect of querying an asset on a different business network

        composer transaction submit --card networkA -d '{"$class": "org.acme.biznet.Trade", "commodity": "resource:org.acme.biznet.Commodity#Ag", "newOwner": "resource:org.acme.biznet.Trader#bobId"}'
        
## Step Eight: Check the updated asset

View the updated asset to check that the quantity was correctly updated to 500.

        composer network list --card networkA -r org.acme.biznet.Commodity -a Ag

