---
layout: default
title: Hyperledger Composer Network Upgrade CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Network Upgrade CLI
---

# {{site.data.conrefs.composer_full}} Network Upgrade

---

The `composer network upgrade` utility is used to upgrade the {{site.data.conrefs.composer_full}} business network to a new version.

```
composer network upgrade -n <business-network-name> -V <business-network-version> -c <business-network-card>
```

`composer network upgrade` upgrades the named {{site.data.conrefs.composer_full}} business network. Before running the `composer network upgrade` command, a new version of the {{site.data.conrefs.composer_full}} business network must have been installed to a blockchain node by using the `composer network install` command.

### Options

```
composer network upgrade [options]

Options:
  --help                     Show help  [boolean]
  -v, --version              Show version number  [boolean]
  --card, -c                 The cardname to use to upgrade the network  [string] [required]
  --networkName, -n          Name of the business network to upgrade  [required]
  --networkVersion, -V       Version of the business network to upgrade to  [required]
  --option, -o               Options that are specific to connection. Multiple options are specified by repeating this option  [string]
  --optionsFile, -O          A file containing options that are specific to connection  [string]
```

Please refer to [Connector specific information](../managing/connector-information.html) for more information about connecting to {{site.data.conrefs.hlf_full}} {{site.data.conrefs.hlf_latest}}.
