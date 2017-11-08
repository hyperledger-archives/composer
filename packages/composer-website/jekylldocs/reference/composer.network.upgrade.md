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

`composer network upgrade` upgrades the {{site.data.conrefs.composer_full}} runtime of the named business network to use a new micro version. Before running the `composer network upgrade` command, a new version of the {{site.data.conrefs.composer_full}} runtime must have been deployed to a blockchain node by using the `composer runtime install` command.

*Please Note*: `composer network upgrade` is only suitable for upgrading between micro versions of the {{site.data.conrefs.composer_full}} runtime. Micro versions are defined as the third decimal number of a release, for example, in release 0.9.2, the major version is 0, the minor version is 9, and the micro version is 2.

### Options

```
composer network upgrade [options]

Options:
  --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  -c, --card                   The business network card defining the network to upgrade. [string]
```
