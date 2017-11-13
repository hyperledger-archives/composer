---
layout: default
title: Hyperledger Composer Identity Bind Command
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Identity Bind Command
---

# Composer Identity Bind

---

The `composer identity bind` command binds an existing identity to a participant in a
participant registry. See the task [Binding an existing identity to a participant](../managing/identity-bind.html)
for a walkthrough of using this command or the API.

## Syntax

```
$ composer identity bind
composer identity bind [options]

Options:
  --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  --connectionProfileName, -p  The connection profile name  [string]
  --businessNetworkName, -n    The business network name  [string] [required]
  --enrollId, -i               The enrollment ID of the user  [string] [required]
  --enrollSecret, -s           The enrollment secret of the user  [string]
  --participantId, -a          The particpant to issue the new identity to  [string] [required]
  --certificateFile, -c        File containing the certificate  [string] [required]
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

`--certificateFile, -c`

The path a file containing the certificate for the existing identity in PEM format.  
Example: `/tmp/cert.pem`

`--participantId, -a`

The fully qualified identifier of the participant that the identity should be issued to.  
Example: `resource:net.biz.digitalPropertyNetwork.Person#lenny@biznet.org`
