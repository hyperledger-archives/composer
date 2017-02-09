---
layout: default
title: Task - Generating an Application
category: tasks
sidebar: sidebars/tasks.md
excerpt: How to generate a starter application
---

# How Generate a Starter Application
We're going to assume that you've been through the Getting Started section and would like to now start to look at writing your own application to use Fabric Composer.

To help getting started with this, there's a [Yeoman](http://yeoman.io/) generator that creates a suitable directory structure and helps bring in the required model and network modules.

## Yeoman

If you don't already have it, install Yeoman

```bash
npm install -g yo
```

then install the generator for it

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

#### CLI Application

Description ...
This can also be ran using ```yo fabric-composer:cli```

##### What questions does this ask?

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

##### What does this do?
Firstly it creates a standard npm module with the usual attributes of name, author, description.
Secondly it asks a set of Fabric Composer questions to help create the sample structure.

- NPM Module name:  What is the name of the business network you want to connect to - and is this the same as the modules NPM registry name
- Connection Profile:  This is the connection profile used to locate ip/ports etc of the running fabric
- The EnrollmentId/Secret: Are needed to create a connection to the fabric

##### Testing this has worked
The `index.js` file is a very simple application that lists the asset registries that have been defined.

---

#### Angular2 Application
The user has the option to generate an Angular2 application from providing:
- The details required to connect to a running business network
- A business network archive file.

This can also be ran using ```yo fabric-composer:angular```

##### What questions does this ask?


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

##### What does this do?

1. Generating the application by connecting to a running business network
Firstly the generator will also a series of basic regarding the application name, author, description, etc.
Then it will ask the user to enter the details required to connect a running business network.
After the generator has stopped prompting the user to answer questions, it will then attempt to connect to the business network using the details provided.
If it successfully connects to the business network, the generator will then examine the assets, transactions and participant.
The generator will then create Angular components based upon the different modelled types.


2. Generating the application with a business network archive file
Firstly it creates a standard npm module with the usual attributes of name, author, description.
Secondly it asks a set of Fabric Composer questions to help create the sample structure.

- NPM Module name:  What is the name of the business network you want to connect to - and is this the same as the modules NPM registry name
- Connection Profile:  This is the connection profile used to locate ip/ports etc of the running fabric
- The EnrollmentId/Secret: Are needed to create a connection to the fabric


# Generating Tests

Note that after the application is generated you may choose to add skeletal tests to your application using the `composer generator tests` command.
