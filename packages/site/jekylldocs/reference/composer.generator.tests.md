---
layout: default
title: Fabric Composer Generator CLI
category: reference
sidebar: sidebars/reference.md
excerpt: Generator CLI
---

# Fabric Composer Generator

---

The `composer generator` utility is used to automatically generate parts of your project from your business network archive.

## Tests
`composer generator tests` generates a framework for testing the transactions in the business network archive. The test file uses `mocha` and `chai` and will be saved

```
composer generator tests -d <project-directory> -a <business-network-archive> -i <enrollment-id> -s <enrollment-secret>
```

### Options
```
--help                        Show help  [boolean]
--projectDir, -d              The directory of your your concerto project  [string] [required]
--networkArchiveLocation, -a  The location of the network archive zip file  [string] [required]
--testDirName -t              The name of the projects test directory  [string] [optional] default: test
--enrollId, -i                The enrollment ID of the user  [string] [required]
--enrollSecret, -s            The enrollment secret of the user  [string]
```
