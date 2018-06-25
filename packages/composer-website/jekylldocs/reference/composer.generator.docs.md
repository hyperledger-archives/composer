---
layout: default
title: Hyperledger Composer Generator CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Generator Docs CLI
---

## Name

composer generator docs - create documentation for a Business Network

## Synopsis

```
composer generator docs <options>

Options:
  --help             Show help  [boolean]
  -v, --version      Show version number  [boolean]
  --archive, -a  Business network archive file name. Default is based on the Identifier of the BusinessNetwork  [string] [required]
  --config, -c   Path to the configuration file to use, default is one specificaly for BNA files  [default: ""]
  --outdir, -o   Output Location  [default: "./out"]

```

## Description

This will take the Composer business network definition as input and create html based documentation for all aspects.

## Options

* `-a` `--archiveFile`  
The path to the business network archive file. This will be the source that is used to create the artifacts
* `-c` `--config`  
The configuration that controls how the documentation is produced. An existing template is in-built and this does not need to specified.
Reserved for future expansion
* `-o` `--output`
The output directory with the html. index.html is the starting point.
* `--help`  
Shows the help text
* `-v` `--version`  
Shows the version number

## Example Usage

```bash
composer generator docs --archiveFile digitalPropertyNetwork.bna

```
