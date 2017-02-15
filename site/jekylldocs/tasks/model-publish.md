---
layout: default
title: Task - Publish Domain Model
category: tasks
sidebar: sidebars/tasks.md
excerpt: How to publish a domain model for use in a business network
---

# Publish a Business Domain Model

---

The easiest way to publish a domain model for reuse by business network definitions is to define your domain model as an `npm` package. You should create a `package.json` file in the root of you project and include the relevant information. The example packages a set of CTO files for reuse as `digitalproperty-model` with version `0.0.1`. In addition the `license-check` Node module is used to ensure that the CTO files have a valid license header.

```
{
  "name": "digitalproperty-model",
  "version": "0.0.1",
  "description": "Digital Property Network",
  "scripts": {
    "licchk": "license-check"
  },
  "repository": {
    "type": "git",
    "url": "https://github.ibm.com/Blockchain-WW-Labs/DigitalProperty-Model.git"
  },"main": "index.js",
  "keywords": [
    "property",
    "land",
    "compliance"
  ],
  "author": "IBM",
  "license": "ISC",
  "devDependencies": {
    "license-check": "^1.1.5"
  },
  "publishConfig": {
    "registry": "https://npm-registry.whitewater.ibm.com"
  },
  "license-check-config": {
    "src": [
      "**/*.cto"
    ],
    "path": "header.txt",
    "blocking": true,
    "logInfo": false,
    "logError": true
  }
}
```
