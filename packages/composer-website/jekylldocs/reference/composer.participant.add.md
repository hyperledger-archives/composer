---
layout: default
title: Hyperledger Composer Participant Add Command
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Participant Add Command
---

# Composer participant add

---

The `composer participant add` command adds a new instance of a participant to a
participant registry. See the task [Add a Participant](../managing/participant-add.html)
for a walkthrough of using this command or the API.

## Syntax

```
$ composer participant add
composer participant add [options]

Options:
  --help                       Show help  [boolean]
  --connectionProfileName, -p  The connection profile name  [string]
  --businessNetworkName, -n    The business network name  [string] [required]
  --enrollId, -i               The enrollment ID of the user  [string] [required]
  --enrollSecret, -s           The enrollment secret of the user  [string]
  --data, -d                   Serialized participant JSON object as a string  [string] [required]
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

The serialized JSON representation of the participant to add to the participant
registry. The data must be valid according to the model of the participant.  
Example: `{"$class":"net.biz.digitalPropertyNetwork.Person","personId":"mae@biznet.org","firstName":"Mae","lastName":"Smith"}`
