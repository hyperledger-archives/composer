---
layout: default
title: Installing the Playground locally
category: start
sidebar: sidebars/accordion-toc0.md
section: installing
excerpt: To run the Playground locally with a local instance of Hyperledger Fabric, click [**Install Local Playground**](../installing/using-playground-locally.html) here or in the table of contents on the left.
index-order: 203
---

# Installing and running {{site.data.conrefs.composer_full}} Playground locally

This tutorial will take you through how to install and run the {{site.data.conrefs.composer_full}} Playground on your local machine. It also creates an instance of {{site.data.conrefs.hlf_full}} v1.0.

{{site.data.conrefs.composer_full}} Playground can also be used in a "browser only" mode, without a running instance of {{site.data.conrefs.hlf_full}}. When used in this mode, all the functionality of {{site.data.conrefs.composer_full}} Playground is available, but all of the data (business networks, assets, participants, and transactions) is persisted into browser local storage.

## Before you begin

In order to install {{site.data.conrefs.composer_full}} Playground, you need the following software installed:

- Operating Systems: Ubuntu Linux 14.04 / 16.04 LTS (both 64-bit), or Mac OS 10.12
- Docker Engine 17.03 or greater
- Docker Compose 1.8 or greater

*Please note:* If you've previously used {{site.data.conrefs.composer_full}} Playground locally or {{site.data.conrefs.hlf_full}} and wish to clear everything and start again, the following commands will delete any running containers and delete all downloaded images, (be careful if you're using other Docker images on your machine):

```
docker ps -aq | xargs docker rm -f
docker images -aq | xargs docker rmi -f
```

To run {{site.data.conrefs.composer_full}} and {{site.data.conrefs.hlf_full}}, we recommend you have at least 4Gb of memory.

---


## Creating the containers and installing playground locally

1. Pick a directory that you want to install into, then run the following command to download and start a {{site.data.conrefs.hlf_full}} instance and {{site.data.conrefs.composer_full}} Playground:

        curl -sSL https://hyperledger.github.io/composer/install-hlfv1.sh | bash

2. Access your local {{site.data.conrefs.composer_full}} Playground by clicking this link: <a href="http://localhost:8080" target="blank">http://<span></span>localhost:8080</a>. *Please note*: Private browsing is not supported when running the Playground locally.

---

## What's next?

* Take a tutorial on using Playground, and try [our Playground tutorial](../tutorials/playground-guide.html).
