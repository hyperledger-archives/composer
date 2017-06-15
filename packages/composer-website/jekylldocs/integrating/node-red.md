---
layout: default
title: Integrating with Node-RED
category: integrating
section: integrating
sidebar: sidebars/integrating.md
excerpt: Deploying the REST server for a business network
---

# Integrating with Node-RED

[Node-RED](http://nodered.org) is a lightweight Open Source integration technology, written in JavaScript. It uses a graphical flow to integrate different _nodes_, where nodes can receive data, transform data and output data.

Node-RED is commonly used to rapidly prototype Internet of Things style applications, or to wire existing Internet services together.
You can use the {{site.data.conrefs.composer_full}} Node-RED contribution to:
- Submit transactions
- Read and update assets and participants
- Subscribe to events

_Note: delete operations on assets and participants are not yet supported._

The {{site.data.conrefs.composer_full}} Node-RED nodes are distributed as a standalone npm package, published here:
- https://www.npmjs.com/package/node-red-contrib-hyperledger-composer
