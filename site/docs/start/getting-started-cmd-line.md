---
layout: default
title: Getting Started with the IBM Blockchain Framework
category: start
sidebar: sidebars/start.md
excerpt: Getting Started with the IBM Blockchain Framework
---
# Getting started with Concerto Application Development

To help get started with application development using the Concerto Framework, this guide will talk you through downloading Concerto, starting a Fabric, deploying a simple business network and submitting transactions.

This is all done using a simple business network  **Digital Property Network**

# What is the Digital Property Network?

This network will be expanded for other tutorials, but for this getting started we'll keep it simple. We going to model *Land Titles*, each of which has an owner, description, and a boolean saying if this property/land is up for sale.

```
asset LandTitle identified by titleId {
  o String   titleId
  o Person   owner
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

The applications we're going to look at are going to store a number of (pretend) land titles, and mark them for sale. All this will be using the Concerto Framework backed by a real blockchain in the shape of a locally executing Hyperledger Fabric.

# But what is an asset?
An is a term used to describe things of value both in the physical world and the equally real intangible world. These are stored in Asset Registries. Participants can act on these assets bys submitting transactions. With the features of a blockchain provided by the Hyperledger Fabric, an application using the Concerto Frameowk has a single source of truth for the state of these assets and their history.

It's worth reading the [Overview](../overview/overview.md) page to get an idea of how everything fits together. The [Glossary](../reference/glossary.md) provides a detailed description of each term.

# What are we going to do?
All the resources and scripts you'll need are in a git repository that we'll clone, this will have the code for the applications along with the scripts to get the Hyperledger setup and ready to go.

The first thing to do is to ensure that you have a suitable system ready for development.

### Development Prerequisites
First check that you are running on a [supported system](../reference/platforms.md) and install the required development [prerequisites](../tasks/prerequisites.md).  Essentially this means Linux/MacOS & node.js & docker & docker-compose & git

### Install the Concerto CLI
Installing the Concerto CLI tools module is the first step. This gives you commands to deploy, update and list business networks.

```bash
npm install -g composer-cli
```

### Clone the Getting Started Repository
Next you need to pull down the code for the Getting Started sample.

```bash
git clone git@github.ibm.com:Blockchain-WW-Labs/Concerto-GettingStarted.git
```

### Install the Dependencies, Start Fabric and Deploy the Business Network
Next you can run the following commands to install all the dependent Node modules for the sample, pull down the Docker images for Hyperledger Fabric, start the Fabric and then deploy a Business Network Definition.

```bash
cd Concerto-GettingStarted
npm install
```

This is doing quite a bit of work but at the end of it you will have all the dependent modules, together with a running local Hyperledger instance, and the DigitalProperty Network will have been deployed to that Hyperledger. At this point it doesn't contain any assets at all.

### Create Assets and Submit a Transaction
There are some simple applications included that will create some assets, list the current assets and submit a transaction.
First, the assets are created and the newly created assets are listed. Then a transaction is submitted to update one of the assets 'for sale'. A final asset listed is then queried to show the update has taken place. To run this end-end sequence issue...

```bash
npm test
```

### That's it
So to recap

* You installed Concerto command line tools
* The 'Getting Started' repository was cloned
* All the code dependencies where pulled down, and a docker-hosted Hyperledger instance was Started
  * and the Digital Property Business Network was deployed to it
* A sample set of assets were added
* A simple transaction was invoked to update the assets

**All done!** But let's go ahead and make a change to start to show how easy it is to develop with Concerto.

# Updating the Business Network

We are going to make a simple change to the business logic for the business network definition.

### Clone the Repository and Install Dependencies
First clone the repository:

```bash
git clone git@github.ibm.com:Blockchain-WW-Labs/DigitalProperty-Network.git
cd DigitalProperty-Network
npm install
```

### Update the Transaction Processor Function

Open the file `lib/DigitalLandTitle.js` in a text editor and replace the contents with:
{% highlightc javascript %}

{

}

{% endhighlightc %}


{% highlightc javascript %}
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
{% endhighlightc %}

### Update the Business Network Definition
In a real-life scenario at this point you would edit `package.json` to increment the version number in the `DigitalProperty-Network` directory and publish this to npm. But please don't publish to the DigitalProperty-Network in npm - otherwise we'll have version numbers in the 1000s :-)

What we'll do therefore is adopt a different approach to create the Business Network Archive that is deployed to the Hyperledger.
From within the DigitalProperty-Network directory..

```bash
$ concerto archive create --inputDir .
Creating Business Network Archive
Looking for package.json of Business Network Definition in /home/matthew/git17/DigitalProperty-Network

Description:Digital Property Network
Name:digitalproperty-network
Identifier:digitalproperty-network-0.0.22

Written Business Network Definition Archive file to digitalproperty-network-0.0.22.bna
Command completed successfully.
```

We now have a new file that is the digital business network archive.

### Update the deployed business network

```bash
$ concerto network update --archiveFile digitalproperty-network@0.0.22.bna  --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d
Deploying business network from archive digitalproperty-network-0.0.22.bna
Business network definition:
	Identifier: digitalproperty-network-0.0.22
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
    concerto archive create -m digitalproperty-network --archiveFile digitalPropertyNetwork.zip && concerto network deploy --archiveFile digitalPropertyNetwork.zip  --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d && concerto network list -n digitalproperty-network --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d

```

If you issue this command, that will submit a the transaction as was done during the full run - but importantly this is the updated transaction function. You should now see:

```
$ npm run submitTransaction

> composer-gettingstarted@1.0.0 submitTransaction /home/matthew/git17/Concerto-GettingStarted
> node cli.js landregistry submit && node cli.js landregistry list

info: [Handel] IBM Concerto: Handel appliation
info: [Handel] LandRegistry:<init> businessNetworkDefinition obtained digitalproperty-network-0.0.11
info: [Handel] updateForSale Getting assest from the registry.
info: [Handel] updateForSale Submitting transaction
info: [Handel] Transaction Submitted
info: [Handel] Command completed successfully.
info: [Handel] IBM Concerto: Handel appliation
info: [Handel] LandRegistry:<init> businessNetworkDefinition obtained digitalproperty-network-0.0.11
info: [Handel] listTitles Getting the asset registry
info: [Handel] listTitles Getting all assest from the registry.
info: [Handel] listTitles Current Land Titles
info: [Handel] Titles listed
info: [Handel]
┌──────────┬────────────────┬────────────┬─────────┬───────────────────────────────────────────────────────────────────────────────────────┬─────────┐
│ TitleID  │ OwnerID        │ First Name │ Surname │ Description                                                                           │ ForSale │
├──────────┼────────────────┼────────────┼─────────┼───────────────────────────────────────────────────────────────────────────────────────┼─────────┤
│ LID:1148 │ PID:1234567890 │ Fred       │ Bloggs  │ A nice house in the country Updated at: Wed, 11 Jan 2017 Updated at: Wed, 11 Jan 2017 │ Yes     │
├──────────┼────────────────┼────────────┼─────────┼───────────────────────────────────────────────────────────────────────────────────────┼─────────┤
│ LID:6789 │ PID:1234567890 │ Fred       │ Bloggs  │ A small flat in the city                                                              │ No      │
└──────────┴────────────────┴────────────┴─────────┴───────────────────────────────────────────────────────────────────────────────────────┴─────────┘
info: [Handel] Command completed successfully.
```

## Digging Deeper

Both `npm install` and `npm test` run commands defined in `package.json`. If you open `package.json` you will see that it uses the following utility scripts and commands.

```bash
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
    concerto archive create -m digitalproperty-network --archiveFile digitalPropertyNetwork.zip && concerto network deploy --archiveFile digitalPropertyNetwork.zip  --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d && concerto network list -n digitalproperty-network --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d
```

* *npm test*  The standard test target runs some mocha based unti tests, then invokes two other npm run commands to store some test assets and submit a simple transaction.
* *npm install* This standard target installs the dependancies and also some some essential setup for the Concerto Framework

Let's look at each of the other scripts and what they do - there are two main shell scripts that we have written that will control Hyperledger, some concerto commands and then the application.

**Shell scripts to control Hyperledger**

* `scripts/download-hyperledger.sh` This is a shell script that will download and tag the docker images for Hyperledger v0.6. It is important to note that this script will also delete the Concerto Connection Profiles. This is important if you have connected to other Hyperledger Fabrics, or have changed the default ports that Hyperledger uses.

`npm install` uses this script.

* `scripts/start-hyperledger.sh` This is a shell script that starts the Hyperledger Fabric, this will also wait to make sure the Hyperledger fabric has started.
`npm run startHLF` can also be used to call this script.
* `scripts/stop-hyperledger.sh` This is the opposite of the start script, and will stop the Hyperledger Fabric - but it critically does not delete or remove any state. Therefore it canbe restarted with the start script.  `npm run stopHLF` can also be used to call this script.
* `scripts/teardown.sh` This will stop and remove all the docker images related to Hyperledger fabric. This can be used to do an effective clean-up of the Hyperledger Fabric and the Concerto Connection Profiles.

**Concerto CLI**

* `concerto archive create -m digitalproperty-network --archiveFile digitalPropertyNetwork.zip`
This command is used to create a Business Network Archive. `--archiveFile` is the name of the file. The `-m` is the npm module name of the business network to use. There is also a -d option to specify the directory the business network is in. Useful whilst developing the business network transactions functions.

* `concerto network deploy --archiveFile digitalPropertyNetwork.zip  --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d`
This deploys the business network to the HyperLedger runtime; the archive is specified but also the Hyperledger Entrollment Id and Secret (the secret if not included in the command line will be prompted for)
* `concerto network list -n digitalproperty-network --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d`
This lists the deployed business network details. `-n` is the name of the business network. With the same options for the Hyperledger Entrollment Id and Secret (the secret if not included in the command line will be prompted for)

**Sample Applications**

There are 3 sample Javascript applications that use the Concerto Client API to perform operations on the business network. These are applications that specific to the business network that has been defined in this Digital Property Network.

* `node cli.js landregistry submit`  This applications connects, and submits a transaction.
* `node cli.js landregistry list`   This lists the contents of the asset registries that have been defined in the business network.
* `node cli.js landregistry bootstrap` This applications puts some pretend assets into the registries to work with.

#Where next?
So we have downloaded the Hyperledger docker containers and stated a fabric. We have used the Concerto Command line to deploy and update a the DigitalProperty Network. We have used some Javascript applications in node.js to list assets and submit transactions to work on those assets.  A simple change and update has been made to one of the transaction functions.
