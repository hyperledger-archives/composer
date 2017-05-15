---
layout: default
title: Task - Deploy a Business Network Definition
category: tasks
sidebar: sidebars/businessnetworks.md
excerpt: How to deploy a Business Network
---

# Deploying a Business Network

---

A business network definition is deployed using the `composer network deploy` command.

# Before you begin

Before deploying a business network, a [Business Network Definition](../business-network/businessnetworkdefinition.html) is needed as a `zip` file with the following structure:

```
BusinessNetworkArchive.zip
├── lib
│   └── mozart.cto.js
├── models
│   └── mozart.cto
└── package.json
```
<!--
You can use the `composer archive` command to create an archive with the correct format.

**NOTE**: *Do not zip a a folder containing **lib**, **models**, and **package.json** to create an Business Network Archive, zip the contents themselves*
-->

## Procedure

1. Start [Hyperledger Fabric Peer and Membership Service](runtime-start.md).

2. [Create a Connection Profile](../installing/createconnectionprofile.html) or do *not* use `-p` and allow {{site.data.conrefs.composer_full}} to create a `Default Connection Profile` for you.

3. Enter the command on a single line. For example:

        `composer network deploy -a <BusinessNetworkDefinition>.zip -i <Your EnrollmentID>`

4. Enter your Enrollment Secret when prompted.

5. When you see

        ```
        Deploying business network definition. This may take a little time.
        Command completed successfully.
        ```
  the business network definition has been successfully deployed.
