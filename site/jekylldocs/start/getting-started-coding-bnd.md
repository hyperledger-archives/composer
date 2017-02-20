---
layout: default
title: Getting Started with coding a Business Network Definition
category: start
sidebar: sidebars/start.md
excerpt: Getting Started with coding a Business Network Definition
---

# Coding a Business Network Definition

---

This tutorial will take you through how to code and deploy a Business Network Definition. This is how to put together the files, and code artifacts needed and what to do with them.

This is after the important step of modeling the actual business network and the entities within it.  For this tutorial we are going to continue to use the Digital Property Network. Let's assume that this has been designed and agree with the relevant business analysts in the relevant companies. It now needs to be codified.

## Creating a Business Network model
# Digital Property Network  Model

Defines the Business Network Model for the Digital Property Network.  This is the part of the Business Network Definition that defines the _model file_ that defines the assets, participants, transactions, and relationships that form the Business Network.

This part is encapsulated within (currently) a single file using a defined syntax. This file itself is encapsulated within an NPM module to permit version and distribution control. The transaction definitions, access control and other functional elements are held within a similar structure (npm module) that is dependent on a version of this model.

## What should I do with this model
It is expected that the model would be part of the CI pipeline.  It is expected that the model would be held in a source management system, eg github-enterprise. Edited then submitted to a eg TravisCI build. This would then publish the model to the npm-enterpise

This specific DigitalProperty-Model is already published into the public npm repository. Therefore the deployment and pipeline has already been done for you.

# Creating a new model for yourself
There are two ways of creating a new model; either using the command line and your favorite editor, or by using the the web Composer UI.

## Web Composer UI

_it's coming soon...._ but for the moment use the command line.....

## Command line

*Step1:*  Create a new NPM module

```
npm init
```

There are no mandatory dependencies that are required; the most important features are name and description of the module. The version number is also very important. This will be used when you construct the full Business Network. That will have a dependency on a specific version of the model.

*Step2:* Edit the model

The files are simple text files following a defined syntax. Within the npm module directory just create a new file, for example if you were creating this DigitalProperty-Network

```
/git/DigitialProperty-Model> touch models/DigitalLandTitle.cto
```

Load that file up in any editor and you can then add your model, Again using this Digital Property Network the file might contain
(aside if you are using the Atom editor, then there is a syntax highlighter plugin available)

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

*Step3:*
The next step is to publish your module to the NPM repository you are using.  So a command along these lines

```
npm publish
```

**That's it... you can now progress to the  DigitalProperty-Network to add the implementation of the the transactions and complete the Business Network Definition creation.**

## Advanced things to do with the model
Optional additions here are license checking to ensure that the model meets your Member Organization's agreed standards.

Other additions:
- Generation of UML to graphically show the assets and relationships
- Validation of the model.




## Creating a Business Network definition
# Digital Property Network
This defines the transaction implementations, access control lists and other functional aspects. There is a dependency on a version of a Business Network Model.

With this dependency, this DigitalProperty-Network defines the complete Business Network Definition.  In this specific example, the Digital Property Network.

## What should I do with this npm module?
It is expected that this npm module would be associated with a CI pipeline and tracked as source code in something like GitHub Enterprise. The CI pipeline this would be able to run functional validation on the whole definition, and also be able to published the module to an NPM repository. This allows sharing of the module etc.

For a production or QA runtime there are administrative steps (deploy, update, remove etc.) that are performed using this Business Network Definition on a running Hyperledger Fabric. The life-cycle at it's simplest is *deploy a network definition*, *update a network definition* and (potentially) *remove the network definition*. These actions are performed using the Business Network Archive - which is a single file that encapsulates all aspects of the Business Network Definition. It is the 'deployable unit'.

## Creating the BusinessNetwork.
*Step1:* Create a npm module

```
npm init
```
The important aspects of this are the name, version and description. The only dependency that will be required is the NPM module that contains the model - see step 2.

*Step2:* Create the transaction functions

We need to create a standard JavaScript file to contain the transaction functions

```bash
\git\DigitialProperty-Model > touch lib/DigitalLandTitle.js
```

In this example the following is the implementation of the `registeryPropertyForSale` transaction

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

## Work with the network
Once we have the network complete we can create a business network definition archive. This is the unit will actually be deployable to the HyperLedger Fabric.

There is a `composer archive` command that can be used to create and inspect these archives. The `composer network` command is then used to administer the business network archive on the Hyperledger Fabric.

### Creating an archive

The `composer archive create` command is used to create the archive. The `--archiveFile` option is used to specify the name of the archive file to create. If this is not specified then a default name will be used that is based on the identifier of the business network (sanitized to be suitable as a filename). For example `digitalPropertyNetwork-0.1.2.bna`.

One of either --inputDir or --moduleName must be specified. --inputDir is the directory that contains the `package.json` file of the Business Network npm module's package.json.



```bash
composer archive create --archiveFile digitialLandTitle.bna --inputDir . --moduleName DigitalLandTitle
```

Once you have this archive it can then be deployed to Hyperledger (which will assuming is all running for the moment)

```bash
composer network deploy --archiveFile  DigitalLandTitle.bna  --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d
```
