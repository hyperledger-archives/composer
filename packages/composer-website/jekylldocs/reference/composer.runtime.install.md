---
layout: default
title: Hyperledger Composer Runtime Start CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Runtime Install
---

# {{site.data.conrefs.composer_full}} Runtime Install

---

The `composer runtime install` command is used to install the {{site.data.conrefs.composer_full}} runtime on the {{site.data.conrefs.hlf_full}} peers of the blockchain network you are connecting to. This command must be run before the `composer network start` command.

_Please Note_: The `--businessNetworkName, -n` option **must** contain the same name as the business network name you intend to run on the {{site.data.conrefs.hlf_full}} peers. Only business networks with names matching the `--businessNetworkName, -n` option given in this command will successfully run.

```
composer runtime install -n <businessNetworkName> -p <connectionProfileName> -i <installId> -s <installSecret>
```

### Options
```
composer runtime install [options]

Options:
  --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  --businessNetworkName, -n    The business network name  [string] [required]
  --connectionProfileName, -p  The connection profile name  [string] [required]
  --option, -o                 Options that are specific specific to connection. Multiple options are specified by repeating this option  [string]
  --optionsFile, -O            A file containing options that are specific to connection  [string]
  --installId, -i              The id of the user permitted to install the runtime  [string] [required]
  --installSecret, -s          The secret of the user permitted to install the runtime, if required  [string]
```
