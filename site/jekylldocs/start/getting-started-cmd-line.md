---
layout: default
title: Getting Started with Fabric Composer
category: start
sidebar: sidebars/start.md
excerpt: Getting Started with Fabric Composer
---

# Running a sample with the CLI

---

Before you follow these instructions, make sure you've completed the
[Quickstart](./quickstart.md)!

To help get started with application development using the Fabric Composer Framework, this guide will talk you through downloading Fabric Composer, starting a Fabric, deploying a simple business network and submitting transactions.

This is all done using a simple business network  **Digital Property Network**

## What is the Digital Property Network?

This network will be expanded for other tutorials, but for this getting started we'll keep it simple.

We going to model *Land Titles*, each of which has an owner, description, and a boolean saying if this property/land is up for sale.

```javascript
asset LandTitle identified by titleId {
  o String   titleId
  --> Person   owner
  o String   information
  o Boolean  forSale   optional
}
```

We'll also model the *Owner* as a Person (First,Last name).

```
participant Person identified by personId {
  o String personId
  o String firstName
  o String lastName
}
```

We want to be able to mark one of the titles for sale so we'll create a *RegisterPropertyForSale* transaction that will update the for sale flag.

```
transaction RegisterPropertyForSale identified by transactionId{
  o String transactionId
  --> Person seller
  --> LandTitle title
}
```

The applications we're going to look at are going to store a number of (pretend) land titles, and mark them for sale. All this will be using the Fabric Composer backed by a real blockchain in the shape of a locally executing Hyperledger Fabric.

## But what is an asset?
An asset is a term used to describe things of value both in the physical world and the equally real intangible world. These are stored in Asset Registries. Participants can act on these assets by submitting transactions. With the features of a blockchain provided by the Hyperledger Fabric, an application using Fabric Composer has a single source of truth for the state of these assets and their history.

It's worth reading the [Overview](../overview/overview.md) page to get an idea of how everything fits together. The [Glossary](../reference/glossary.md) provides a detailed description of each term.

## What are we going to do?
All the resources and scripts you'll need are in a git repository that we'll clone, this will have the code for the applications along with the scripts to get the Hyperledger setup and ready to go.

The first thing to do is to ensure that you have a suitable system ready for development.

**Ensure that you have followed the steps in our Quickstart before continuing!**  (Quickstart available [here](./quickstart.md))

Let's go ahead and make a change to start to show how easy it is to develop with Fabric Composer.

## Updating the Business Network

We are going to make a simple change to the business logic for the business network definition.

### Clone the Repository and Install Dependencies
First clone the repository:

```bash
git clone https://github.com/fabric-composer/sample-networks.git
```

```bash
cd sample-networks/packages/DigitalProperty-Network
```

```bash
npm install
```

### Update the Transaction Processor Function

Open the file `lib/DigitalLandTitle.js` in a text editor and replace the contents with:

```javascript

'use strict';

/** Process a property that is held for sale
 * @param {net.biz.digitalPropertyNetwork.RegisterPropertyForSale} propertyForSale the property to be sold
 * @transaction
 */
function onRegisterPropertyForSale(propertyForSale) {
    console.log('### onRegisterPropertyForSale ' + propertyForSale.toString());
    propertyForSale.title.forSale = true;

    /* new line is here to update the information */
    propertyForSale.title.information = propertyForSale.title.information + ' Updated at: ' + new Date().toDateString();

    return getAssetRegistry('net.biz.digitalPropertyNetwork.LandTitle').then(function(result) {
            return result.update(propertyForSale.title);
        }
    );
}
```

### Update the Business Network Definition
In a real-life scenario at this point you would edit `package.json` to increment the version number in the `DigitalProperty-Network` directory and publish this to npm. But please don't publish to the DigitalProperty-Network in npm - otherwise we'll have version numbers in the 1000s :-)

What we'll do therefore is adopt a different approach to create the Business Network Archive that is deployed to the Hyperledger.
From within the DigitalProperty-Network directory..

```bash
$ composer archive create --inputDir .
Creating Business Network Archive
Looking for package.json of Business Network Definition in /home/matthew/git17/DigitalProperty-Network

Description:Digital Property Network
Name:digitalproperty-network
Identifier:digitalproperty-network-0.0.1

Written Business Network Definition Archive file to digitalproperty-network-0.0.1.bna
Command completed successfully.
```

We now have a new file that is the digital business network archive.

### Update the deployed business network

```bash
$ composer network update --archiveFile digitalproperty-network@0.0.1.bna  --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d
Deploying business network from archive digitalproperty-network-0.0.1.bna
Business network definition:
	Identifier: digitalproperty-network-0.0.1
	Description: Digital Property Network
Updating business network definition. This may take a few seconds...
Command completed successfully.
```

### Rerun the Test
If you go back to the getting started directory now - and list all the commands that available, you'll see one called `submitTransaction`

```bash
$ npm run
Lifecycle scripts included in composer-gettingstarted:
  test
    mocha --recursive && npm run bootstrapAssets && npm run listAssets && npm run submitTransaction
  install
    scripts/download-hyperledger.sh && scripts/start-hyperledger.sh && npm run deployNetwork

available via `npm run-script`:
  submitTransaction
    node cli.js landregistry submit && node cli.js landregistry list
  listAssets
    node cli.js landregistry list
  bootstrapAssets
    node cli.js landregistry bootstrap
  startHLF
    scripts/start-hyperledger.sh
  stopHLF
    scripts/stop-hyperledger.sh
  teardownHLF
    scripts/teardown.sh
  deployNetwork
    composer archive create -m digitalproperty-network --archiveFile digitalPropertyNetwork.bna && composer network deploy --archiveFile digitalPropertyNetwork.bna  --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d && composer network list -n digitalproperty-network --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d

```

If you issue this command, that will submit a transaction as before - but importantly this is the updated transaction function. You should now see:

```
$ npm run submitTransaction

> composer-gettingstarted@1.0.0 submitTransaction
> node cli.js landregistry submit && node cli.js landregistry list

info: [Composer-GettingStarted] Fabric Composer: Getting Started application
info: [Composer-GettingStarted] LandRegistry:<init> businessNetworkDefinition obtained digitalproperty-network-0.0.11
info: [Composer-GettingStarted] updateForSale Getting assest from the registry.
info: [Composer-GettingStarted] updateForSale Submitting transaction
info: [Composer-GettingStarted] Transaction Submitted
info: [Composer-GettingStarted] Command completed successfully.
info: [Composer-GettingStarted] Fabric Composer: Getting Started application
info: [Composer-GettingStarted] LandRegistry:<init> businessNetworkDefinition obtained digitalproperty-network-0.0.11
=======
```

## Digging Deeper

* `scripts/download-hyperledger.sh` This is a shell script that will download and tag the docker images for Hyperledger v0.6. It is important to note that this script will also delete the Fabric Composer Connection Profiles. This is important if you have connected to other Hyperledger Fabrics, or have changed the default ports that Hyperledger uses.

`npm install` uses this script.

* `scripts/start-hyperledger.sh` This is a shell script that starts the Hyperledger Fabric, this will also wait to make sure the Hyperledger fabric has started.
`npm run startHLF` can also be used to call this script.
* `scripts/stop-hyperledger.sh` This is the opposite of the start script, and will stop the Hyperledger Fabric - but it critically does not delete or remove any state. Therefore it canbe restarted with the start script.  `npm run stopHLF` can also be used to call this script.
* `scripts/teardown.sh` This will stop and remove all the docker images related to Hyperledger fabric. This can be used to do an effective clean-up of the Hyperledger Fabric and the Fabric Composer Connection Profiles.

**Composer CLI**

* `composer archive create -m digitalproperty-network --archiveFile digitalPropertyNetwork.bna`
This command is used to create a Business Network Archive. `--archiveFile` is the name of the file. The `-m` is the npm module name of the business network to use. There is also a -d option to specify the directory the business network is in. Useful whilst developing the business network transactions functions.

* `composer network deploy --archiveFile digitalPropertyNetwork.bna  --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d`
This deploys the business network to the HyperLedger runtime; the archive is specified but also the Hyperledger Entrollment Id and Secret (the secret if not included in the command line will be prompted for)
* `composer network list -n digitalproperty-network --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d`
This lists the deployed business network details. `-n` is the name of the business network. With the same options for the Hyperledger Entrollment Id and Secret (the secret if not included in the command line will be prompted for)

**Sample Applications**

There are 3 sample Javascript applications that use the Fabric Composer Client API to perform operations on the business network. These are applications that specific to the business network that has been defined in this Digital Property Network.

* `node cli.js landregistry submit`  This applications connects, and submits a transaction.
* `node cli.js landregistry list`   This lists the contents of the asset registries that have been defined in the business network.
* `node cli.js landregistry bootstrap` This applications puts some pretend assets into the registries to work with.

### Nice one!
We have downloaded the Hyperledger docker containers and stated a fabric. We have used the Fabric Composer Command line to deploy and update the DigitalProperty Network. We have used some Javascript applications in node.js to list assets and submit transactions to work on those assets.  A simple change and update has been made to one of the transaction functions.

If you want to continue exploring, check out our other Getting Started guides:

[Coding a Business Network Definition](./getting-started-coding-bnd.md)

[Generating a REST API](./getting-started-rest-api.md)

[Writing a Node.js App](./getting-started-nodejs-app.md)
