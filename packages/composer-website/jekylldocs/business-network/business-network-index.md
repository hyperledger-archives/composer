---
layout: default
title: Developing Business Networks
category: concepts
section: business-network
index-order: 500
sidebar: sidebars/accordion-toc0.md
excerpt: Overview of Developing Business Networks
---

# Developing Business Networks

Developers use {{site.data.conrefs.composer_full}} to digitize business networks. The business network is accessed by multiple participants in the network, some of which may be responsible for the maintenance (hosting) of the network itself, referred to as maintainers of the network.

Typically each maintainer of the network will run several peer nodes (for crash fault tolerance) and {{site.data.conrefs.hlf_full}} replicates the distributed ledger across the set of peer nodes.

## Model

Developers work with business analysts to define the domain data model for the business network. The data model is expressed using the {{site.data.conrefs.composer_short}} Modeling Language and defines the structure of the resources that will be stored on the ledger, or processed as transactions.

Once the domain model is in place, developers can capture _smart contracts_ as executable transaction processor functions, written in JavaScript.

## Access Control

In parallel developers or technical analysts can define the access control rules for the business network, to enforce which participants have access to the data on the ledger and under which conditions.

## Deploy

Developers package the models, scripts and access control rules into a deployable _Business Network Archive_ and use command line tools to deploy the archive to a runtime for testing.

## Test

Like all business logic, it is important to create unit and system tests for business networks. Developers can use popular JavaScript testing frameworks such as Mocha and Chai to run unit tests (against the Node.js embedded runtime) or run system tests against a {{site.data.conrefs.hlf_full}}.

## Integrate

Once the business network is tested and in place, front-end applications need to be created. Use the {{site.data.conrefs.hlf_short}} REST Server to automatically generate a REST API for a business network, and then a skeleton generate Angular application using the Yeoman code generator.

The REST Server can be configured to authenticate the participants in the business network, ensuring that credentials and permissions are enforced.

---

# References

* [**Modeling Language**](../reference/cto_language.html)
* [**Access Control Language**](../reference/acl_language.html)
* [**Transaction Processor Functions**](../reference/js_scripts.html)
