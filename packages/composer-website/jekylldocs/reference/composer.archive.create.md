---
layout: default
title: Hyperledger Composer Archive Create CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Archive Create CLI
---

# {{site.data.conrefs.composer_full}} Archive Create

---

The `composer archive create` utility is used to create a business network archive from the contents of a root directory.

```
composer archive create -a <business-network-archive>
```

### Options
```
--help             Show help  [boolean]
  -v, --version      Show version number  [boolean]
  --archiveFile, -a  Business network archive file name. Default is based on the Identifier of the BusinessNetwork  [string]
  --inputDir, -d     Location to create the archive from e.g. NPM module directory
  --moduleName, -m   Name of the npm module to use

Only one of either inputDir or moduleName must be specified.
```

## Example Output

```
composer archive create -d .
Creating Business Network Archive
Looking for package.json of Business Network Definition in /Users/dselman/dev/temp

Description:Digital Property Network
Name:digitalproperty-network
Identifier:digitalproperty-network@0.0.1

Written Business Network Definition Archive file to digitalproperty-network@0.0.1.bna
Command completed successfully.
```
