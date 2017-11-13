---
layout: default
title: Deploying Business Networks
category: tasks
section: business-network
index-order: 503
sidebar: sidebars/accordion-toc0.md
excerpt: How to deploy a business network
---

# Deploying Business Networks

Before a business network definition can be deployed it must be packaged into a _Business Network Archive_ (.bna) file. The `composer archive create` command is used to create a business network archive file from a business network definition folder on disk.

Once the business network archive file has been created it can be deployed to a runtime using the [`composer network deploy`](../reference/composer.network.deploy.html) command using a suitable [Connection Profile](../reference/connectionprofile.html).

For example:

    composer network deploy -p connectionProfileName -a <BusinessNetworkDefinition>.bna
    -i <Your EnrollmentID> -s <Your EnrollmentSecret>
    -A admin -S

To update the business network definition for an already deployed business network use the [`composer network update`](../reference/composer.network.update.html) CLI command.

## Deploying business networks to {{site.data.conrefs.hlf_full}} v1.0

In {{site.data.conrefs.hlf_full}} v1.0, peers enforce the concepts of administrators and members (or users). Administrators have permission to install {{site.data.conrefs.hlf_full}} chaincode for a new business network onto peers. Members do not have permission to install chaincode. In order to deploy a business network to a set of peers, you must provide an identity that has administrative rights to all of those peers.

To make that identity and its certificates available, your must import the identity into the credential store used by {{site.data.conrefs.composer_full}}. To import the identity, use the [`composer identity import`](../reference/composer.card.import.html) command. When importing an identity, you do not assign it a secret, however the [`composer network deploy`](../reference/composer.network.deploy.html) command requires a secret. If you are using an imported identity, you can enter any value for the secret, and it will be ignored.

{{site.data.conrefs.composer_full}} provides a sample {{site.data.conrefs.hlf_full}} v1.0 network. The peer administrator for this network is called `PeerAdmin`, and the identity is automatically imported for you when you use the sample scripts for starting the network. Please note that the peer administrator may be given a different name for other {{site.data.conrefs.hlf_full}} v1.0 networks.

## Business network administrators

When you deploy a business network, access controls are enforced as per the access control rules specified in the business network definition. Each business network must have at least one participant, and that participant must have a valid identity for accessing the business network. Otherwise, client applications cannot interact with the business network.

A business network administrator is a participant who is responsible for configuring the business network for their organisation after the business network is deployed, and is responsible for on-boarding other participants from their organisation. Because business networks include multiple organisations, there should be multiple business network administrators for any given business network.

A built-in participant type, `org.hyperledger.composer.system.NetworkAdmin`, representing a business network administrator is provided by {{site.data.conrefs.composer_full}}. This built-in participant type does not have any special permissions; they are still subject to the access control rules specified in the business network definition. For this reason, it is recommended that you start with the following sample access control rules that grant business network administrators full access to a business network:

```json
rule NetworkAdminUser {
    description: "Grant business network administrators full access to user resources"
    participant: "org.hyperledger.composer.system.NetworkAdmin"
    operation: ALL
    resource: "**"
    action: ALLOW
}

rule NetworkAdminSystem {
    description: "Grant business network administrators full access to system resources"
    participant: "org.hyperledger.composer.system.NetworkAdmin"
    operation: ALL
    resource: "org.hyperledger.composer.system.**"
    action: ALLOW
}
  ```

By default, {{site.data.conrefs.composer_full}} will automatically create a single business network administrator participant during deployment. The identity that is used for deploying the business network will also be bound to that business network administrator participant, so that identity can be used to interact with the business network after deployment.

{{site.data.conrefs.hlf_full}} peer administrators may not have permission to issue new identities using the {{site.data.conrefs.hlf_full}} Certificate Authority (CA). This may restrict the ability of the business network administrator to on-board other participants from their organisation. For this reason, it may be preferable to create a business network administrator that does have permission to issue new identities using the {{site.data.conrefs.hlf_full}} Certificate Authority (CA).

You can use additional options to the [`composer network deploy`](../reference/composer.network.deploy.html) command to specify the business network administrators that should be created during the deployment of the business network.

If the business network administrator has an enrollment ID and enrollment secret, you can use the `-A` (business network administrator) and `-S` (business network administrator uses enrollment secret) flags. For example, the following command will create a business network administrator for the existing `admin` enrollment ID:

    composer network deploy -p hlfv1 -a my-network.bna -i PeerAdmin -s randomString -A admin -S

If the business network administrator already has a certificate, you can use the `-A` (business network administrator) and `-C` (business network administrator certificate file) flags. For example, the following command will create a business network administrator for the specified certificate file:

    composer network deploy -p hlfv1 -a my-network.bna -i PeerAdmin -s randomString -A admin -C /path/to/admin.pem

You can also create multiple business network administrators by repeating the options. For example, the following command will create a business network administrator for all three of the specified certificate files:

    composer network deploy -p hlfv1 -a my-network.bna -i PeerAdmin -s randomString -A admin1 -C /path/to/admin1.pem -A admin2 -C /path/to/admin2.pem -A admin3 -C /path/to/admin3.pem

## Deploying business networks using Playground locally

When deploying a business network to {{site.data.conrefs.hlf_full}} v1.0 using the Playground locally, you must follow the process above to connect using the peer admin identity.

Identities in playground are associated with business network cards, comprising a connection profile, identity metadata, and certificates.

When deploying a business network using Playground locally, you must have at least one business network card with the `PeerAdmin` role and at least one business network card with the `ChannelAdmin` role. Each of these business network cards must contain the correct admin certificates.

## Errors deploying a business network to a local fabric using the {{site.data.conrefs.composer_full}} Playground

When deploying a business network to an instance of {{site.data.conrefs.hlf_full}} by using a locally installed {{site.data.conrefs.composer_full}} Playground, you may encounter the following error:

```
Error: error trying to list instantiated chaincodes. Error: chaincode error (status 500, message: Authorization for GETCHAINCODES on channel getchaincodes has been denied with error Failed verifying that proposal's creator satisfies local MSP principal during channelless check policy with policy [Admins]:[This identity is not an admin])
```

Once this error has occurred, you must delete your local browser storage to restore normal function. *Please note*: Deleting local browser storage will delete your connection profile and identities in your wallet. For more information on this error, see the [specific error page](../problems/deployment-local-playground.html)

## References

* [**Composer CLI commands**](../reference/commands.html)
