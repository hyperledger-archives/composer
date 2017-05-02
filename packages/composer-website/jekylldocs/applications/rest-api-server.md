---
layout: default
title: Task - Generating a REST API Server
category: tasks
sidebar: sidebars/applications.md
excerpt: How to generate a REST API Server for a Business Network
---

# How Generate a REST API Server for a Business Network

---
The easiest way to setup a REST API Server that works with a published Business Network is to use the composer-rest-server package.
Once installed this can be run from the command line in an interactive mode or a non-interactive mode.

---

# Prerequesites

---
Along with the details of the business network and the connection profile that you will use to connect to it, you will also need to have the following
prerequesite software installed on your system.

*node.js*: v6.9.5

Node comes with the *npm* package manager preinstalled and so once you have node installed you can install the composer-rest-server package using

```bash
npm install -g composer-rest-server
```

You may need to use *sudo* with the command above to gain permission to install.


---

# Running the Server

---

## Interactive Mode

Once installed, you can start the composer-rest-server using:

```bash
composer-rest-server
```

You will then be asked to enter a few simple details about your business network.

```bash
  _____           _              _                   ____                                                         
 |  ___|   __ _  | |__    _ __  (_)   ___           / ___|   ___    _ __ ___    _ __     ___    ___    ___   _ __
 | |_     / _` | | '_ \  | '__| | |  / __|  _____  | |      / _ \  | '_ ` _ \  | '_ \   / _ \  / __|  / _ \ | '__|
 |  _|   | (_| | | |_) | | |    | | | (__  |_____| | |___  | (_) | | | | | | | | |_) | | (_) | \__ \ |  __/ | |   
 |_|      \__,_| |_.__/  |_|    |_|  \___|          \____|  \___/  |_| |_| |_| | .__/   \___/  |___/  \___| |_|   
                                                                               |_|                                
? Enter your Fabric Connection Profile Name: defaultProfile
? Enter your Business Network Identifier : digitalproperty-network
? Enter your Fabric username : WebAppAdmin
? Enter your secret: DJY27pEnl16d
WARNING: No configurations found in configuration directory:/Users/samsmith/Projects/BlockChain/Composer/fabric-composer/packages/composer-rest-server/config
WARNING: To disable this warning set SUPPRESS_NO_CONFIG_WARNING in the environment.
Loopback Connector for Hyperledger Composer
Models Loaded Now
Browse your REST API at http://0.0.0.0:3000/explorer
```

## Non-Interactive Mode

Alternatively you can run the server specifying all the parameters on the command line
```bash
$ composer-rest-server -c car-sample -b org.acme.biznet -i WebAppAdmin -p DJY27pEnl16d
Loopback Connector for Hyperledger Composer
Models Loaded Now
Browse your REST API at http://0.0.0.0:3000/explorer
```

## Looking at the generated APIs

Launch your browser and go to the URL given (http://0.0.0.0:3000/explorer)

You will be able to inspect and execute the APIs that are generated from the Business Network.


## Debug

If you should encounter any issues when using the composer-rest-server then you can use the following environment variable to enable extra trace information.

```bash
export DEBUG=loopback:connector:businessnetworkconnector*
```

## Changing the port of the server
You can change the port of the server hosting the API by editing the file:
```bash
<GLOBAL NPM MODULE PATH/composer-rest-server/server/config.json
```
