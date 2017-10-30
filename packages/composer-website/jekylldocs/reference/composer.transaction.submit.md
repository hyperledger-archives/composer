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

---

## Syntax

```
$ composer transaction submit
composer transaction submit [options]

Options:
  --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  -c, --card                   The name of the business network card to use [string] [required]
  --data, -d                   Transactions JSON object as a string  [string] [required]
```
---
## Options

`--card, -c`
The name of the business network card to use. The business network card is used to determine connection and business network details.
Example: `admin@tutorial-network`

`--data, -d`

The serialized JSON representation of the transaction to send to the business network. The data must be valid according to the model of the transaction.  
Example: `{"$class":"net.biz.digitalPropertyNetwork.RegisterPropertyForSale","transactionId":"TRANSACTION_001","seller":"mae@biznet.org","title":"TITLE_001"}`

## Example command

This command submits a transaction on the connection profile `defaultProfile` to the business network `digitalproperty-network` with the user identity `maeid1`, the user secret `Xurw3yU9zI0l`. The transaction submitted is `'{"$class":"net.biz.digitalPropertyNetwork.RegisterPropertyForSale","transactionId":"TRANSACTION_001","seller":"mae@biznet.org","title":"TITLE_001"}'`.

Here is the entire command:

```
composer transaction submit -p defaultProfile -n digitalproperty-network -i maeid1 -s Xurw3yU9zI0l -d '{"$class":"net.biz.digitalPropertyNetwork.RegisterPropertyForSale","transactionId":"TRANSACTION_001","seller":"mae@biznet.org","title":"TITLE_001"}'
```
