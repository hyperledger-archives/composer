---
layout: default
title: Hyperledger Composer - Business Network
category: concepts
sidebar: sidebars/introduction.md
excerpt: Business Network
---

# An Example Business Network

---

Imagine a property network, comprising participants who want to buy and sell property, estate agents (realtors) who provide matching services between buyers and sellers, conveyancers who exchange legal contracts related to the buying and selling of property, and government land registries who record the ongoing ownership of property.  

Here are the key elements of this property network.

* Participants. Buyers, sellers, estate agents (realtors), conveyancers and the government land registry are the people and organizations who participate in this network.

* Assets. Property is the asset that is exchanged and between buyers and sellers in the property network. Property is advertised by estate agents (realtors), exchanged by conveyancers, and recorded by land registries. Property has a fairly rich lifecycle, in that it can be created, exchanged, modified and destroyed.

* Registries.  Clearly the Land Registry record of properties is an obvious registry in this network, but there are others.  The estate agent (realtor) has a set of properties for sale by registered sellers and interested buyers, and probably a separate record of the deals between buyers and sellers that are in-flight at a given moment in time.  Conveyancers probably have a registry of properties in the process of being legally exchanged between buyers and sellers.  Assets will be updated within these registries as they are exchanged between buyers and sellers.

* Transactions. There are many transactions going on in this property network. Sellers sell property and buyers buy them.  Conveyancers create and exchange legal contracts with other conveyancers on behalf of buyers and sellers and their respective property sales.  The Land Registry records updates to property ownership, and estate agents (realtors) indicate that properties are for sale in a market and remove them from that market once they have been sold.

{{site.data.conrefs.composer_full}} makes it easy to create these elements in a business network, and the applications which capture interactions between different participants.  

## Related Concepts

[Business Network Definition](../introduction/businessnetworkdefinition.html)

## Related Tasks

[Deploying a business network](../business-network/deploybusinessnetwork.html)

## Related Reference

[Network deploy command](../reference/composer.network.deploy.md)
