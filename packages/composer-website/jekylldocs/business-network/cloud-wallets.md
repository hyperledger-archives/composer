---
layout: default
title: Customising card stores
category: concepts
section: business-network
index-order: 512
sidebar: sidebars/accordion-toc0.md
excerpt: "{{site.data.conrefs.composer_full}} Performance"
---

# Customising the card store

The default card store is the `/home/username/.composer` directory on the host machine. Local wallets can be problematic for applications running in cloud environments, and it may be desired to have the card store at different directory location. By using custom wallets, users can control where business network cards and the certificates and private keys used for {{site.data.conrefs.hlf_full}} authentication are stored.

## Architecture

Whenever a `BusinessNetworkConnection` or `AdminConnection` is made, it has an associated `CardStore`. Each connection can be configured to use a specific `CardStore`. In the {{site.data.conrefs.composer_full}} repository, there are two pre-configured options for stores:

- `composer-wallet-filesystem`
- `composer-wallet-inmemory`

Custom implementations can be written for any given backend database or object store, enabling the specification of a `CardStore` that is in a non-default file location, a separate docker container, or hosted in a cloud based data store. The store configuration can be completed using either a configuration file, or by using environment variables.

- [composer-tools/composer-wallet-redis](https://github.com/hyperledger/composer-tools/tree/master/packages/composer-wallet-redis)   - provides a backing store using a Redis server
- [@ampretia/composer-wallet-ibmcos](https://github.com/ampretia/composer-wallet-ibmcos)  - provides a backing store using the IBM Cloud Object Store. This has an S3 compatible API

Multiple cloud wallet implementations can be installed using global npm installs.

For more details of the writing a new cloud wallet implementation, see the following [README](https://github.com/hyperledger/composer-tools/tree/master/packages/composer-wallet-redis).

# Configuring a custom wallet

There are two ways to define the configuration for a custom wallet: by using a `.json` configuration file, or by defining environment variables.

>Please note: any custom wallet implementation **must** include the `composer-wallet` prefix in the module name.

## Using a configuration file

For production deployments, it is more useful to be able to configure the card store outside of the application,
{{site.data.conrefs.composer_full}} uses the standard configuration module `config`. The configuration file is loaded from a sub-directory of the current working directory called `config`.  The default configuration file is called `default.json`, the configuration file name can be changed using the `NODE_ENV` environment variable.

The following configuration file uses the Redis format as an example:

```
{
  "composer": {
    "wallet": {
      "type": "composer-wallet-redis",
      "desc": "Uses a local redis instance,
      "options": {

      }
    }
  }
}
```

- `type` is the name of this module
- `desc` is some text for the humans

> Please note: Each connection will have a new instance of the card store specified. If these resolve to the same backend store, cards can be shared.

## Using an environment variable

Specifying the details of a custom wallet on the command line via environment variables may be achieved by setting an environment variable containing the same information as the configuration file.

The following environment variable example uses the same format and data as the preceding configuration file.

```
export NODE_CONFIG={"composer":{"wallet":{"type":"composer-wallet-redis","desc":"Uses  a local redis instance,"options":{}}}}
```

Any application that is in this shell will use the cloud wallets.

# Configuring file system custom card stores

The location of the file system card store can be changed using a configuration file, through specification of a `storePath` as one of the wallet options.

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

The same `.json` snippet may be exported as an environment variable.

# Configuring cloud based custom card stores

The following GitHub repositories contain implementations of cloud custom wallets using Redis and the IBM Cloud Object Store, respectively.

- [composer-tools/composer-wallet-redis](https://github.com/ampretia/composer-wallet-redis) - provides a backing store using a Redis server
- [@ampretia/composer-wallet-ibmcos](https://github.com/ampretia/composer-wallet-ibmcos) - provides a backing store using the IBM Cloud Object Store. This has an S3 compatible API.

Multiple cloud custom wallet implementations can be installed using global npm installs.

For more details of the writing a new cloud based custom wallet implementation, see the following [README](https://github.com/hyperledger/composer-tools/tree/master/packages/composer-wallet-redis).

To migrate to either the Redis or IBM Cloud Object Store cloud custom wallet solutions, refer to the README files of the relevant GitHub repository.

In a general sense, migrating to a cloud wallet implementation has three steps.

1. Export the business network cards you wish to use in the cloud custom wallet.
2. Change configuration to specify the cloud custom wallet.
3. Import the business network cards into the cloud custom wallet.

The `composer-wallet-filesystem` is the default card store and follows the same layout on disc, and by default is in the same location.

Some samples and test cases show the card stores being created programmatically. This is still possible and but is slightly different in terms of initial creation of the card store.

# Using custom wallets with APIs

## API CardStore configuration

Using the default location file system card store remains the default option within API calls. For instance:

```javascript
        adminConnection = new AdminConnection();
        clientConnection = new BusinessNetworkConnection();
```
will use the file system card store at the location `/home/username/.composer`, or pick up on the exported custom wallet specified within `NODE_CONFIG` if and only if executing within the same shell instance.

To specify a custom wallet within the API, without the use of a globally exported value, it must be included as an option passed to the connection:

```javascript
        const connectionOptions = {
            wallet : {
                type: 'composer-wallet-filesystem',
                options : {
                    storePath :'/my/network/location'
                }
            }
        };
        adminConnection = new AdminConnection(connectionOptions);
        clientConnection = new BusinessNetworkConnection(connectionOptions);
```

In the above, the wallet type may be that of a new file location, or a cloud based location.

## API MemoryCardStore configuration

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

This has now changed and Card stores must now be specified differently:

```javascript
        const connectionOptions = {
            wallet : {
                type: 'composer-wallet-inmemory'
            }
        };
        adminConnection = new AdminConnection(connectionOptions);
        clientConnection = new BusinessNetworkConnection(connectionOptions);
```
