---
layout: default
title: Hyperledger Composer Network Ping CLI
section: reference-command
sidebar: sidebars/reference.md
excerpt: Composer Network Ping CLI
---

# {{site.data.conrefs.composer_full}} Network Ping

---

The `composer network ping` utility is used to verify the connection to a business network deployed to a Hyperledger Fabric.
Note that ping also returns the participant information for the identity that was used to connect to the network, if
an identity has been issued for the participant.

```
composer network ping -n <business-network-id> -i <enrollment-id> -s <enrollment-secret>
```

### Options
```
 --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  --businessNetworkName, -n    The business network name  [string] [required]
  --connectionProfileName, -p  The connection profile name  [string]
  --enrollId, -i               The enrollment ID of the user  [string] [required]
  --enrollSecret, -s           The enrollment secret of the user  [string]
```

## Example Output

```
composer network ping -n digitalproperty-network -i WebAppAdmin -s DJY27pEnl16d
The connection to the network was successfully tested:
  version = 0.4.1
  participant = <no participant found>
Command completed successfully.
```
