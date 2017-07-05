---
layout: default
title: Hyperledger Composer Network logLevel
section: reference-command
sidebar: sidebars/accordion-toc.md
excerpt: Composer Network logLevel
---

# {{site.data.conrefs.composer_full}} Network logLevel


The `composer network logLevel` command is used to return or define the log level of the composer runtime. If the `newlevel` option is specified it will change the current level to the specified value. If `newlevel` is not specified, this command will return the current logging level.

```
composer network logLevel -n <business-network-name> -p <connection-profile-name> -l <new-log-level> -i <enrollment-ID> -s <enrollment-secret>
```

### Options
```
--help                       Show help  [boolean]
-v, --version                Show version number  [boolean]
--businessNetworkName, -n    The business network name  [string] [required]
--connectionProfileName, -p  The connection profile name  [string] [required]
--newlevel, -l               the new logging level (INFO/WARNING/ERROR/DEBUG)  [string]
--enrollId, -i               The enrollment ID of the user  [string] [required]
--enrollSecret, -s           The enrollment secret of the user  [string]
```
