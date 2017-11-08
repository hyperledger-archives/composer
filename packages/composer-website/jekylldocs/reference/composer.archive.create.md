---
layout: default
title: Hyperledger Composer Archive Create CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Archive Create CLI
---

# {{site.data.conrefs.composer_full}} Archive Create

---

The `composer archive create` utility is used to create a business network archive from the contents of a directory.

To create an archive from source files (ie business network definition project files) present in the current 'working' directory:

```bash
composer archive create -a <business-network-archive>
```

or

to specify paths (to a source business network definition,  and a destination directory for the archive file (.bna file)):

```bash
composer archive create --sourceType dir --sourceName <dirpath> -a digitalproperty-network.bna
```

### Options

```
composer archive create --archiveFile digitialPropertyNetwork.zip --sourceType module --sourceName digitalproperty-network

Options:
  --help             Show help  [boolean]
  -v, --version      Show version number  [boolean]
  --archiveFile, -a  Business network archive file name. Default is based on the Identifier of the BusinessNetwork  [string]
  --sourceType, -t   The type of the input containg the files used to create the archive [ module | dir ]  [required]
  --sourceName, -n   The Location to create the archive from e.g. NPM module directory or Name of the npm module to use  [required]
Only one of either inputDir or moduleName must be specified.
```

## Example Command and Output

```
$ pwd
/Users/dselman/dev/temp

composer archive create --sourceType dir --sourceName . -a dist/digitalproperty-network.bna

Creating Business Network Archive
Looking for package.json of Business Network Definition in /Users/dselman/dev/temp/dist

Description:Digital Property Network
Name:digitalproperty-network
Identifier:digitalproperty-network@0.0.1

Written Business Network Definition Archive file to digitalproperty-network@0.0.1.bna
Command completed successfully.
```
