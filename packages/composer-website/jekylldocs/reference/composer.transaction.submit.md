---
layout: default
title: Hyperledger Composer Transaction Submit Command
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Transaction Submit Command
---

# composer transaction submit

---

The `composer transaction submit` command submits a transaction to a business network.
<!-- There will be a link to a conceptual topic about transactions here when it's written. -->

---

## Syntax

```
$ composer transaction submit
composer transaction submit [options]

Options:
  --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  --connectionProfileName, -p  The connection profile name  [string]
  --businessNetworkName, -n    The business network name  [string] [required]
  --enrollId, -i               The enrollment ID of the user  [string] [required]
  --enrollSecret, -s           The enrollment secret of the user  [string]
  --data, -d                   Transactions JSON object as a string  [string] [required]
```
---
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

The serialized JSON representation of the transaction to send to the business network. The data must be valid according to the model of the transaction.  
Example: `{"$class":"net.biz.digitalPropertyNetwork.RegisterPropertyForSale","transactionId":"TRANSACTION_001","seller":"mae@biznet.org","title":"TITLE_001"}`

## Example command

This command submits a transaction on the connection profile `defaultProfile` to the business network `digitalproperty-network` with the user identity `maeid1`, the user secret `Xurw3yU9zI0l`. The transaction submitted is `'{"$class":"net.biz.digitalPropertyNetwork.RegisterPropertyForSale","transactionId":"TRANSACTION_001","seller":"mae@biznet.org","title":"TITLE_001"}'`.

Here is the entire command:

```
composer transaction submit -p defaultProfile -n digitalproperty-network -i maeid1 -s Xurw3yU9zI0l -d '{"$class":"net.biz.digitalPropertyNetwork.RegisterPropertyForSale","transactionId":"TRANSACTION_001","seller":"mae@biznet.org","title":"TITLE_001"}'
```
