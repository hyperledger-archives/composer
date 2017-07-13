---
layout: default
title: Hyperledger Composer Identity Issue Command
section: reference-command
sidebar: sidebars/reference.md
excerpt: Hyperledger Composer Identity Issue Command
---

# Composer Identity Issue

---

The `composer identity issue` command issues a new identity to a participant in a
participant registry. See the task [Issue an Identity to a Participant](../managing/identity-issue.html)
for a walkthrough of using this command or the API.

## Syntax

```
$ composer identity issue
composer identity issue [options]

Options:
  --help                       Show help  [boolean]
  --connectionProfileName, -p  The connection profile name  [string]
  --businessNetworkName, -n    The business network name  [string] [required]
  --enrollId, -i               The enrollment ID of the user  [string] [required]
  --enrollSecret, -s           The enrollment secret of the user  [string]
  --newUserId, -u              The user ID for the new identity  [string] [required]
  --participantId, -a          The particpant to issue the new identity to  [string] [required]
  --issuer, -x                 If the new identity should be able to issue other new identities  [boolean] [required]
  --option, -o                 Options that are specific specific to a connection. Multiple options are specified by repeating this option  [string]
  --optionFile, -O             A file containing options that are specific to connection  [string]
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

`--newUserId, -u`

The user ID of the new identity that should be issued.  
Example: `lennyid1`

`--participantId, -a`

The fully qualified identifier of the participant that the identity should be issued to.  
Example: `net.biz.digitalPropertyNetwork.Person#lenny@biznet.org`

`--issuer, -x`

Specify this option if the participant is trusted, and should be permitted to use
the new identity to issue other new identities.
