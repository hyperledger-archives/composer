---
layout: default
title: Cloud Storage for Business Network Cards
category: concepts
section: business-network
index-order: 511
sidebar: sidebars/accordion-toc0.md
excerpt: "{{site.data.conrefs.composer_full}} Performance"
---

# Cloud Storage for Business Network Cards

Business network cards can be stored in a local wallet or a cloud wallet. The local wallet is the default and can be found in the `/home/username/.composer` directory, however, local wallets can be problematic for applications running in cloud environments. By using cloud wallets, users can control where business network cards and the certificates and private keys used for {{site.data.conrefs.hlf_full}} authentication are stored.

>Please note: any custom cloud wallet implementations **must** include the `composer-wallet` prefix in the module name.

## High level architecture

Whenever a `BusinessNetworkConnection` or `AdminConnection` is made, it has an associated `CardStore`. Each connection can be configured to use a specific `CardStore`. In the {{site.data.conrefs.composer_full}} repository, there are two pre-configured options for stores:

- `composer-wallet-filesystem`
- `composer-wallet-inmemory`

A single implementation of a backend store can be used for both business network cards and {{site.data.conrefs.hlf_full}} private keys and certificates. The store configuration can be done using either a configuration file, or by using environment variables. Custom implementations can be written for any given backend database or object store. The following two GitHub repositories contain implementations of cloud wallets using the IBM Cloud Object Store and Redis, respectively.

- [@ampretia/composer-wallet-ibmcos](https://github.com/ampretia/composer-wallet-ibmcos)  - provides a backing store using the IBM Cloud Object Store. This has an S3 compatible API
- [@ampretia/composer-wallet-redis](https://github.com/ampretia/composer-wallet-redis)   - provides a backing store using a Redis server

Multiple cloud wallet implementations can be installed using global npm installs.

For more details of the writing a new cloud wallet implementation, see the following [README](https://github.com/ampretia/composer-wallet-ibmcos).

## Configuring a cloud wallet connection

There are two ways to define the configuration for a cloud wallet, by using a `.json` config file, or by defining environment variables.

### Configuring a cloud wallet using a configuration file

For production deployments, it is more useful to be able to configure the card store outside of the application,
{{site.data.conrefs.composer_full}} uses the standard configuration module `config`. The configuration file is loaded from a sub-directory of the current working directory called `config`.  The default configuration file is called `default.json`, the configuration file name can be changed using the `NODE_ENV` environment variable.

The following configuration file uses the IBM Cloud Object Store format as an example:

```
{
  "composer": {
    "wallet": {
      "type": "@ampretia/composer-wallet-ibmcos",
      "desc": "Uses the IBM Cloud Object Store",
      "options": {
        "bucketName": "alpha-metal",
        "endpoint": "s3.eu-gb.objectstorage.softlayer.net",
        "apikey": "0viPHOY7LbLNa9eLftrtHPpTjoGv6hbLD1QalRXikliJ",
        "serviceInstanceId": "crn:v1:bluemix:public:cloud-object-storage:global:a/3ag0e9402tyfd5d29761c3e97696b71n:d6f74k03-6k4f-4a82-b165-697354o63903::"
      }
    }
  }
}
```

- `type` is the name of this module
- `desc` is some text for the humans
- `bucketName` is the buckName you created
- `endpoint` is the *Service Endpoint* from the *Endpoint* section in the Object Store dashboard
- `apikey` is the API key from the service credentials
- `serviceInstanceId` is the *resource_instance_id* from the service credentials

> Note that each connection will have a new instance of the card store specified. If these resolve to the same backend store cards can be shared.

### Configuring a cloud wallet using an environment variable

As this is using the `config` module specifying the details on the command line via environment variables can be achieved by setting an environment variable containing the same information as the configuration file.

The following environment variable example uses the same format and data as the preceding configuration file.

```
export NODE_CONFIG={"composer":{"wallet":{"type":"@ampretia/composer-wallet-ibmcos","desc":"Uses the IBM Cloud Object Store","options":{"bucketName":"alpha-metal","endpoint":"s3.eu-gb.objectstorage.softlayer.net","apikey":"0viPHOY7LbLNa9eLftrtHPpTjoGv6hbLD1QalRXikliJ","serviceInstanceId":"crn:v1:bluemix:public:cloud-object-storage:global:a/3ag0e9402tyfd5d29761c3e97696b71n:d6f74k03-6k4f-4a82-b165-697354o63903::"}}}}
```

Any application that is in this shell will use the cloud wallets.


## Migrating to a cloud wallet from a file system wallet

To migrate to either the IBM Cloud Object Store or Redis cloud wallet solutions, refer to the README files of the relevant GitHub repository.

In a general sense, migrating to a cloud wallet implementation has three steps.

1. Export the business network cards you wish to use in the cloud wallet.
2. Change configuration to specify the cloud wallet.
3. Import the business network cards into the cloud wallet.

The `composer-wallet-filesystem` is the default card store and follows the same layout on disc, and by default is in the same location.

Some samples and test cases show the card stores being created programmatically. This is still possible and but is slightly different in terms of initial creation of the card store.

## Using cloud wallets with APIs

Using the file system card store remains the default option, and in the absence of other configuration, has not changed.

```javascript
        adminConnection = new AdminConnection();
        clientConnection = new BusinessNetworkConnection();
```
This will use the file system card store at the location `/home/username/.composer`


### API MemoryCardStore configuration

Previously to use the in MemoryCardStore, the code would have been written

```javascript
        cardStore = new MemoryCardStore();
        const adminConnectionOptions = {
            cardStore : cardStore
        };
        adminConnection = new AdminConnection(adminConnectionOptions);
        // or more concisely
        clientConnection = new BusinessNetworkConnection({cardStore});
```

Card stores must now be specified differently. There are two approaches using the API, the second approach permits the card store to be kept and used in a different connection.

```javascript
        const adminConnectionOptions = { wallet : { type: 'composer-wallet-inmemory' } };
        adminConnection = new AdminConnection(adminConnectionOptions);

        // alternatively...

        const NetworkCardStoreManager= require('composer-common').NetworkCardStoreManager;
        const cardStore = NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory' } );
        let adminConnection = new AdminConnection({ cardStore });
```

## Configuring file system card stores

The location of the file system card store can now be changed using a configuration file or specified as a variable in an API call.

```javascript

        const adminConnectionOptions = {
            wallet : {
                type: 'composer-wallet-filesystem',
                options : {
                    storePath :'/my/network/location'
                }
            }
        };
        adminConnection = new AdminConnection(adminConnectionOptions);
```

Alternatively, this can be specified in a configuration file.

```
{
  "composer": {
    "wallet" : {
        "type": "composer-wallet-filesystem",
        "options" : {
            "storePath" : "/my/network/location"
        }
    }
}
```
