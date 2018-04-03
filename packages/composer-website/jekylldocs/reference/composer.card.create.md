---
layout: default
title: Hyperledger Composer Card Create
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Card Create
---

# Composer Card Create

Creates a business network card from individual components. When creating a business network card, you will need either an `enrollSecret`, both a `certificate` and `privateKey` or just a `certificate` if your private keys are managed by a HSM (Hardware Security Module).

```
composer card create --file conga.card --businessNetworkName penguin-network --connectionProfileFile connection.json --user conga --enrollSecret supersecret
```

## Syntax

```
Card options
  --file, -f                   File name of the card archive to be created  [string]
  --businessNetworkName, -n    The business network name  [string]
  --connectionProfileFile, -p  Filename of the connection profile json file  [string] [required]
  --user, -u                   The name of the identity for the card  [string] [required]
  --enrollSecret, -s           The enrollment secret of the user  [string]
  --certificate, -c            File containing the user's certificate.  [string]
  --privateKey, -k             File containing the user's private key  [string]
  --role, -r                   The role for this card can, specify as many as needed  [choices: "PeerAdmin", "ChannelAdmin"]

Options:
  --help         Show help  [boolean]
  -v, --version  Show version number  [boolean]
```

## Roles

Roles are only used by playground when interacting with {{site.data.conrefs.hlf_full}} to determine which card to use when performing the 2 step action of installing new business networks and then either starting or upgrading that business network. Whenever a business network is first deployed or new changes deployed, the mew business network is first installed onto the Peer(s) and then a start or upgrade is requested.

In order to perform an installation of a business network, a card with the `PeerAdmin` role is used. To perform a start or upgrade of the business network a card with the `ChannelAdmin` role is used. 
