---
layout: default
title: Task - Generating an Application
category: tasks
sidebar: sidebars/tasks.md
excerpt: How to generate a starter application
---

# How Generate a Starter Application

---

We're going to assume that you've been through the Getting Started section and would like to now start to look at writing your own application to use Fabric Composer.

To help getting started with this, there's a [Yeoman](http://yeoman.io/) generator that creates a suitable directory structure and helps bring in the required model and network modules.

## Yeoman

If you don't already have it, install Yeoman

```bash
npm install -g yo
```


If you wish to use the Angular2 Application Generator, then you will need a few other globally installed

```bash
npm install -g typings

npm install -g bower

npm install -g angular-cli
```


Then install the generator for it


```bash
npm install -g generator-fabric-composer
```


## Running the generator

```bash
yo fabric-composer
```

```
Welcome to the Fabric Composer Skeleton Application Generator
? Please select the type of Application: (Use arrow keys)
❯ CLI Application
  Angular2 Application
```

### What are the generator options?

### CLI Application

This generator can be ran using ```yo fabric-composer:cli```

#### What questions does this ask?

```
Welcome to the CLI skeleton app generator
? Your NPM library name: composer-sample-app
? Short description: Test Composer project
? Author name: Sophie Black
? Author email: sophie@ampretia.com
? NPM Module name of the Business Network to connect to: digitalproperty-network


? Is the name in NPM registry the same as the Business Network Identifier?: Yes
? What is the Connection Profile to use? defaultProfile
? Enrollment id: WebAppAdmin
? Enrollment Secret: DJY27pEnl16d
configuring: composer-sample-app
   create config/default.json
   create Dockerfile
   create gulpfile.js
   create index.js
   create package.json
   create scripts/docker-compose.yml
   create scripts/setup.sh
   create scripts/teardown.sh
   create .gitignore
```

#### What does this do?
Firstly it creates a standard npm module with the usual attributes of name, author, description.
Secondly it asks a set of Fabric Composer questions to help create the sample structure.

- NPM Module name:  What is the name of the business network you want to connect to - and is this the same as the modules NPM registry name
- Connection Profile:  This is the connection profile used to locate ip/ports etc of the running fabric
- The EnrollmentId/Secret: Are needed to create a connection to the fabric

#### Testing this has worked
The `index.js` file is a very simple application that lists the asset registries that have been defined.

---

### Angular2 Application

The user has the ability to generate an application in two different ways:

1. Generating the application by connecting to a running business network

2. Generating the application with a business network archive file

This generator can also be ran using ```yo fabric-composer:angular```

#### What questions does this ask?


**1. Generating the application by connecting to a running business network**

```
Welcome to the Angular2 skeleton app generator

? Do you want to connect to a running Business Network? Yes

? What is the name of the application you wish to generate?: angular-app
? Description of the application: Skeleton Fabric Composer Angular2 project
? Author name: Sophie Black
? Author email: sophie@ampretia.com
? What is the Business Network Identifier?: org.acme.biznet
? What is the Connection Profile to use? newProfile
? Enrollment id: WebAppAdmin
? Enrollment Secret: DJY27pEnl16d
Configuring: angular-app
About to connect to a running business network

...
```


**2. Generating the application with a business network archive file**

```
Welcome to the Angular2 skeleton app generator

? Do you want to connect to a running Business Network? No

? What is the name of the application you wish to generate?: angular-app
? Description of the application: Skeleton Fabric Composer Angular2 project
? Author name: Sophie Black
? Author email: sophie@ampretia.com
? What is the name of the business network archive file? (Path from the current working direc
tory): org.acme.biznet@0.0.2.bna
Configuring: angular-app
About to read a business network archive file
Reading file: org.acme.biznet@0.0.2.bna

...
```


#### What does this do?

**1. Generating the application by connecting to a running business network**

Firstly the generator will also a series of basic regarding the application name, author, description, etc.
Then it will ask the user to enter the details required to connect a running business network.
After the generator has stopped prompting the user to answer questions, it will then attempt to connect to the business network using the details provided.
If it successfully connects to the business network, the generator will then examine the assets, transactions and participants.
The generator will then create Angular components based upon the different modelled types.


**2. Generating the application with a business network archive file**

Firstly the generator will also a series of basic regarding the application name, author, description, etc.
Then it will ask the user to enter the relative path to a business network archive file.
After the generator has stopped prompting the user to answer questions, it will then attempt to read the business network archive file provided.
If it successfully reads the file, the generator will then examine the assets, transactions and participants.
The generator will then create Angular components based upon the different modelled types.


- Business Network Identifier:  This is the name of the business network you want to connect to - and is this the same as the modules NPM registry name
- Business Network Archive File: This is a business network definition archived using the Composer-CLI
- Connection Profile:  This is the connection profile used to locate ip/ports etc of the running fabric
- The EnrollmentId/Secret: Are needed to create a connection to the fabric


#### Testing this has worked

**1. Generating the application by connecting to a running business network**

After the application has been generated, the application can be started using ``npm start`` inside of the application directory.

**2. Generating the applicaiton with a business network archive file**

After the application has been generated, a business network needs to be deployed to a live fabric.
Once this has been done, you will then need to change into applications ``config`` directory.
Inside ``default.json``, the connection profile, business network identifier, enrollment id and secret to connect to the business network need to be set.
The application can be then be started using ``npm start``.


The generated application can then be tested using ``npm test`` and ``npm run e2e``.

# Generating Tests

Note that after the application is generated you may choose to add skeletal tests to your application using the `composer generator tests` command.
