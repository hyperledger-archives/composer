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

Once the business network archive file has been created it can be deployed to {{site.data.conrefs.hlf_full}} using the [`composer network install`](../reference/composer.network.install.html) command followed by a [`composer network start`](../reference/composer.network.start.html) command.

For example:

    composer network install --archiveFile tutorial-network@1.0.0.bna --card PeerAdmin@fabric-network
    composer network start --networkName tutorial-network --networkVersion 1.0.0 --card PeerAdmin@fabric-network --networkAdmin admin --networkAdminEnrollSecret adminpw

To upgrade the business network definition for an already deployed business network use the [`composer network upgrade`](../reference/composer.network.upgrade.html) CLI command.

## Deploying business networks to {{site.data.conrefs.hlf_full}} {{site.data.conrefs.hlf_latest}}

In {{site.data.conrefs.hlf_full}} {{site.data.conrefs.hlf_latest}}, peers enforce the concepts of administrators and members. Administrators have permission to install {{site.data.conrefs.hlf_full}} chaincode for a new business network onto peers. Members do not have permission to install chaincode. In order to deploy a business network to a set of peers, you must provide an identity that has administrative rights to all of those peers.

To make that identity and its certificates available, you must create a Peer Admin business network card using the certificate and private key associated with the peer admin identity.
{{site.data.conrefs.composer_full}} provides a sample {{site.data.conrefs.hlf_full}} {{site.data.conrefs.hlf_latest}} network. The peer administrator for this network is called `PeerAdmin`, and the identity is automatically imported for you when you use the sample scripts for starting the network. Please note that the peer administrator may be given a different name for other {{site.data.conrefs.hlf_full}} networks.

**Important**: When deploying a business network to {{site.data.conrefs.hlf_full}} {{site.data.conrefs.hlf_latest}} a bootstrap registrar is defined in the {{site.data.conrefs.hlf_full}} Certificate Authority (CA) configuration. The {{site.data.conrefs.composer_full}} development environment contains a preconfigured instance of {{site.data.conrefs.hlf_full}} with a specific enrollment ID and enrollment secret for the bootstrap registrar.

## Business network administrators

When you deploy a business network, access controls are enforced as per the access control rules specified in the business network definition. Each business network must have at least one participant, and that participant must have a valid identity for accessing the business network. Otherwise, client applications cannot interact with the business network.

A business network administrator is a participant who is responsible for configuring the business network for their organisation after the business network is deployed, and is responsible for on-boarding other participants from their organisation. Because business networks include multiple organisations, there should be multiple business network administrators for any given business network.

A built-in participant type, `org.hyperledger.composer.system.NetworkAdmin`, representing a business network administrator is provided by {{site.data.conrefs.composer_full}}. This built-in participant type does not have any special permissions; they are still subject to the access control rules specified in the business network definition. For this reason, it is recommended that you start with the following sample access control rules that grant business network administrators full access to a business network:

```
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

You can use additional options to the [`composer network start`](../reference/composer.network.start.html) command to specify the business network administrators that should be created during the deployment of the business network.

If the business network administrator has an enrollment ID and enrollment secret, you can use the `-A` (business network administrator) and `-S` (business network administrator uses enrollment secret) flags. For example, the following command will create a business network administrator for the existing `admin` enrollment ID:

    composer network start --networkName tutorial-network --networkVersion 1.0.0 --c PeerAdmin@fabric-network -A admin -S adminpw

## Deploying business networks using Playground locally

**Please note**: When using a local Playground instance to deploy a business network to {{site.data.conrefs.hlf_full}} {{site.data.conrefs.hlf_latest}}, as part of the deployment process you must choose how to provide credentials for the initial business network participant. The initial participant will be a [**NetworkAdmin**](https://github.com/hyperledger/composer/blob/master/packages/composer-common/lib/system/org.hyperledger.composer.system.cto).

When deploying a business network using playground, you will be prompted to enter the credentials for the initial participant. Credentials can be provided either as a certificate or as a pre-defined enrollment ID and enrollment secret. If you are using the instance of {{site.data.conrefs.hlf_full}} set up in the {{site.data.conrefs.composer_full}} development environment, the bootstrap registrar enrollment ID is `admin` and the bootstrap registrar enrollment secret is `adminpw`.  This initial participant uses the credentials set for the bootstrap registrar in the {{site.data.conrefs.hlf_full}} Certificate Authority (CA), and will be a [**NetworkAdmin**](https://github.com/hyperledger/composer/blob/master/packages/composer-common/lib/system/org.hyperledger.composer.system.cto).

When deploying a business network using Playground locally, you must have at least one business network card with the `PeerAdmin` role and at least one business network card with the `ChannelAdmin` role. Each of these business network cards must contain the correct admin certificates.

## References

* [**Composer CLI commands**](../reference/commands.html)
