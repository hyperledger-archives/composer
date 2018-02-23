---
layout: default
title: Hyperledger Composer Runtime Start CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Runtime Install
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
  --option, -o       Options that are specific specific to connection. Multiple options are specified by repeating this option  [string]
  --optionsFile, -O  A file containing options that are specific to connection  [string]  
```
