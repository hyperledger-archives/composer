---
layout: default
title: Getting Started with coding a Business Network Definition
category: start
sidebar: sidebars/businessnetworks.md
excerpt: Getting Started with coding a Business Network Definition
---

# Coding a Business Network Definition

---

This tutorial will take you through how to code and deploy a Business Network Definition. How to put together the files, and code artifacts needed and what to do with them.
This is after the important step of modeling the actual business network and the entities within it.  For this tutorial we are going to continue to use the Digital Property Network but from the position of having only the model file and the transction function file.

# Style of creation
The final form of the Business Network Archive is mandatory for Fabric Composer. This file is created using the `composer archive create` command; however how the files that are taken as input to that command are created and managed is not mandatory. In all the documents and websites we are showing a selection of approaches we consider to be good practice.

For this tutorial, a single NPM module will be created for both the model and transaction functions. An archive will be created from this locally and deployed.
In production this NPM module would be published to a NPM repository, in development/test context this is not required.

Also the command line set of tools will be used.

#Creating the npm Module.

## Basic Infrastrure
We will need to have the command line Fabric Composer tools installed. If you've not done this yet

```bash
$ npm install -g composer-cli
```


Ensure that you have a new clean working directory

```bash
$ mkdir property-network && cd property-network && pwd
/home/matthew/property-network
```

Now we need to setup the NPM module as follows. It's ok to accept the default values, but you are welcome to change any that you wish.

```bash
$ npm init
This utility will walk you through creating a package.json file.
It only covers the most common items, and tries to guess sensible defaults.

See `npm help json` for definitive documentation on these fields
and exactly what they do.

Use `npm install <pkg> --save` afterwards to install a package and
save it as a dependency in the package.json file.

Press ^C at any time to quit.
name: (property-network)
version: (1.0.0)
description:
entry point: (index.js)
test command:
git repository:
keywords:
author:
license: (ISC)
About to write to /home/matthew/property-network/package.json:

{
  "name": "property-network",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC"
}


Is this ok? (yes) yes
```

The infrastructure is now in place, the model and transaction functions can now be added.

## Model file

The files are simple text files following a defined syntax, create a new blank file.

```bash
$ touch models/DigitalLandTitle.cto
```

Load that file up in any editor and then add your own model, or copy in the code below that is the DigitalLandTitle Getting Started Example

```
/**  A 'Getting Started Tutorial' to work with Fabric Composer
*/

namespace net.biz.digitalPropertyNetwork

asset LandTitle identified by titleId {
  o String   titleId
  --> Person   owner
  o String   information
  o Boolean  forSale   optional
}

asset SalesAgreement identified by salesId {
  o String    salesId
  --> Person    buyer
  --> Person    seller
  --> LandTitle title
}

participant Person identified by personId {
  o String personId
  o String firstName
  o String lastName
}

transaction RegisterPropertyForSale identified by transactionId{
  o String transactionId
  --> Person seller
  --> LandTitle title
}
```

## Transaction functions
The transaction function files are stadard JavaScript files. Create a blank file for this.

```bash
$ touch lib/DigitalLandTitle.js
```

In this example the following is the implementation of the `registeryPropertyForSale` transaction. Copy this in to the `lib/DigitalLandTitle.js` file.

```javascript
'use strict';

/**
 * Process a property that is held for sale
 * @param {net.biz.digitalPropertyNetwork.RegisterPropertyForSale} propertyForSale the property to be sold
 * @transaction
 */
function onRegisterPropertyForSale(propertyForSale) {
    console.log('### onRegisterPropertyForSale ' + propertyForSale.toString());
    propertyForSale.title.forSale = true;

    returAssetRegistry('net.biz.digitalPropertyNetwork.LandTitle').then(function(result) {
            return result.update(propertyForSale.title);
        }
    );
}
```

*That has completed the creation of the npm module for the Business Network, the next step is to form this into a Business Network Archive*

# Creating the Business Network Archive
Once we have the network complete we can create a business network definition archive. This is the unit will actually be deployable to the HyperLedger Fabric.

There is a `composer archive` command that can be used to create and inspect these archives. The `composer network` command is then used to administer the business network archive on the Hyperledger Fabric.

### Creating an archive

The `composer archive create` command is used to create the archive. The `--archiveFile` option is used to specify the name of the archive file to create. If this is not specified then a default name will be used that is based on the identifier of the business network (sanitized to be suitable as a filename). For example `digitalPropertyNetwork-0.1.2.bna`.

There are two options that control where the inputs for the archive create from.

- *--sourceType* can either be *dir* or *module*.  *dir* implies that the source is from a directory, *module* from an NPM module that has been installed.
- *--sourceName* is either the directory name or the NPM module name as appropriate.

In the case of a directory being given, this directory must containsthe `package.json` file of the Business Network's npm module's package.json.

```bash
$ composer archive create --archiveFile digitalLandTitle.bna --sourceType dir --sourceName .
```

Once you have this archive it can then be deployed to Hyperledger (which will assuming is all running for the moment)

```bash
$ composer network deploy --archiveFile  DigitalLandTitle.bna  --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d
```

## Continued Development of the model or transaction functions

The next step in the development process would be to update either the model or transaction functions or both. When you've done this, the steps are to recreate the archive and then redeploy the network.

```bash
$ composer archive create --archiveFile digitalLandTitle.bna ---sourceType dir --sourceName .
$ composer network update --archiveFile digitalproperty-network@0.0.1.bna  --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d
```

#Complete!

This tutorial is now complete. The next step would be to create a REST api for applications to use. The [next tutorial](./getting-started-rest-api.md) will create a REST api for the Digital Property Network.
