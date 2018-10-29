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

**IMPORTANT: Never use this command on a production or shared business network. It should only ever be used as a quick reset against a business network running locally on your machine for which you will not keep. Use this for your local development testing purposes only**

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
