---
layout: default
title: Hyperledger Composer Identity List Command
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Identity List Command
---

# Composer Identity List

---

The `composer identity list` command lists all of the identities in a business network.
See the task [Listing all identities in a business network](../managing/identity-list.html)
for a walkthrough of using this command or the API.

## Syntax

```
$ composer identity list
composer identity list [options]

Options:
  --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  --connectionProfileName, -p  The connection profile name  [string]
  --businessNetworkName, -n    The business network name  [string] [required]
  --enrollId, -i               The enrollment ID of the user  [string] [required]
  --enrollSecret, -s           The enrollment secret of the user  [string]
```

## Options

`--connectionProfileName, -p`

The connection profile name.  
Example: `hlfv1`

`--businessNetworkName, -n`

The name of the deployed Business Network to connect to.  
Example:
`digitalproperty-network`

`--enrollId, -i`

The enrollment ID of the identity that should be used to connect to the deployed
Business Network.
Example: `maeid1`

`--enrollSecret, -s`

The enrollment secret of the identity that should be used to connect to deployed
Business Network.  
Example: `Xurw3yU9zI0l`