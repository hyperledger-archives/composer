---
layout: default
title: Hyperledger Composer Network Ping CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Network Ping CLI
---

# {{site.data.conrefs.composer_full}} Network Ping

---

The `composer network ping` utility is used to verify the connection to a business network deployed to a Hyperledger Fabric.
Note that ping also returns the participant information for the identity that was used to connect to the network, if
an identity has been issued for the participant.

```
composer network ping -n <business-network-name> -p <connection-profile-name> -i <enrollment-id> -s <enrollment-secret>
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

Given:
```
composer identity issue -p hlfv1 -n 'digitalproperty-network' -i admin -s adminpw -u fred -a "resource:net.biz.digitalPropertyNetwork.Person#PID:1234567890"

An identity was issued to the participant 'resource:net.biz.digitalPropertyNetwork.Person#PID:1234567890'
The participant can now connect to the business network with the following details:
  userID = fred
  userSecret = lgBOchfiZRUU

```
The example of pinging the network, to test with the issued identity: 
```
composer network ping -n digitalproperty-network -p hlfv1 -i fred -s lgBOchfiZRUU 

The connection to the network was successfully tested: digitalproperty-network
	version: 0.11.3-20170817015027
	participant: net.biz.digitalPropertyNetwork.Person#PID:1234567890

Command succeeded
```
