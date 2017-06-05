---
layout: default
title: Installing the Playground locally
category: start
sidebar: sidebars/getting-started.md
section: installing
excerpt: To run the Playground locally with a local instance of Hyperledger Fabric, click [**Install Local Playground**](../getting-started/using-playground-locally.html) here or in the table of contents on the left.
index-order: 2
---

# Installing and running {{site.data.conrefs.composer_full}} Playground locally

This tutorial will take you through how to install and run the {{site.data.conrefs.composer_full}} Playground on your local machine. It also creates an instance of {{site.data.conrefs.hlf_full}} v1.0-Alpha1.

{{site.data.conrefs.composer_full}} Playground can also be used in a "browser only" mode, without a running instance of {{site.data.conrefs.hlf_full}}. When used in this mode, all the functionality of {{site.data.conrefs.composer_full}} Playground is available, but all of the data (business networks, assets, participants, and transactions) is persisted into browser local storage.

---

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

2. Access your local {{site.data.conrefs.composer_full}} Playground by clicking this link: <a href="http://localhost:8080" target="blank">http://<span></span>localhost:8080</a>.

    By default, the Web Browser connection profile is in use (for developing and testing in browser memory).  To connect instead to the {{site.data.conrefs.hlf_full}} instance created in the previous step, click the globe icon in the top right of the UI to visit the Connection Profiles panel and change your active profile to 'hlfabric'.

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

* Take a tutorial on using Playground, and try [running a car auction with the Playground](../tutorials/playground-guide.html).
