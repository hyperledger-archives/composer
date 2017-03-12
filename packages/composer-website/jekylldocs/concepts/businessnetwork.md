---
layout: default
title: Fabric Composer - Business Network
category: concepts
sidebar: sidebars/concepts.md
excerpt: Business Network
---

# Business Network

---

A `Business Network` describes the structures and processes that exist in the exchange of assets between participants in economic networks. Fabric Composer helps you to easily develop applications for business networks, to digitize these networks - making them more efficient.

There are many elements in a business network; the most fundamental of which are participants, assets, registries and transactions.  We're going to start by explaining these so that you get a feeling for this most important concepts.  We'll then reinforce these slightly abstract concepts with a concrete example involving a digital property network.

* Participants.  These are the actors in the business network.  A participant might be an individual or an organization.  A participant has an one of more attributes that are used to identify them to the business network.

* Assets. Assets are created by participants, and subsequently exchanged between them.  Assets can have a rich lifecycle, as defined by the transaction in which they are involved.

* Registries. A registry is a collection of assets for a particular purpose.  As assets move through their lifecycle, they move through different registries. Assets can be in more than one registry at the same time.

* Transactions. These are operations that are performed on assets and other resources as they move through their lifecycle within the business network.

We're going to learn lots more about what's possible within digital business networks, but let's start with a simple example.

## An example of a Business Network

Imagine a property network, comprising participants who want to buy and sell property, estate agents (realtors) who provide matching services between buyers and sellers, conveyancers who exchange legal contracts related to the buying and selling of property, and government land registries who record the ongoing ownership of property.  

Here are the key elements of this property network.

* Participants. Buyers, sellers, estate agents (realtors), conveyancers and the government land registry are the people and organizations who participate in this network.

* Assets. Property is the asset that is exchanged and between buyers and sellers in the property network. Property is advertised by estate agents (realtors), exchanged by conveyancers, and recorded by land registries. Property has a fairly rich lifecycle, in that it can be created, exchanged, modified and destroyed.

* Registries.  Clearly the Land Registry record of properties is an obvious registry in this network, but there are others.  The estate agent (realtor) has a set of properties for sale by registered sellers and interested buyers, and probably a separate record of the deals between buyers and sellers that are in-flight at a given moment in time.  Conveyancers probably have a registry of properties in the process of being legally exchanged between buyers and sellers.  Assets will be updated within these registries as they are exchanged between buyers and sellers.

* Transactions. There are many transactions going on in this property network. Sellers sell property and buyers buy them.  Conveyancers create and exchange legal contracts with other conveyancers on behalf of buyers and sellers and their respective property sales.  The Land Registry records updates to property ownership, and estate agents (realtors) indicate that properties are for sale in a market and remove them from that market once they have been sold.

Fabric Composer makes it easy to create these elements in a business network, and the applications which capture interactions between different participants.  

## Related Concepts

[Business Network Definition]({{site.baseurl}}/concepts/businessnetworkdefinition.html)

## Related Tasks

[Deploying a business network](../tasks/deploybusinessnetwork.md)

## Related Reference

[Network deploy command](../reference/composer.network.deploy.md)
