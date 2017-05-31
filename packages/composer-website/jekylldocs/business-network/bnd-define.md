---
layout: default
title: Task - Create a Business Network Definition
category: tasks
sidebar: sidebars/businessnetworks.md
excerpt: How to create a business network definition
---

# Create a Business Network Definition

---

A business network definition is composed of three major items:

* basic metadata for the business network definition (name, version and description)
* a set of domain models that define the structure of the participants, assets and transactions within the network
* a set of scripts that define business logic

## Generating Skeleton Business Network

### Generation
1. `yo fabric-composer`

```
Welcome to the Hyperledger Composer Skeleton Application Generator?
Please select the type of Application:
  CLI Application
  Angular2 Application
❯ Skeleton Business Network
```
And select `Skeleton Business Netork`

2. Answer all of the questions

```
Welcome to the Hyperledger Composer Skeleton Application Generator
? Please select the type of Application: Skeleton Business Network
You can run this generator using: 'yo fabric-composer:businessnetwork'
Welcome to the business network skeleton generator
? What is the business network's name? basic-sample-network
? What is the business network's namespace? org.acme.biznet
? Describe the business network Sample Business Network
? Who is the author? Joe Bloggs
? Which license do you want to use? Apache-2
   create index.js
   create lib/logic.js
   create package.json
   create README.md
   create test/logic.js
   create .eslintrc.yml
   create models/org.acme.biznet.cto
```

This generates a skeleton business network with an `asset`, `participant` and `transaction` defined, as well as a `mocha` unit test.

Also included, is a 'best practices' eslint config file

## Metadata

A Business Network Definition has a name (limited to basic ASCII alphanumeric characters and `-`), a human-readable description and a version number. The version number for the network should take the form Major.Minor.Micro and
[Semantic Versioning](semver.org) principles should be used when incrementing the version number.

The identifier of the network is formed from its name, the `-` character and its version number. A valid identifier is therefore `mybusinessnetwork-0.6.3`.

The metadata for a business network definition is read from `package.json`, meaning that business network definitions may also be valid `npm` packages.

## Domain Models

The set of domain models for a business network definition define the types that are valid within the network and outside the network when it is integrated with external systems (for example systems that submit transactions to the network).

A domain model may either be packaged within the business network definition (typically stored under the `models` directory), or may be declared in `package.json` as an external dependency. You would refer to models via a dependency if you wanted to share them across business network definitions, for example.

## Scripts

The scripts for a business network definition are typically stored under the `lib` directory and are packaged within the business network definition. The scripts are written in ES 5 JavaScript and refer to the types that are defined in the domain models for the business network.

# Business Network Archive

Prior to deploying or updating a business network definition it must be archived using the ZIP standard. A typical ZIP will contain a `package.json` a `lib` folder containing one or more `.js` files and a `models` folder containing one or more `.cto` files.

The `composer` CLI contains commands for creating an archive, deploying business network archives and the `BusinessNetworkDefinition.fromArchive, toArchive and fromDirectory` APIs can be used to programmatically create business network definitions.
