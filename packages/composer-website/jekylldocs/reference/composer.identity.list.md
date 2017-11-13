---
layout: default
title: Hyperledger Composer Identity List Command
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Identity List Command
---

# Composer Identity List

---

The `composer identity list` command lists all of the identities in a business network.
See the task [Listing all identities in a business network](../managing/identity-list.html)
for a walkthrough of using this command or the API.

## Syntax

```
$ composer identity list
composer identity list [options]

Options:
  --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  -c, --card                   The business network card to use [string] [required]
```

## Options

`--card, -c`
The business network card to use when listing identities.
Example: `admin@tutorial-network`
