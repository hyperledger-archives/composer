---
layout: default
title: Hyperledger Composer Network Reset Command
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Network Reset Command
---

# Composer Network Reset

---

The `composer network reset` command deletes the contents of all the registries in the State Database.  It is fast way for developers to reset the Business Network and remove test data. 

`composer network reset -c admin@example-network`

## Syntax

```
Options:
  --help             Show help  [boolean]
  -v, --version      Show version number  [boolean]
  --card, -c         The cardname to use to reset the network  [string] [required]
```

## Options

`--card, -c`

The business network card to use to reset the network.
