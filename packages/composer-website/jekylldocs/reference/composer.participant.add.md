---
layout: default
title: Hyperledger Composer Participant Add Command
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Participant Add Command
---

# Composer participant add

---

The `composer participant add` command adds a new instance of a participant to a participant registry. See the task [Add a Participant](../managing/participant-add.html) for a walkthrough of using this command or the API.

The `data` option must contain a serialized JSON representation of the participant to add, and must be wrapped in single quotes.

## Syntax

```
$ composer participant add
composer participant add [options]

Participant options
  --card, -c  The cardname to use to add the participant  [string] [required]
  --data, -d  Serialized participant JSON object as a string  [string] [required]

Options:
  --help         Show help  [boolean]
  -v, --version  Show version number  [boolean]
```

## Options

`--card, -c`
The business network card, defining the business network and identity to use.
Example: `admin@tutorial-network`

`--data, -d`
The serialized JSON representation of the participant to add to the participant registry. The data must be valid according to the model of the participant.  

Example: `'{"$class":"net.biz.digitalPropertyNetwork.Person","personId":"mae@biznet.org","firstName":"Mae","lastName":"Smith"}'`
