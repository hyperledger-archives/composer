---
layout: default
title: Hyperledger Composer Network Update CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Network Update CLI
---

# {{site.data.conrefs.composer_full}} Network Update

---

The `composer network update` utility is used to update a deployed business network archive from local disk to a {{site.data.conrefs.hlf_full}} runtime.

```
composer network update -a <business-network-archive> -c <card-name>
```

The business network definition must have been previously deployed to the Fabric. The business network definition
is replaced within the same chaincode container.

### Options
```
Options:
  --help              Show help  [boolean]
  -v, --version       Show version number  [boolean]
  --card, -c          The card to use to update the network  [string] [required]
  --archiveFile , -a  The business network archive file [string] [required]
```

## Example Output

```
composer network update -a digitalPropertyNetwork.bna -c admin@digitalPropertyNetwork
Deploying business network from archive: digitalPropertyNetwork.bna
Business network definition:
	Identifier: digitalproperty-network@0.0.1
	Description: Digital Property Network
Updating business network definition. This may take a few seconds...

Command succeeded
```
