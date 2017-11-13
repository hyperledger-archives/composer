---
layout: default
title: API Reference
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: APIs
index-order: 1200
---

# Hyperledger Composer API
Hyperledger Composer  is an application development framework for building Blockchain applications based on Hyperledger. This is the JavaScript documentation for the Hyperledger Composer Client, Admin, and Runtime JavaScript APIs.

The [original JSDoc format](../jsdoc/index.html) can still be found temporarily, whilst the new format is refinded. Please do send us your feedback.

## Overview
All the classes are listed in the [Class Index](./allData.html)

The major components of Hyperledger Composer are:

1. The Hyperledger Composer language for describing the structure of resources (assets, participants
and transactions) that participate in a blockchain backed business network.
2. JavaScript APIs to query, create, update and delete resources and submit transactions
 from client applications. Hyperledger Composer resources are stored on the Blockchain.
3. JavaScript transaction processor functions that runs on Hyperledger Fabric when transactions are
submitted for processing. These functions may update the state of resources
stored on the Blockchain via server-side Hyperledger Composer APIs.