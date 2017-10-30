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
composer network ping --card admin@tutorial-network
```

### Options
```
Options:
  --help         Show help  [boolean]
  -v, --version  Show version number  [boolean]
  --card, -c     The cardname to use to ping the network  [string]
```

## Example Output

```
composer network ping --card admin@tutorial-network
The connection to the network was successfully tested: tutorial-network
	version: 0.15.0-20171108090428
	participant: org.hyperledger.composer.system.NetworkAdmin#admin

Command succeeded
```
