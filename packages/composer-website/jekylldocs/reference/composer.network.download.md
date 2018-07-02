---
layout: default
title: Hyperledger Composer Network Download Command
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Network Download Command
---

# Composer Network Download

---

The `composer network download` command downloads a business network from a Hyperledger Fabric, without undeploying it.

`composer network download -a businessnetworkv1.1.4 -c admin@examplenetwork`

## Syntax

```
Options:
  --help             Show help  [boolean]
  -v, --version      Show version number  [boolean]
  --archiveFile, -a  The business network archive file name to write  [string] [required]
  --card, -c         The cardname to use to download the network  [string] [required]
```

## Options

`--archiveFile, -a`

The business network archive file name to create.
Example: `businessnetworkv1.1.4`

`--card, -c`

The business network card to use to download the network.

## Javascript API Example

``` javascript
const NetworkDownload = require('composer-cli').Network.Download;

let options = {
  archiveFile: 'businessnetworkv1.1.4',
  card: 'admin@examplenetwork'
};

NetworkDownload.handler(options);
```
