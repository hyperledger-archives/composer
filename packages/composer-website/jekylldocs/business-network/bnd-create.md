---
layout: default
title: Create a Business Network Definition
category: tasks
section: business-network
index-order: 502
sidebar: sidebars/accordion-toc0.md
excerpt: How to create a business network definition
---

# Create a Business Network Definition


A business network definition has the following layout:

    models/ (optional)
    lib/
    permissions.acl (optional)
    package.json
    README.md (optional)

The easiest way to create a new business network definition is to either `git clone` an example, or to use the {{site.data.conrefs.composer_full}} Yeoman generator to create a skeleton business network.

## README.md

A description of the purpose of the business network using the Markdown mark-up language.

## Package.json

A Business Network Definition has a name (limited to basic ASCII alphanumeric characters and `-`), a human-readable description and a version number. The version number for the network should take the form Major.Minor.Micro and
[Semantic Versioning](http://semver.org) principles should be used when incrementing the version number.

The identifier of the network is formed from its name, the `-` character and its version number. A valid identifier (and example) is therefore `mybusinessnetwork-1.0.3`.

The metadata for a business network definition is read from `package.json`, meaning that business network definitions may also be valid `npm` packages.

## Models

The set of domain models for a business network definition define the types that are valid within the network and outside the network when it is integrated with external systems (for example systems that submit transactions to the network).

A domain model may either be packaged within the business network definition (typically stored under the `models` directory), or may be declared in `package.json` as an external dependency. You refer to models via an npm dependency if you wanted to share them across business network definitions.

## Scripts

The scripts for a business network definition are typically stored under the `lib` directory and are packaged within the business network definition. The scripts are written in ES 5 JavaScript and refer to the types that are defined in the domain models for the business network.

## Permissions.acl

The permissions for the business network expressed are expressed in an optional `permissions.acl` file.

# Cloning an Example Business Network Definition

The sample business network definitions are stored on GitHub at `https://github.com/hyperledger/composer-sample-networks`. You can `git clone` this repository to pull down all the sample networks. Each sample network is stored under the `packages` directory.

# Generating a Business Network Definition

## Generation
1. `yo hyperledger-composer`

```
Welcome to the Hyperledger Composer Skeleton Application Generator
? Please select the type of Application: (Use arrow keys)
❯ CLI Application
  Angular 2 Application
  Skeleton Business Network
```
And select `Skeleton Business Netork`

2. Answer all of the questions

```
? Please select the type of Application: Skeleton Business Network
You can run this generator using: 'yo hyperledger-composer:businessnetwork'
Welcome to the business network skeleton generator
? Do you only want to generate a model? Yes
? What is the business network's name? mynetwork
? What is the business network's namespace? org.example
? Describe the business network This is my test network
? Who is the author? Dan Selman
? Which license do you want to use? Apache-2
   create index.js
   create package.json
   create README.md
   create models/org.example.cto
   create .eslintrc.yml
```

This generates a skeleton business network with an `asset`, `participant` and `transaction` defined, as well as a `mocha` unit test.

Also included, is a 'best practice' eslint config file which defines sample linting rules for JS code.

## References

* [**Modeling Language**](../reference/cto_language.html)
* [**Access Control Language**](../reference/acl_language.html)
* [**Transaction Processor Functions**](../reference/js_scripts.html)
