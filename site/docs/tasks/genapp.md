---
layout: default
title: Task - Generating an Application
category: tasks
sidebar: sidebars/tasks.md
excerpt: How to generate a starter application
---

# How Generate a Starter Application
We're going to assume that you've been through the Getting Started section and would like to now start to look at writing your own application to use the Framework.

To help getting started with this, there's a [Yeoman](http://yeoman.io/) generator that creates a suitable directory structure and helps bring in the required model and network modules.

## Yeoman

If you don't already have it, install Yeoman

```bash
npm install -g yo
```

then install the generator for it

```bash
npm install -g generator-concerto
```

## Running the generator

```bash
yo concerto
```

### What are the questions?

```bash
? Your NPM library name: concerto-sample-app
? Short description: Test Concerto project
? Author name: Sophie Black
? Author email: sophie@ampretia.com
? NPM Module name of the Business Network to connect to: digitalproperty-network
? Is the name in NPM registry the same as the Business Network Identifier?: Yes
? What is the Connection Profile to use? defaultProfile
? Enrollment id: WebAppAdmin
? Enrollment Secret: DJY27pEnl16d
configuring: concerto-sample-app
Getting the npm module describing the undefined
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

### What does this do?
Firstly it creates a standard npm module with the usual attributes of name, author, description.
Secondly it asks a set of Concerto framework questions to create to help create the sample structure.

- NPM Module name:  What is the name of the business network you want to connect to - and is this the same as the modules NPM registry name
- Connection Profile:  This is the concerto connection profile used to locate ip/ports etc of the running fabric
- The EnrollmentId/Secret: Are needed to create a connection to the fabric

### Testing this has worked
The `index.js` file is a very simple application that lists the asset registries that have been defined.

# Generating Tests

Note that after the application is generated you may choose to add skeletal tests to your application using the `concerto generator tests` command.
