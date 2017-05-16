---
layout: default
title: Installing and running the Hyperledger Composer Playground
category: start
sidebar: sidebars/tutorials.md
excerpt: Installing and running the Hyperledger Composer Playground
---

# Installing and running the {{site.data.conrefs.composer_full}} Playground

This tutorial will take you through how to install and run the {{site.data.conrefs.composer_full}} Playground.

The {{site.data.conrefs.composer_full}} Playground is a web development experience that allows you to develop a business network definition, deploy that business network definition to a running instance of Hyperledger Fabric, and test the deployed business network by working with assets, participants, and transactions.

{{site.data.conrefs.composer_full}} Playground can also be used in a "browser only" mode, without a running instance of Hyperledger Fabric. When used in this mode, all the functionality of {{site.data.conrefs.composer_full}} Playground is available, but all of the data (business networks, assets, participants, and transactions) is persisted into browser local storage.

This tutorial will show you how to start a Hyperledger Fabric instance for use with {{site.data.conrefs.composer_full}} Playground by using Docker Compose. If you already have a running instance of Hyperledger Fabric, or you only want to work in "browser only" mode, then skip to [alternative installation options](#installationoptions).

**NOTE:** If you've previously used {{site.data.conrefs.composer_full}} Playground or Hyperledger Fabric, but wish to clear everything out and start again, the following commands will delete any running containers and delete all downloaded images (be careful if you're using other Docker images on your machine):

```
docker ps -aq | xargs docker rm -f
docker images -aq | xargs docker rmi -f
```

# Prerequisites

In order to install {{site.data.conrefs.composer_full}} Playground, you need the following software installed:

*   Docker Engine 1.12.3 or greater

    Test that Docker Engine is installed by running the following command in your terminal or command prompt:

    ```
      docker -v
    ```

    You should see the following output in your terminal or command prompt:

    ```
      $ docker -v
      Docker version 1.13.0, build 49bf474
    ```

    Verify that no errors occurred, and the version is greater than or equal to 1.12.3. If not, then follow the official instructions for installing Docker Engine: [Install Docker Engine] (https://docs.docker.com/engine/installation/)

*   Docker Compose 1.8 or greater

    Test that Docker Compose is installed by running the following command in your terminal or command prompt:

    ```
      docker-compose -v
    ```

    You should see the following output in your terminal or command prompt:

    ```
      $ docker-compose -v
      docker-compose version 1.10.0, build 4bd6f1a
    ```

    Verify that no errors occurred, and the version is greater than or equal to 1.8. If not, then follow the official instructions for installing Docker Compose: [Install Docker Compose](https://docs.docker.com/compose/install/)

# Installation

Download the example Docker Compose file:

  ```
  curl -O https://hyperledger.github.io/composer/tutorials/docker-compose.yml
  ```

(Alternatively, you can do this by right clicking this link and clicking on "Save Link As": <a href="./docker-compose.yml" download>docker-compose.yml</a>)

The Docker Compose file describes a multi-container application that is made up of three Docker containers:

*   Hyperledger Fabric peer, v0.6.1

    This container will use ports 7050 (HTTP), 7051 (gRPC), 7052 (gRPC), 7053 (gRPC, events)

*   Hyperledger Fabric membership services, v0.6.1

    This container will use ports 7054 (gRPC)

*   Composer Playground

    This container will use ports 8080

In a terminal or command prompt, navigate to the directory that you downloaded the `docker-compose.yml` file into, and run the following commands to start a Hyperledger Fabric instance and {{site.data.conrefs.composer_full}} Playground:

  ```
  docker pull hyperledger/fabric-baseimage:x86_64-0.1.0
  docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest
  docker-compose up -d
  ```

You should see the following output in your terminal or command prompt:

  ```
  $ docker pull hyperledger/fabric-baseimage:x86_64-0.1.0
  x86_64-0.1.0: Pulling from hyperledger/fabric-baseimage
  862a3e9af0ae: Already exists
  6498e51874bf: Already exists
  159ebdd1959b: Already exists
  0fdbedd3771a: Already exists
  7a1f7116d1e3: Already exists
  0620a24d487d: Pull complete
  b46385a2c430: Pull complete
  Digest: sha256:ac6a2784cfd028ae62f5688f4436f95d7a60eeacd8506eb303c9c6335328c388
  Status: Downloaded newer image for hyperledger/fabric-baseimage:x86_64-0.1.0
  $ docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest
  $ docker-compose up -d
  Creating start_membersrvc_1
  Creating start_vp0_1
  Creating start_composer_1
  ```

Verify that no errors occurred. If you see an error similar to the following error, then you may have an existing Hyperledger Fabric instance or other service running on any of the ports used by the Docker Compose file:

  ```
  ERROR: for membersrvc  Cannot start service membersrvc: driver failed programming external connectivity on endpoint start_membersrvc_1 (c99c05cca95c9bbcd75c0520bb2166cbf67fc660cd58924f095cdbecf4ad86da): Bind for 0.0.0.0:7054 failed: port is already allocated
  ```

If you see this error, ensure that all of these ports are free before you run any commands.

If everything started OK, you should be able to access {{site.data.conrefs.composer_full}} Playground by clicking on this link: <a href="http://localhost:8080" target="_blank">http://<span></span>localhost:8080</a>

# Connecting to Hyperledger Fabric

The Basic Sample Network is loaded into the UI by default - it's the "Hello World" of {{site.data.conrefs.composer_full}} samples.  The Web Browser Connection Profile is in use to start with, so any data you create by testing your model will be stored in browser memory.

The docker-compose command you ran also started a Hyperledger Fabric instance that you can activate to have {{site.data.conrefs.composer_full}} Playground connected to a blockchain instance.  To do so, head to the Connection Profiles panel of the UI (click the globe icon in the top-right) and activate the "hlfabric" Connection Profile.

---

>This tutorial is now **complete**. We plan on extending this tutorial with a guided tour of the playground and its features, so stay tuned!

---



# <a name="installationoptions"></a>Alternative installation options

If you have an existing Hyperledger Fabric instance you want to use with {{site.data.conrefs.composer_full}} Playground, then you can install the playground without installing another Hyperledger Fabric instance. The playground can then be configured to connect to your existing Hyperledger Fabric instance by creating a connection profile with the required connection settings.

There are two options for installing the {{site.data.conrefs.composer_full}} Playground.
You can choose to install using npm (the Node.js package manager), or you can choose to install with Docker. We recommend that you:

*   <a href="#installnpm">Install using npm</a> if you wish to run to {{site.data.conrefs.composer_full}} Playground on your local workstation.
*   <a href="#installdocker">Install using Docker</a> if you wish to run {{site.data.conrefs.composer_full}} Playground on a server or cloud platform.

<p></p>
Note that the same set of features is available regardless of the installation method that you choose.

## <a name="installnpm"></a>Installing with npm

### Prerequisites

In order to install {{site.data.conrefs.composer_full}} Playground with npm, you need the following software installed:

*   Node.js v4.6.2 or greater, or Node.js v6.x (note that Node.js v7.x is unsupported)

    Test that Node.js is installed by running the following command in your terminal or command prompt:

    ```
      node -v
    ```

    You should see the following output in your terminal or command prompt:

    ```
      $ node -v
     v4.6.2
    ```

    Verify that no errors occurred, and the version is greater than or equal to v4.6.2 or v6.x. If not, follow the official instructions for installing Node.js v6.x: [Node.js] (https://nodejs.org)

*   npm v3.x or greater

    Test that npm is installed by running the following command in your terminal or command prompt:

    ```
      npm -v
    ```

    You should see the following output in your terminal or command prompt:

    ```
      $ npm -v
     3.10.10
    ```

    Verify that no errors occurred, and the version is greater than or equal to v3.x. If not, upgrade npm to the latest version by running the following command in your terminal or command prompt:

    ```
      sudo npm -g upgrade npm
    ```

### Installation

You can install {{site.data.conrefs.composer_full}} Playground by running the following command in your terminal or command prompt:

  ```
  sudo npm install -g composer-playground
  ```

You should see the following output in your terminal or command prompt:

  ```
  $ sudo npm install -g composer-playground
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

>This tutorial is now **complete**. We plan on extending this tutorial with a guided tour of the playground and its features, so stay tuned!

---

## <a name="installdocker"></a>Installing with Docker

### Prerequisites

In order to install {{site.data.conrefs.composer_full}} Playground with Docker, you need the following software installed:

*   Docker Engine 1.12.3 or greater

    Test that Docker Engine is installed by running the following command in your terminal or command prompt:

    ```
      docker -v
    ```

    You should see the following output in your terminal or command prompt:

    ```
      $ docker -v
      Docker version 1.13.0, build 49bf474
    ```

    Verify that no errors occurred, and the version is greater than or equal to 1.12.3. If not, then follow the official instructions for installing Docker Engine: [Install Docker Engine] (https://docs.docker.com/engine/installation/)

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

>This tutorial is now **complete**. We plan on extending this tutorial with a guided tour of the playground and its features, so stay tuned!

---
