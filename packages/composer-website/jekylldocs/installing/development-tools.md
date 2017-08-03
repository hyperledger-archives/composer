---
layout: default
title: Installing a development environment
category: start
section: installing
sidebar: sidebars/accordion-toc0.md
excerpt: To install the command line and development tools, along with a local instance of Hyperledger Fabric click [**Install Development Tools**](../installing/development-tools.html) here or in the table of contents on the left.
index-order: 203
---

# Installing and developing with {{site.data.conrefs.composer_full}}

Follow the instructions below to get the required {{site.data.conrefs.composer_full}} development tools and stand up a {{site.data.conrefs.hlf_full}}.

There are two version of {{site.data.conrefs.hlf_full}}: v0.6 and v1.0. The default is for v1.0 and we suggest this is the one you use.

## Before you begin

The following are prerequisites for installing the required development tools:

```
Operating Systems: Ubuntu Linux 14.04 / 16.04 LTS (both 64-bit), or Mac OS 10.12
Docker Engine: Version 17.03 or higher
Docker-Compose: Version 1.8 or higher
Node: 6.x (note version 7 is not supported)
npm: v3.x or v5.v
git: 2.9.x
Python: 2.7.x
A code editor of your choice, we recommend VSCode.
```

**Please do not install Composer as a superuser - or use 'sudo' or the 'root' user, if on Linux (doing will cause issues with the install). Composer should be installed as non-privileged user.**

If you're running on Ubuntu, you can download the prerequisites using the following commands:

```bash
curl -O https://hyperledger.github.io/composer/prereqs-ubuntu.sh

chmod u+x prereqs-ubuntu.sh
```

Next run the script - as this briefly uses sudo during its execution, you will be prompted for your password.

```
./prereqs-ubuntu.sh
```
---

## Step 1: Installing {{site.data.conrefs.composer_full}} development tools

The development tools you'll need can all be installed (as a non-privileged user eg non-root) with `npm install -g`.

1. To install `composer-cli` run the following command:

        npm install -g composer-cli
    The `composer-cli` contains all the command line operations for developing business networks.

2. To install `generator-hyperledger-composer` run the following command:

        npm install -g generator-hyperledger-composer
    The `generator-hyperledger-composer` is a Yeoman plugin that creates bespoke applications for your business network.

3. To install `composer-rest-server` run the following command:

        npm install -g composer-rest-server
    The `composer-rest-server` uses the Hyperledger Composer LoopBack Connector to connect to a business network, extract the models and then present a page containing the REST APIs that have been generated for the model.

4. To install `Yeoman` run the following command:

        npm install -g yo
    Yeoman is a tool for generating applications. When combined with the `generator-hyperledger-composer` component, it can interpret business networks and generate applications based on them.

### Optional development tools

1. If you use VSCode, install the {{site.data.conrefs.composer_full}} VSCode plugin from the VSCode marketplace.

2. If you want to run the Playground locally, install the `composer-playground` using the following command.

        npm install -g composer-playground


## Step 2: Starting {{site.data.conrefs.hlf_full}}

If you've [installed the {{site.data.conrefs.composer_full}} Playground locally](../installing/using-playground-locally.html) you'll need to close the containers by using the following scripts.

>_Please note: These commands will kill and remove all running containers, and should remove all previously created {{site.data.conrefs.hlf_full}} chaincode images._

```
docker kill $(docker ps -q)
docker rm $(docker ps -aq)
docker rmi $(docker images dev-* -q)
```


1. In a directory of your choice (will assume `~/fabric-tools`) get the zip file that contains the tools

        mkdir ~/fabric-tools && cd ~/fabric-tools

        curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.zip
        unzip fabric-dev-servers.zip

    A `tar.gz` file is also available

        mkdir ~/fabric-tools && cd ~/fabric-tools
        curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.tar.gz

        tar xvzf fabric-dev-servers.tar.gz

2. Choose which version of Fabric to use.  {{site.data.conrefs.hlf_full}} v1.0 is highly recommended and the default. If for some reason v0.6 needs to be installed, you can set it explicitly as follows: export FABRIC_VERSION=hlfv0.6

    > **Please Note:** {{site.data.conrefs.composer_full}} users should not use {{site.data.conrefs.fabric_full}} v0.6.  It is deprecated, and everybody should now use v1.0.

    To 'unset' a v0.6 export, or to be explicit in using v1 Fabric, use this command

        export FABRIC_VERSION=hlfv1

3. If this is the first time, you'll need to download the fabric first. If you have already downloaded then first start the fabric, and create a Composer profile. After that you can then choose to stop the fabric, and start it again later. Alternatively to completely clean up you can teardown the Fabric and the Composer profile.

    All the scripts will be in the directory `~/fabric-tools`  A typical sequence for Hyperledger Composer use would be

        cd ~/fabric-tools
        ./downloadFabric.sh
        ./startFabric.sh
        ./createComposerProfile.sh

    Then at the end of your development session

        cd ~/fabric-tools
        ./stopFabric.sh
        ./teardownFabric.sh

*If you want to swap between v0.6 and v1.0, ensure you first issue a `teardownFabric.sh` command on your original version.*

> Please note: The development environment created will include a `PeerAdmin` identity including the cryptographic material necessary for deploying business networks. This identity has no enrollment secret. Any enrollment secret supplied when deploying a business network will be accepted.


## Script details

![](../assets/img/developer-tools-commands.png).

This diagram explains the order in which the scripts can be run. The version will default to {{site.data.conrefs.hlf_full}} v1.0 if the version command is not run.

**Downloading Fabric**

Issue from the `fabric-tools` directory
```
./downloadFabric.sh
```

**Starting Fabric**

Issue  from the `fabric-tools` directory
```
./startFabric.sh
```

**Stop Fabric**

Issue from the `fabric-tools` directory
```
./stopFabric.sh
```

**Create Composer Profile**

Issue from the `fabric-tools` directory
```
./createComposerProfile.sh
```

Note: this create a {{site.data.conrefs.composer_full}} profile specifically to connect to the development fabric you've already started.

**Teardown Fabric**

Issue from the `fabric-tools` directory
```
./teardownFabric.sh
```

---

<!--0. Make sure you've started Fabric as in Step 1 above. For example, If this is your first time for exaple:

        $ cd ~/fabric-tools
        $ ./downloadFabric.sh
        $ ./startFabric.sh
        $ ./createComposerProfile.sh

1. Clone the sample application into a directory of your choice - BUT not the same directory as in Step 1. (Assume `~/github`)

        $ mkdir ~/github && cd ~/github
        $ git clone https://github.com/hyperledger/composer-sample-applications
        $ cd composer-sample-applications
        $ npm install
  To see a summary of all the sample applications, there's a simple command that will show summary details of the applications
  A useful information node.js script has been created to show the available sample applications

        $ node ~/github/composer-sample-applications/info.js

2. When you started fabric you will have chosen which version to use.  If you have chosen Fabirc v0.6 you will need to suffix the targets in the npm commands below with `:hlfv06`. Both examples are given below - do not issue both commands!

    _Note: this does not change the application source code or the model, purely the name of the Composer profile to use, and the Fabric's admin indentity_

3. Deploy the business network

        $ cd packages/digitalproperty-app
        $ npm run deployNetwork
        $ npm run deployNetwork:hlfv0.6     # if you want to use v0.6

5. Run the sample application

        $ npm test
        $ npm test:hlfv0.6     # if you want to use v0.6
-->

## What next?

* Begin [**writing a business network definition**](../business-network/business-network-index.html).
* If you're looking for a tutorial on using the developer tools, see the [**developer guide**](../tutorials/developer-guide.html) to run through a sample with the developer tools.
