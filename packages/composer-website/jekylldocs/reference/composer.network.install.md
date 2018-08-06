---
layout: default
title: Hyperledger Composer Network Install CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Network Install
---

# {{site.data.conrefs.composer_full}} Network Install

---

The `composer network install` command is used to install a business network archive on the {{site.data.conrefs.hlf_full}} peers of the blockchain network you are connecting to. This command must be run before the `composer network start` command.

```
composer network install --archiveFile <business-network-archive> --card <peer-admin-card>
```

### Options
```
composer network install [options]

Options:
  --help                     Show help  [boolean]
  -v, --version              Show version number  [boolean]
  --archiveFile, -a  The business network archive file name  [string] [required]
  --card, -c         The cardname to use to install the network  [string] [required]
  --option, -o       Options that are specific to connection. Multiple options are specified by repeating this option  [string]
  --optionsFile, -O  A file containing options that are specific to connection  [string]  
```

Please refer to [Connector specific information](../managing/connector-information.html) for more information about connecting to {{site.data.conrefs.hlf_full}} {{site.data.conrefs.hlf_latest}}.

## Javascript API Example

``` javascript
const NetworkInstall = require('composer-cli').Network.Install;

let options = {
  archiveFile: 'digitalPropertyNetwork.bna',
  card: 'admin@tutorial-network'
};

NetworkInstall.handler(options);
```
