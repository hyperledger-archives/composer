---
layout: default
title: Hyperledger Composer Network List CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Network List CLI
---

# {{site.data.conrefs.composer_full}} Network List

---

The `composer network list` utility is used to connect to a business network and retrieve metadata and asset information.

```
composer network list -n <business-network-id>  -p <connectionProfileName> -i <enrollment-id> -s <enrollment-secret>
```

### Options
```
  --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  --businessNetworkName, -n    The business network name  [string] [required]
  --connectionProfileName, -p  The connection profile name  [string]
  --registry, -r               List specific registry  [string]
  --asset, -a                  List specific asset  [string]
  --enrollId, -i               The enrollment ID of the user  [string] [required]
  --enrollSecret, -s           The enrollment secret of the user  [string]
```

## Example Output

```
composer network list -n digitalproperty-network -p hlfv1 -i admin -s adminpw
List business network digitalproperty-network
name:        digitalproperty-network
identifier:  digitalproperty-network@0.0.1
description: Digital Property Network
models:
  - net.biz.digitalPropertyNetwork
scripts:
  - lib/DigitalLandTitle.js
registries:
  net.biz.digitalPropertyNetwork.SalesAgreement:
    id:           net.biz.digitalPropertyNetwork.SalesAgreement
    name:         Asset registry for net.biz.digitalPropertyNetwork.SalesAgreement
    registryType: Asset
    assets:
  net.biz.digitalPropertyNetwork.LandTitle:
    id:           net.biz.digitalPropertyNetwork.LandTitle
    name:         Asset registry for net.biz.digitalPropertyNetwork.LandTitle
    registryType: Asset
    assets:
```
