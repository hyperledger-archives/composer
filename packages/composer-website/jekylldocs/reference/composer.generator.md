---
layout: default
title: Hyperledger Composer Generator CLI
category: reference
sidebar: sidebars/reference.md
excerpt: Composer Archive List CLI
---

## Name

composer generator - create code artifacts based on a business network definition

## Synopsis

```
composer generator <subcommand>

Commands:
  create [options]  Create Code artifacts from Business Network Archive
  tests [options]   Generate unit tests

Options:
  --help         Show help  [boolean]
  -v, --version  Show version number  [boolean]
```

## Description

This utility has a number of sub-commands that can be used to create code artifacts
from a business network definition. As the business network definition contains
a conceptual model of the business assets, participants and transactions it is possiblke
to create a variety of difference code artifacts.

These include but are not limited to

* JavaScript and Go language object definitions
* UML Diagrams
* Unit tests
* Sample seed applications tailured to the business network

## Commands
<!-- to create a line break but not a new bullet - add 2 spaces to end of the lines -->
The sub-commands that are available are

* `create`  
  generate code artifacts
* `tests`  
generate resources to permit testing of business network definitions

## Options

* `--help`  
Shows the help text
* `-v` `--version`  
Shows the version number
