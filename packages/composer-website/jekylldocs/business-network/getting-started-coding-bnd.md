---
layout: default
title: Getting Started with coding a Business Network Definition
category: start
sidebar: sidebars/businessnetworks.md
excerpt: Getting Started with coding a Business Network Definition
---

# Coding and deploying a business network definition

---

This tutorial will take you through how to code and deploy a Business Network Definition. How to put together the files, code required artifacts, and what to do with them.

The final form of the Business Network Archive (`.bna`) is mandatory for {{site.data.conrefs.composer_full}}. However, the creation and management of the input files is not mandatory.

For this tutorial, a single NPM module will be created for both the model and transaction functions. An archive will be created locally  and deployed. The NPM module consists of your business network definition, and the `package.json` file.


## Before you begin

Typically, a business network would be deployed after fully modelling and testing a business network definition. For this tutorial we are going to continue to use the Digital Property Network sample business network, using only the model file and the transction function file.

You will need the {{site.data.conrefs.composer_short}} command line tools. To install the tools run the following command:

```bash
$ npm install -g composer-cli
```

*Please note: When using Ubuntu this command will fail when running in a root user shell.*

You will also require a running {{site.data.conrefs.hyperledger_fabric_full}}. For more information on setting up an instance of {{site.data.conrefs.hyperledger_fabric_full}}, see the [Fabric documentation]()*fill this in*

# Creating the npm module.

## Creating the basic infrastrure

1. Ensure that you have a new clean working directory by using the following command:

        ```bash
        $ mkdir property-network && cd property-network && pwd
        /home/matthew/property-network
        ```

2. Now we need to setup the NPM module. The default values can be accepted, but you are welcome to change any that you wish.

        ```bash
        $ npm init
        This utility will walk you through creating a package.json file.
        It only covers the most common items, and tries to guess sensible defaults.

        See `npm help json` for definitive documentation on these fields
        and exactly what they do.

        Use `npm install <pkg> --save` afterwards to install a package and save it as a dependency in the package.json file.

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

## Creating your model file

The model file defines the assets, participants, and transactions in your business network. It is a simple text file that follows a defined syntax.

1. Create the model (`.cto`) file:

        ```bash
        $ touch models/DigitalLandTitle.cto
        ```

2. Open the model file in an editor of your choice and add your own model, or copy in the code below. The following code is the DigitalLandTitle getting started example.

        ```
        /**  A 'Getting Started Tutorial' to work with Hyperledger Composer
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

## Creating transaction processor functions

The transaction processor function file is a standard JavaScript file that defines the operation of your transactions.

1. Create a blank JavaScript file.

        ```bash
        $ touch lib/DigitalLandTitle.js
        ```

2. Open the transaction processor file in an editor of your choice. Enter either the JavaScript for your own transactions, or use the following JavaScript sample. This sample is the  `registeryPropertyForSale` transaction.

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

Now that the `package.json` file has been created in addition to the business network definition, the npm module for the business network has been created. The next step is to form this into a business network archive (`.bna`) file to be depoloyed to an instance of {{site.data.conrefs.hyperledger_fabric_full}}.

---

# Creating the business network archive and deploying to {{site.data.conrefs.hyperledger_fabric_full}}

Now that the business network has been defined, a business network archive must be created. This requires all the files in the business network definition created above. The business network archive (`.bna`) file can then be deployed to {{site.data.conrefs.hyperledger_fabric_full}}.

There is a `composer archive` command that can be used to create and inspect these archives. The `composer network` command is then used to administer the business network archive on the Hyperledger Fabric.

1. Use the `composer archive create` command to create the archive. The `--archiveFile` option is used to specify the name of the archive file to create. If no filename is specified, a default name will be created  based on the identifier of the business network (sanitized to be suitable as a filename). For example `digitalPropertyNetwork-0.1.2.bna`.

  There are two options that control where the inputs for the archive create from.

  - `--sourceType` can either be `dir` or `module`. Specifying `dir` implies that the source is from a directory. Specifying `module` indicates that the source is an installed NPM module.
  - `--sourceName` is either the directory name or the NPM module name as appropriate.

  In the case of a directory being given, this directory must contain the appropriate `package.json` file.

        ```bash
        $ composer archive create --archiveFile digitalLandTitle.bna --sourceType dir --sourceName .
        ```

2. To deploy an archive file Once you have this archive it can then be deployed to Hyperledger (which will assuming is all running for the moment)

        ```bash
        $ composer network deploy --archiveFile  DigitalLandTitle.bna  --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d
        ```

# Next steps to develop the model or transaction processor functions

The next step in the development process would be to update either the model or transaction functions or both. When you've done this, the steps are to recreate the archive and then redeploy the network.

```bash
$ composer archive create --archiveFile digitalLandTitle.bna ---sourceType dir --sourceName .
$ composer network update --archiveFile digitalproperty-network@0.0.1.bna  --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d
```

# Complete!

This tutorial is now complete. The next step would be to create a REST API for applications to use. The [next step](../applications/genapp.html) will create a REST api for the Digital Property Network.
