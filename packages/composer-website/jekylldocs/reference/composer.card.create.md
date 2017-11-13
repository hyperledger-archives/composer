---
layout: default
title: Hyperledger Composer Card Create
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Card Create
---

# Composer Card Create

Creates a business network card from individual components. When creating a business network card, you will need either an `enrollSecret` or both a `certificate` and `privateKey`.

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
