---
layout: default
title: Generating a REST API
category: start
section: integrating
index-order: 701
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer includes a standalone [**Node.js process that exposes a business network as a REST API**](./getting-started-rest-api.html). The LoopBack framework is used to generate an Open API, described by a Swagger document.
---

# Generating a REST API


## Installing the REST server

The {{site.data.conrefs.composer_full}} REST server can be installed either using npm or Docker.

To install with npm, run the following command:

    npm install -g composer-rest-server

To install the REST server using Docker see [deploying the REST server](./deploying-the-rest-server.html).

## Running the REST server

{{site.data.conrefs.composer_full}} includes a standalone Node.js process that exposes a business network as a REST API. The LoopBack framework is used to generate an Open API, described by a Swagger document.

To launch the REST Server simply type:

```
composer-rest-server
```

You will then be asked to enter a few simple details about your business network. An example of consuming a deployed business network is shown below.

```
? Enter the name of the business network card to use: admin@basic-sample-network
? Specify if you want namespaces in the generated REST API: always use namespaces
? Specify if you want to enable authentication for the REST API using Passport: No
? Specify if you want to enable event publication over WebSockets: Yes
? Specify if you want to enable TLS security for the REST API: No

To restart the REST server using the same options, issue the following command:
   composer-rest-server -c admin@basic-sample-network -n always -w true

Discovering types from business network definition ...
Discovered types from business network definition
Generating schemas for all types in business network definition ...
Generated schemas for all types in business network definition
Adding schemas for all types to Loopback ...
Added schemas for all types to Loopback
Web server listening at: http://localhost:3000
Browse your REST API at http://localhost:3000/explorer
```

#### The `composer-rest-server` command

The `composer-rest-server` command has a number of options used to define security and authentication:

```
Options:
  -c, --card            The name of the business network card to use  [string]
  -n, --namespaces      Use namespaces if conflicting types exist  [string] [choices: "always", "required", "never"] [default: "always"]
  -p, --port            The port to serve the REST API on  [number]
  -a, --authentication  Enable authentication for the REST API using Passport  [boolean] [default: false]
  -m, --multiuser       Enable multiple user and identity management using wallets (implies -a)  [boolean] [default: false]
  -w, --websockets      Enable event publication over WebSockets  [boolean] [default: true]
  -t, --tls             Enable TLS security for the REST API  [boolean] [default: false]
  -e, --tlscert         File containing the TLS certificate  [string] [default: "/usr/local/lib/node_modules/composer-rest-server/cert.pem"]
  -k, --tlskey          File containing the TLS private key  [string] [default: "/usr/local/lib/node_modules/composer-rest-server/key.pem"]
  -h, --help            Show help  [boolean]
  -v, --version         Show version number  [boolean]
```

#### Looking at the generated APIs

Launch your browser and go to the URL given (http://0.0.0.0:3000/explorer).  You'll see a screen similar to this.

![LoopBack-1](../assets/img/tutorials/developer/lb_explorer.png)

## Updating the REST server

After updating a business network definition, the REST server can be updated to generate new APIs reflecting the updates to the business network definition.

To update the REST server, first the REST server must be stopped using `ctrl-C`. Then the REST server can be restarted using `composer-rest-server`.

# Summary
Using the Loopback framework on top of the {{site.data.conrefs.composer_full}} runtime has allowed us to generate a business domain specific REST API based on the deployed business network model!
