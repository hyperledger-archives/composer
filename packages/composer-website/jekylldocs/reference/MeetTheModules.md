---
layout: default
title: Hyperledger Composer npm Modules
section: reference
sidebar: sidebars/accordion-toc0.md
index-order: 1001
excerpt: "[**Hyperledger Composer contains a number of npm modules**](./MeetTheModules.html) which provide the APIs and command line tools necessary for developing a solution with Hyperledger Composer."
---

# {{site.data.conrefs.composer_full}} npm Modules

---

{{site.data.conrefs.composer_full}} has 3 main modules for application developers. If you are writing an application this is your entry point.

1. `composer-client`

2. `composer-admin`

3. `composer-cli`

`composer-client` and `composer-admin` are the two modules that provide APIs for applications. node.js applications should only use APIs that come from these modules. If there are other APIs that are need please contact us.

Details of all the APIs have been documented in JSDocs (see reference).

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
If you wish however you can instgall this as a local dependancy, but you could need to access the cli.js node class directly rather than used the `composer` command.
