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
  --help                 Show help  [boolean]
  -v, --version          Show version number  [boolean]
  --card, -c             Name of the network card to use  [string] [required]
  --participantId, -a    The particpant to issue the new identity to  [string] [required]
  --certificateFile, -c  File containing the certificate  [string] [required]
```

## Options

`--card, -c`

Name of the business network card to use.
Example: `admin@sample-network`

`--certificateFile, -c`

The path a file containing the certificate for the existing identity in PEM format.  
Example: `/tmp/cert.pem`

`--participantId, -a`

The fully qualified identifier of the participant that the identity should be issued to.  
Example: `resource:net.biz.digitalPropertyNetwork.Person#lenny@biznet.org`
