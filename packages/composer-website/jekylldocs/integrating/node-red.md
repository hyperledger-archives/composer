---
layout: default
title: Integrating with Node-RED
category: integrating
section: integrating
index-order: 707
sidebar: sidebars/accordion-toc0.md
excerpt: "[Node-RED](http://nodered.org) includes a number of [**Hyperledger Composer _nodes_ allowing you to submit transactions, read, update and delete assets and participants, and subscribe to events.**](./node-red.html)"
---

# Integrating with Node-RED

[Node-RED](http://nodered.org) is a lightweight Open Source integration technology, written in JavaScript. It uses a graphical flow to integrate different _nodes_, where nodes can receive data, transform data and output data.

Node-RED is commonly used to rapidly prototype Internet of Things style applications, or to wire existing Internet services together.

You can use the {{site.data.conrefs.composer_full}} Node-RED contribution to:

- Submit transactions
- Read and update assets and participants
- Subscribe to events
- Delete assets and participants

The {{site.data.conrefs.composer_full}} Node-RED nodes are distributed as a standalone npm package, published here:
- https://www.npmjs.com/package/node-red-contrib-composer

## {{site.data.conrefs.composer_full}} Node-RED Nodes

#### Hyperledger-Composer-out

A node red output node that allows you to create, update or delete assets or participants and submit transactions. For example, combining the _hyperledger-composer-out_ node with an _inject_ node allows you to create participants by submitting JSON definitions of those participants.

####  Hyperledger-Composer-Mid

A node red mid flow node that allows you to create, retrieve, update, or delete assets and participants from a registry. For example, combining _hyperledger-composer-mid_ with an _inject_ node allows you to retrieve assets or participants by submitting the correct registry and identifying field as a JSON object.

#### Hyperledger-Composer-In

A Node-RED input node that subscribes to events from a blockchain.
