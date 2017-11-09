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
composer network list -c admin@tutorial-network
```

### Options
```
Options:
  --help          Show help  [boolean]
  -v, --version   Show version number  [boolean]
  --registry, -r  List specific registry  [string]
  --asset, -a     List specific asset  [string]
  --card, -c      The card name used to list the network  [string]
```

## Example Output

```
composer network list -c admin@tutorial-network

✔ List business network digitalproperty-network
name:       digitalproperty-network
models:
  - org.hyperledger.composer.system
  - net.biz.digitalPropertyNetwork
scripts:
  - lib/DigitalLandTitle.js
registries:
  net.biz.digitalPropertyNetwork.LandTitle:
    id:           net.biz.digitalPropertyNetwork.LandTitle
    name:         Asset registry for net.biz.digitalPropertyNetwork.LandTitle
    registryType: Asset
    assets:
      LID:1148:
        $class:      net.biz.digitalPropertyNetwork.LandTitle
        titleId:     LID:1148
        owner:       resource:net.biz.digitalPropertyNetwork.Person#PID:1234567890
        information: A nice house in the country
        forSale:     true
      LID:6789:
        $class:      net.biz.digitalPropertyNetwork.LandTitle
        titleId:     LID:6789
        owner:       resource:net.biz.digitalPropertyNetwork.Person#PID:1234567890
        information: A small flat in the city
  net.biz.digitalPropertyNetwork.SalesAgreement:
    id:           net.biz.digitalPropertyNetwork.SalesAgreement
    name:         Asset registry for net.biz.digitalPropertyNetwork.SalesAgreement
    registryType: Asset
  net.biz.digitalPropertyNetwork.Person:
    id:           net.biz.digitalPropertyNetwork.Person
    name:         Participant registry for net.biz.digitalPropertyNetwork.Person
    registryType: Participant
    assets:
      PID:1234567890:
        $class:    net.biz.digitalPropertyNetwork.Person
        personId:  PID:1234567890
        firstName: Fred
        lastName:  Bloggs

Command succeeded
```
