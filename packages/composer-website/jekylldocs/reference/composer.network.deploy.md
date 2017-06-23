---
layout: default
title: Hyperledger Composer Network Deploy CLI
section: reference-command
sidebar: sidebars/reference.md
excerpt: Composer Network Deploy CLI
---

# {{site.data.conrefs.composer_full}} Network Deploy

---

The `composer network deploy` utility is used to deploy a business network archive from local disk to a Hyperledger Fabric runtime.

```
composer network deploy -a <business-network-archive> -i <enrollment-id> -s <enrollment-secret>
```

### Options
```
  --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  --archiveFile, -a            The business network archive file name  [string] [required]
  --connectionProfileName, -p  The connection profile name  [string]
  --enrollId, -i               The enrollment ID of the user  [string] [required]
  --enrollSecret, -s           The enrollment secret of the user  [string]
```

## Example Output

```
composer network deploy -a digitalPropertyNetwork.zip -i WebAppAdmin -s DJY27pEnl16d
Deploying business network from archive digitalPropertyNetwork.zip
Business network definition:
	Identifier: digitalproperty-network@0.0.1
	Description: Digital Property Network
Deploying business network definition. This may take a minute...
Command completed successfully.
```
