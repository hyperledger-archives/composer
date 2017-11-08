---
layout: default
title: Hyperledger Composer Identity Issue Command
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Identity Issue Command
---

# Composer Identity Issue

---

The `composer identity issue` command issues a new identity to a participant in a participant registry relating to a business network. See the task [Issuing a new identity to a participant](../managing/identity-issue.html) for a walkthrough of using this command or the API.

## Syntax

```
$ composer identity issue

Business Network Cards
  --card, -c  Name of the network card to use for issuing  [string]
  --file, -f  The card file name for the new identity  [string]

Identity Options
  --newUserId, -u      The user ID for the new identity  [string]
  --participantId, -a  The participant to issue the new identity to  [string] [required]
  --issuer, -x         If the new identity should be able to issue other new identities  [boolean]

Options:
  --help             Show help  [boolean]
  -v, --version      Show version number  [boolean]
  --option, -o       Options that are specific specific to connection. Multiple options are specified by repeating this option  [string]
  --optionsFile, -O  A file containing options that are specific to connection  [string]

```

## Options

`--card, -c`

The name of the business network card to use to issue the identity.
Example: `admin@tutorial-network`

`--file, -f`

The file name of the card file to be created, note this is not the name of the identity to be created.
Example: `DanSelman`

`--newUserId, -u`
The user ID for the new identity, this is the name of the new identity.
Example: `Dan`

`--participantId, -a`
The fully qualified identifier (in URI form) of the participant that the identity should be issued to.  
Example: `resource:net.biz.tutorial-network.Person#DanSelman@biznet.org`

`--issuer, -x`
Whether the new identity will be able to issue other new identities.
