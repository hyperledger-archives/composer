---
layout: default
title: Hyperledger Composer Report
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Report
---

# Composer Report

---

The `composer report` command creates a compressed archive file in the directory where the command was issued. The archive file contains details of the current composer environment.


## Syntax

```
Options:
  --help         Show help  [boolean]
  -v, --version  Show version number  [boolean]
```

## Stand-alone command

An alternative stand-alone command is available for situations where the `composer` command is not working, or the `composer-cli` module could not be installed for any reason.

This would normally be installed as a global module

```
npm install -g composer-report
```

Once installed, running `composer-report` will create a report archive in the current directory in the same way as the full `composer report` command.
