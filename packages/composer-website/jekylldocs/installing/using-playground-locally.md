---
layout: default
title: Installing the Playground locally
category: start
sidebar: sidebars/accordion-toc0.md
section: installing
excerpt: To run the Playground locally with a local instance of Hyperledger Fabric, click [**Install Local Playground**](../installing/using-playground-locally.html) here or in the table of contents on the left.
index-order: 202
---

# Installing and running {{site.data.conrefs.composer_full}} Playground locally

This tutorial will take you through how to install and run the {{site.data.conrefs.composer_full}} Playground on your local machine. It also creates an instance of {{site.data.conrefs.hlf_full}} v1.0.

{{site.data.conrefs.composer_full}} Playground can also be used in a "browser only" mode, without a running instance of {{site.data.conrefs.hlf_full}}. When used in this mode, all the functionality of {{site.data.conrefs.composer_full}} Playground is available, but all of the data (business networks, assets, participants, and transactions) is persisted into browser local storage.

## Before you begin

In order to install {{site.data.conrefs.composer_full}} Playground, you need the following software installed:

* Docker Engine 17.03 or greater
* Docker Compose 1.8 or greater

*Please note:* If you've previously used {{site.data.conrefs.composer_full}} Playground locally or {{site.data.conrefs.hlf_full}} and wish to clear everything and start again, the following commands will delete any running containers and delete all downloaded images, (be careful if you're using other Docker images on your machine):

```
docker ps -aq | xargs docker rm -f
docker images -aq | xargs docker rmi -f
```
---


## Creating the containers and installing playground locally

1. Pick a directory that you want to install into, then run the following command to download and start a {{site.data.conrefs.hlf_full}} instance and {{site.data.conrefs.composer_full}} Playground:

        curl -sSL https://hyperledger.github.io/composer/install-hlfv1.sh | bash

2. Access your local {{site.data.conrefs.composer_full}} Playground by clicking this link: <a href="http://localhost:8080" target="blank">http://<span></span>localhost:8080</a>. *Please note*: Private browsing is not supported when running the Playground locally.


## Deploying business networks to {{site.data.conrefs.hlf_full}} v1.0

In {{site.data.conrefs.hlf_full}} v1.0 peers now enforce the concepts of admins and members. Admin user's identities and crypto material must be available to the peer at deployment. To make that identity and its crypto material available, your must import it to your local `keyValStore` directory before deploying the business network. To import the identity, use the [`composer identity import` command](../reference/composer.identity.import.html). When importing an identity, you do not assign it a secret, however the `composer network deploy` command requires a secret. If you are using an imported identity, you can enter any value for the secret.

When connecting to the peer you must use an identity (certificate) where the Common Name (CN) contains the text `admin`, for example, `PeerAdmin`, `myadmin`, `Admin` or `AdminPeer` are all valid Common Names. Peers in different organizations may have different admin users. Only an admin user of peer's organization will be able to deploy a business network to their peers.

Due to many breaking API changes between {{site.data.conrefs.hlf_full}} v1.0 alpha 1 and {{site.data.conrefs.hlf_full}} v1.0, {{site.data.conrefs.composer_full}} only supports {{site.data.conrefs.hlf_full}} v1.0 and cannot support older versions of {{site.data.conrefs.hlf_full}} v1.0 (e.g. alpha 1).

### Deploying business networks using Playground locally

When deploying a business network to {{site.data.conrefs.hlf_full}} v1.0 using the Playground locally, you must follow the process above to connect using the peer admin identity. However, in order to create identities and interact with your business network in the Playground, you must use the certificate authority admin identity.


---
<!--
<a name="installationoptions"></a>

## Alternative installation options

If you have an existing Hyperledger Fabric instance you want to use with {{site.data.conrefs.composer_full}} Playground, then you can install the playground without installing another Hyperledger Fabric instance. The playground can then be configured to connect to your existing Hyperledger Fabric instance by creating a connection profile with the required connection settings.

There are two options for installing the {{site.data.conrefs.composer_full}} Playground.
You can choose to install using npm (the Node.js package manager), or you can choose to install with Docker. We recommend that you:

*   <a href="#installnpm">Install using npm</a> if you wish to run to {{site.data.conrefs.composer_full}} Playground on your local workstation.
*   <a href="#installdocker">Install using Docker</a> if you wish to run {{site.data.conrefs.composer_full}} Playground on a server or cloud platform.

**why, what does each do differently?**

Note that the same set of features is available regardless of the installation method that you choose.

## <a name="installnpm"></a>Installing with npm

### Prerequisites

In order to install {{site.data.conrefs.composer_full}} Playground with npm, you need the following software installed:

*   Node.js v6.x (note that Node.js v7.x is unsupported)
*   npm v3.x or greater

### Installation

You can install {{site.data.conrefs.composer_full}} Playground by running the following command in your terminal or command prompt:

  ```
  npm install -g composer-playground
  ```

You should see the following output in your terminal or command prompt:

  ```
  npm install -g composer-playground
  ...
  /usr/local/bin/composer-playground -> /usr/local/lib/node_modules/composer-playground/cli.js
  /usr/local/lib/node_modules
  └─┬ composer-playground@0.4.3
  ...
  ```

Verify that no errors occurred. If any part of this process fails, then {{site.data.conrefs.composer_full}} Playground will fail to work correctly. You may see errors from a program called `node-gyp`. These errors indicate that your system is not set up correctly to build Node.js C/C++ native modules. You may need to install additional software to correct this error.

You can then start {{site.data.conrefs.composer_full}} Playground by running the following command in your terminal or command prompt:

  ```
  composer-playground
  ```

A web browser will be automatically opened once the playground has started, but should that not happen you should be able to access {{site.data.conrefs.composer_full}} Playground by clicking on this link: <a href="http://localhost:8080" target="_blank">http://<span></span>localhost:8080</a>

---

## <a name="installdocker"></a>Installing with Docker

### Prerequisites

In order to install {{site.data.conrefs.composer_full}} Playground with Docker, you need the following software installed:

*   Docker Engine 1.12.3 or greater

### Installation

You can install {{site.data.conrefs.composer_full}} Playground by running the following Docker command in your terminal or command prompt:

  ```
  docker run -d -p 8080:8080 hyperledger/composer-playground
  ```

You should see the following output in your terminal or command prompt:

  ```
  $ docker run -d -p 8080:8080 hyperledger/composer-playground
  afd1baff0487de5c69626b8baea69c702744f92813043e3d2b0ef786c7f77517
  ```

Verify that no errors occurred.

You can then start {{site.data.conrefs.composer_full}} Playground by clicking on this link: <a href="http://localhost:8080" target="_blank">http://<span></span>localhost:8080</a>

---
-->

## What's next?

* Take a tutorial on using Playground, and try [our Playground tutorial](../tutorials/playground-guide.html).
