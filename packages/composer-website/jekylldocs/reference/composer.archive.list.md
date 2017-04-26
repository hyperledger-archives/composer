---
layout: default
title: Hyperledger Composer Archive List CLI
category: reference
sidebar: sidebars/reference.md
excerpt: Composer Archive List CLI
---

# {{site.data.conrefs.composer_full}} Archive List

---

The `composer archive list` utility is used to verify the structure of a business network archive on disk and print metdata.

```
composer archive list -a <business-network-archive>
```

### Options
```
--help             Show help  [boolean]
  -v, --version      Show version number  [boolean]
  --archiveFile, -a  Business network archive file name.  [string]
```

## Example Output

```
composer archive list -a digitalPropertyNetwork.zip
Listing Business Network Archive from digitalPropertyNetwork.zip
Identifier:digitalproperty-network@0.0.1
Name:digitalproperty-network
Version:0.0.1
Command completed successfully.
```
