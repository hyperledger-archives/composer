---
layout: default
title: Hyperledger Composer Network Upgrade CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Network Update CLI
---

# {{site.data.conrefs.composer_full}} Network Upgrade

---

The `composer network upgrade` utility is used to upgrade the {{site.data.conrefs.composer_full}} runtime.

```
composer network upgrade -n <business-network-name> -c <business-network-card>
```

`composer network upgrade` upgrades the {{site.data.conrefs.composer_full}} the named business network. Before running the `composer network upgrade` command, a new version of the {{site.data.conrefs.composer_full}} business network must have been installed to a blockchain node by using the `composer network install` command.

### Options

```
composer network upgrade [options]

Options:
  --help                     Show help  [boolean]
  -v, --version              Show version number  [boolean]
  --card, -c                 The cardname to use to upgrade the network  [string] [required]
  --loglevel, -l             The initial loglevel to set  [choices: "INFO", "WARNING", "ERROR", "DEBUG"]
  --networkName, -n          Name of the business network to start  [required]
  --networkVersion, -V       Version of the business network to start  [required]
  --option, -o               Options that are specific specific to connection. Multiple options are specified by repeating this option  [string]
  --optionsFile, -O          A file containing options that are specific to connection  [string]
```

Please refer to [Connector specific information](../managing/connector-information.html) for more information about connector specific options.
