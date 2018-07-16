---
layout: default
title: Hyperledger Composer Card Delete
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Card Delete
---

# Composer Card Delete

Deletes a business network card.

```
composer card delete --card admin@tutorial-network
```

## Syntax

```
Options:
  --help         Show help  [boolean]
  -v, --version  Show version number  [boolean]
  --card, -c     The name of the card to delete  [string] [required]
```

## Javascript API Example

```javascript
const CardDelete = require('composer-cli').Card.Delete;

let options = {
  card: 'admin@tutorial-network'
};

CardDelete.handler(options);
```
