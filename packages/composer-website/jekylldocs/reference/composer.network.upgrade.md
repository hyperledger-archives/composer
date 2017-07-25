---
layout: default
title: Hyperledger Composer Network Upgrade CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Network Update CLI
---

# {{site.data.conrefs.composer_full}} Network Upgrade

---

The `composer network upgrade` utility is used to update a deployed business network archive from local disk to a {{site.data.conrefs.hlf_full}} runtime.

```
composer network upgrade -n <business-network-archive> -p <connection-profile-Name> -i <upgrade-Id> -s <upgrade-Secret>
```

`composer network upgrade` upgrades the named business network to use a new micro-version runtime. Before running the `composer network upgrade` command, a new version of the {{site.data.conrefs.composer_full}} runtime must have been deployed to a blockchain node by using the `composer runtime install` command.

*Please Note*: `composer network upgrade` is only suitable for upgrading between micro-versions of the {{site.data.conrefs.composer_full}} runtime, major or minor version upgrades are not supported.

### Options

```
composer network upgrade [options]

Options:
  --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  --businessNetworkName, -n    The business network name whose runtime will be upgraded  [string] [required]
  --connectionProfileName, -p  The connection profile name  [string] [required]
  --upgradeId, -i              The id of the user permitted to upgrade the runtime  [string] [required]
  --upgradeSecret, -s          The secret of the user permitted to upgrade the runtime, if required  [string]
```
