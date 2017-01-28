---
layout: default
title: Concerto - Meet the Modules and Git Repos
category: reference
sidebar: sidebars/reference.md
excerpt: Concerto module info
---
# Meet the npm Modules

As part of the Concerto system we have 3 main modules for application developers. If you are writing an application this is your entry point.

1. `concerto-client`

2. `concerto-admin`

3. `concerto-cli`

`concerto-client` and `concerto-admin` are the two modules that provide APIs for applications. node.js applications should only use APIs that come from these modules. If there are other APIs that are need please contact us.

Details of all the APIs have been documented in JSDocs. Please go to the [JSDoc API Documentation](https://pages.github.ibm.com/Blockchain-WW-Labs/Concerto/jsdoc/develop/index.html)

## composer-client
This module would usually be installed as a local dependency of an application. It provides the API that is used by business applications to connect to a business network to access __assets__, __participants__ and submitting __transactions__. When in production this is only module that needs to be added as a direct dependency of the application.

```
npm install --save composer-client
```

## composer-admin
This module would usually be installed as a local dependency of **administrative** applications. This API permits the creation of and deployment of __business network definitions__.

```
npm install --save composer-admin
```

## composer-cli
This provides command line tools to provide the ability to deploy and managed business network definitions. This would normally be installed as a global module

```
npm install -g composer-cli
```
If you wish however you can instgall this as a local dependancy, but you could need to access the cli.js node class directly rather than used the `concerto` command.

# GIT repositories
If you want to know more about the implementation, or if you want to contribute to Concerto, then you'll need to be aware of the git repos that are used.
For information on how these are structured, how to build them and how to contribute, please review the README.md in the relavent repo. Best to start with the Concerto one.

1. Concerto-Docs
2. Concerto
3. Composer
3. GettingStarted
4. DigitalProperty-Network
5. DigitalProperty-Model

## Concerto-Docs
All the documentation for the main concerto website side (The gh-pages branch of concerto) are stored here. The travis build for this repo will also produce the jsdoc for the APIs

## Concerto
This is the main 'monorepo' that has all the code for the Concerto systems and produces all the npm modules. This uses the lerna tool to manage the monorepo.

## Composer
This is the Web UI for concerto

## Getting Started/DigitalProperty-Model/DigitalProperty-Model
This is a dedicated repo for the Getting Started tutorials of Concerto.
