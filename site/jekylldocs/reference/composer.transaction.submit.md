---
layout: default
title: Fabric Composer Transaction Submit Command
category: reference
sidebar: sidebars/reference.md
excerpt: Fabric Composer Transaction Submit Command
---

# composer transaction submit

The `composer transaction submit` command submits a transaction to the
transaction registry.

## Syntax

```
$ composer transaction submit
composer transaction submit [options]

Options:
  --help                       Show help  [boolean]
  --connectionProfileName, -p  The connection profile name  [string]
  --businessNetworkName, -n    The business network name  [string] [required]
  --enrollId, -i               The enrollment ID of the user  [string] [required]
  --enrollSecret, -s           The enrollment secret of the user  [string]
  --data, -d                   Transactions JSON object as a string [string] [required]

```

## Options

`--connectionProfileName, -p`

The connection profile name.  
Example: `defaultProfile`

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

`--data, -d`

The transaction represented as a JSON object.  
Example: `'{"$class":"net.biz.digitalPropertyNetwork.RegisterPropertyForSale ","seller":"SELLER_001","title":"TITLE_001"}'`
