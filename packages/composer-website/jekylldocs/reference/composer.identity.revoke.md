---
layout: default
title: Hyperledger Composer Identity Revoke Command
section: reference-command
sidebar: sidebars/reference.md
excerpt: Hyperledger Composer Identity Revoke Command
---

# composer identity revoke

---

The `composer identity issue` command revokes an existing identity from a participant in a
participant registry. See the task [Revoke an Identity from a Participant](../managing/identity-revoke.html)
for a walkthrough of using this command or the API.

## Syntax

```
$ composer identity revoke
composer identity revoke [options]

Options:
  --help                       Show help  [boolean]
  --connectionProfileName, -p  The connection profile name  [string]
  --businessNetworkName, -n    The business network name  [string] [required]
  --enrollId, -i               The enrollment ID of the user  [string] [required]
  --enrollSecret, -s           The enrollment secret of the user  [string]
  --userId, -u                 The user ID of the identity to revoke  [string] [required]
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

`--userId, -u`

The user ID of the existing identity that should be revoked.  
Example: `lennyid1`
