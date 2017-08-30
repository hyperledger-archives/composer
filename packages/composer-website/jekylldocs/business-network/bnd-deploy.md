---
layout: default
title: Deploying and Updating Business Networks
category: tasks
section: business-network
index-order: 503
sidebar: sidebars/accordion-toc0.md
excerpt: How to deploy or update Business Networks
---

# Deploying and Updating Business Networks


Before a business network definition can be deployed it must be packaged into a _Business Network Archive_ (BNA) file. The `composer archive create` command is used to create a BNA file from a root folder on disk.

Once the BNA file has been created it can be deployed to a runtime using the `composer network deploy` command using a suitable [Connection Profile](../reference/connectionprofile.html)

For example:

        composer network deploy -p connectionProfileName -a <BusinessNetworkDefinition>.bna
           -i <Your EnrollmentID> -s <Your EnrollmentSecret>

To update the definition of an already deployed business network use the `composer network update` CLI command.

## Deploying business networks to {{site.data.conrefs.hlf_full}} v1.0

In {{site.data.conrefs.hlf_full}} v1.0 peers now enforce the concepts of admins and members. Admin user's identities and crypto material must be available to the peer at deployment. To make that identity and its crypto material available, your must import it to your local `keyValStore` directory before deploying the business network. To import the identity, use the [`composer identity import` command](../reference/composer.identity.import.html). When importing an identity, you do not assign it a secret, however the `composer network deploy` command requires a secret. If you are using an imported identity, you can enter any value for the secret.

When connecting to the peer you must use an identity (certificate) where the Common Name (CN) contains the text `admin`, for example, `PeerAdmin`, `myadmin`, `Admin` or `AdminPeer` are all valid Common Names. Peers in different organizations may have different admin users. Only an admin user of peer's organization will be able to deploy a business network to their peers.

Due to many breaking API changes between {{site.data.conrefs.hlf_full}} alpha 1 and {{site.data.conrefs.hlf_full}} v1.0, {{site.data.conrefs.composer_full}} only supports the {{site.data.conrefs.hlf_full}} v1.0 and cannot support older versions of {{site.data.conrefs.hlf_full}} v1.0 (e.g. alpha 1).

### Deploying business networks using Playground locally

When deploying a business network to {{site.data.conrefs.hlf_full}} v1.0 using the Playground locally, you must follow the process above to connect using the peer admin identity.

Identities in playground are associated with ID cards, comprising a connection profile, identity metadata, and certificates.

When deploying a business network using Playground locally, you must have at least one ID card with the `PeerAdmin` role and at least one ID card with the `ChannelAdmin` role. Each of these ID cards must contain the correct admin certificates.


### Errors deploying a business network to a local fabric using the {{site.data.conrefs.composer_full}} Playground

When deploying a business network to an instance of {{site.data.conrefs.hlf_full}} by using a locally installed {{site.data.conrefs.composer_full}} Playground, you may encounter the following error:

```
Error: error trying to list instantiated chaincodes. Error: chaincode error (status 500, message: Authorization for GETCHAINCODES on channel getchaincodes has been denied with error Failed verifying that proposal's creator satisfies local MSP principal during channelless check policy with policy [Admins]:[This identity is not an admin])
```

Once this error has occurred, you must delete your local browser storage to restore normal function. *Please note*: Deleting local browser storage will delete your connection profile and identities in your wallet. For more information on this error, see the [specific error page](../problems/deployment-local-playground.html)

## References

* [**Composer CLI commands**](../reference/commands.html)
