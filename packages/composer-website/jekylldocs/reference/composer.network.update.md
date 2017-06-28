---
layout: default
title: Hyperledger Composer Network Update CLI
section: reference-command
sidebar: sidebars/reference.md
excerpt: Composer Network Update CLI
---

# {{site.data.conrefs.composer_full}} Network Update

---

The `composer network update` utility is used to update a deployed business network archive from local disk to a Hyperledger Fabric runtime.

```
composer network update -a <business-network-archive> -i <enrollment-id> -s <enrollment-secret>
```

The business network definition must have been previously deployed to the Fabric. The business network definition
is replaced within the same chaincode container.

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
composer network update -a digitalPropertyNetwork.zip -i WebAppAdmin -s DJY27pEnl16d
Deploying business network from archive digitalPropertyNetwork.zip
Business network definition:
	Identifier: digitalproperty-network@0.0.1
	Description: Digital Property Network
Updating business network definition. This may take a few seconds...
Command completed successfully.
```
