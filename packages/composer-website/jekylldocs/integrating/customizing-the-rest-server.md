---
layout: default
title: Customizing the REST server for a business network
category: start
section: integrating
index-order: 707
sidebar: sidebars/accordion-toc0.md
excerpt: By customizing a REST server for a business network, you can add your own code to implement new custom REST APIs for your business applications or additional authentication mechanisms that are not supported by the standard REST server,
---

# Customizing the REST server for a business network

---

By default, the {{site.data.conrefs.composer_full}} REST server includes functionality that generates a set of RESTful APIs for all of the assets, participants, and transactions within a deployed business network.

The {{site.data.conrefs.composer_full}} REST server also includes functionality for the following features:

* [Publishing events](./publishing-events.md) using WebSockets.
* [Enabling authentication](./enabling-rest-authentication.md) using the open source Passport authentication middleware.
* [Enabling multiple user mode](./enabling-multiuser.md) so authenticated users can supply their own blockchain credentials.
* [Enabling HTTPS and TLS](./securing-the-rest-server.md) for secure client-server communications.

These features are all designed to be general purpose and easy to use out of the box. The {{site.data.conrefs.composer_full}} REST server is distributed as an application called `composer-rest-server`, which can be installed using either npm or Docker, and includes all of these features.

However, these features may not meet all of the requirements of all users. For example, a user of the {{site.data.conrefs.composer_full}} REST server may wish to use a different form of authentication middleware, instead of using Passport.

As an alternative to using the {{site.data.conrefs.composer_full}} REST server application `composer-rest-server`, you can generate a LoopBack application on disk that is equivalent in functionality. By editing the code in this generated LoopBack application, you can customize the REST server to meet all of your requirements.

### Generating a LoopBack application

You can use the Yeoman generator to generate a LoopBack application. Before running the Yeoman generator, you must have deployed a business network, and you must have a business network card that can be used to access that business network.

In the example below, we have deployed the `tutorial-network` business network, and we can use the business network card `admin@tutorial-network` to connect to that business network.

Run the Yeoman generator by issuing the following command in a terminal:

    yo hyperledger-composer

The Yeoman generator will ask a series of questions before generating the LoopBack application. Ensure that you pick `LoopBack` as the project type, and specify the correct name for the business network card instead of that shown in the example below:

    Welcome to the Hyperledger Composer project generator
    ? Please select the type of project: LoopBack
    You can run this generator using: 'yo hyperledger-composer:loopback'
    Welcome to the Hyperledger Composer LoopBack project generator
    ? Do you want to connect to a running Business Network? Yes
    ? Project name: my-loopback-app
    ? Description: Hyperledger Composer LoopBack project
    ? Author name: Simon Stone
    ? Author email: simon@congaverse.com
    ? License: Apache-2.0
    ? Name of the Business Network card: admin@tutorial-network

If successful, the Yeoman generator will create an application in a sub directory of the current working directory named after the specified `Project name`. In the example above, the sub directory would be called `my-loopback-app`.

You can start the generated application by entering the sub directory, and running the following command:

    npm start

The generated application will give you a URL that you can use to interact with the RESTful APIs:

    > my-loopback-app@1.0.0 start /private/tmp/my-loopback-app
    > node .

    Web server listening at: http://localhost:3000
    Browse your REST API at http://localhost:3000/explorer

### Customizing the LoopBack application

The generated LoopBack application is a standard LoopBack application. It contains a set of LoopBack model files, one for each modelled type in the business network, under the subdirectory `common/models`. Each model file is comprised of a JSON file (e.g. `Commodity.json`) and a JavaScript file (e.g. `Commodity.js`).  There are also LoopBack model files for generic business network RESTful APIs, such as the `/system/ping` API.

The generated LoopBack application includes a single data source named `composer` that uses the LoopBack connector for {{site.data.conrefs.composer_full}}, `loopback-connector-composer`. The data source configuration, in the file `server/datasources.json`, includes the name of the business network card; if you change the name of the business network card, you must also change the data source configuration:

    {
        "composer": {
            "name": "composer",
            "connector": "loopback-connector-composer",
            "card": "admin@tutorial-network",
            "namespaces": false
        }
    }

The generated LoopBack application includes model configuration that binds all of the LoopBack model files to the data source named `composer`, and exposes them over RESTful APIs by setting the flag `public` to `true`. The model configuration, in the file `server/model-config.json`, can be edited to hide or disable the RESTful APIs for a particular modelled type:

    {
        ...
        "Commodity": {
            "dataSource": "composer",
            "public": true
        }
        ...
    }

For further information about the structure of a LoopBack application, including how to customize and add additional functionality to the application, read the LoopBack documentation. The generated LoopBack application uses Loopback v3.0, and the documentation for LoopBack v3.0 can be found here: https://loopback.io/doc/en/lb3/