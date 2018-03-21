---
layout: default
title: Hyperledger Composer Network Start CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Network Start
---

# {{site.data.conrefs.composer_full}} Network Start

---

The `composer network start` utility is used to start a specific version of a business network that has been previously installed to a {{site.data.conrefs.hlf_full}} {{site.data.conrefs.hlf_latest}} network.
Before using this command, read the topic [Deploying and Updating Business Networks](../business-network/bnd-deploy.html).

_Please Note_: You **must** first install the business network to the {{site.data.conrefs.hlf_full}} peers by using the `composer network install` command.

```
composer network start --networkName <business-network-name> --networkVersion <business-network-version> --networkAdmin <admin-name> --networkAdminEnrollSecret adminpw --card <peer-admin-card> --file <admin-card-file-name>
```

## Considerations
This command creates a new card file. The connection profile in this card file comes from the card defined in the `-c|--card` option used to perform the request and the connection profile defines whether an identity in a card should be HSM managed or not. If the card used for the request is not HSM managed (as defined in the connection profle) then the card file created will not be HSM managed. Conversely if the card used for the request is HSM managed then the card file created will also be HSM managed.
### Options
```
composer network start [options]

Options:
  --help                             Show help  [boolean]
  -v, --version                      Show version number  [boolean]
  --networkName, -n                  Name of the business network to start  [required]
  --networkVersion, -V               Version of the business network to start  [required]
  --loglevel, -l                     The initial loglevel to set  [choices: "INFO", "WARNING", "ERROR", "DEBUG"]
  --option, -o                       Options that are specific specific to connection. Multiple options are specified by repeating this option  [string]
  --optionsFile, -O                  A file containing options that are specific to connection  [string]
  --networkAdmin, -A                 The identity name of the business network administrator  [string] [required]
  --networkAdminCertificateFile, -C  The certificate of the business network administrator  [string]
  --networkAdminEnrollSecret, -S     The enrollment secret for the business network administrator  [string]
  --card, -c                         The cardname to use to start the network  [string] [required]
  --file, -f                         File name of the card to be created  [string]
  ```
Please refer to [Connector specific information](../managing/connector-information.html) for more information about connector specific options.

