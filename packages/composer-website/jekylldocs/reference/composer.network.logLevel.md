---
layout: default
title: Hyperledger Composer Network loglevel
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Network loglevel
---

# {{site.data.conrefs.composer_full}} Network loglevel


The `composer network loglevel` command is used to return or define the log level of the composer runtime. If the `newlevel` option is specified it will change the current level to the specified value. If `newlevel` is not specified, this command will return the current logging level.

```
composer network loglevel -c admin@tutorial-network
```

### Options
```
Options:
  --help          Show help  [boolean]
  -v, --version   Show version number  [boolean]
  --newlevel, -l  the new logging level  [choices: "INFO", "WARNING", "ERROR", "DEBUG"]
  --card, -c      The cardname to use to change the log level the network  [string]
```
