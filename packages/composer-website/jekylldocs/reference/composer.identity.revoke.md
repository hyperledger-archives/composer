---
layout: default
title: Hyperledger Composer Identity Revoke Command
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Identity Revoke Command
---

# composer identity revoke

---

The `composer identity revoke` command revokes an existing identity from a participant in a
participant registry. See the task [Revoke an Identity from a Participant](../managing/identity-revoke.html)
for a walkthrough of using this command or the API.

## Syntax

```
$ composer identity revoke
composer identity revoke [options]

Options:
  --help                      Show help  [boolean]
  -v, --version               Show version number  [boolean]
  --card, -c                  Name of the network card to use  [string] [required]
  --identityId, -u, --userId  The unique identifier of the identity to revoke  [string] [required]
```

## Options
`--card, -c`
The business network card to use to revoke the specified identity.
Example: `admin@tutorial-network`

`--identityId, -u`

The unique identifier of the existing identity that should be revoked.  
Example: `f1c5b9fe136d7f2d31b927e0dcb745499aa039b201f83fe34e243f36e1984862`
