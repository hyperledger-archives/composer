---
layout: default
title: Hyperledger Composer Card Export
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Card Export
---

# Composer Card Export

Exports a card from your local wallet and packages it so it can be transferred or used elsewhere.

```
composer card export --file dan.card --card dan@penguin-network
```

## Syntax

```
Options:
  --help         Show help  [boolean]
  -v, --version  Show version number  [boolean]
  --file, -f     The packaged card file name  [string]
  --card, -c     The name of the card to export  [string] [required]
```

## Javascript API Example

```javascript
const CardExport = require('composer-cli').Card.Export;

let options = {
  file: 'dan.card',
  card: 'dan@penguin-network'
};

CardExport.handler(options);
```
