---
layout: default
title: Task - Deploy a Business Network
category: tasks
sidebar: sidebars/businessnetworks.md
excerpt: How to deploy a Business Network
---

# Deploying a Business Network

---

A business network is deployed using the `composer network deploy` command.

## Procedure

1. Before deploying a business network, a [Business Network Definition](../business-network/businessnetworkdefinition.html) is needed as a `zip` file with the following structure:

  ```
  BusinessNetworkArchive.zip
  ├── lib
  │   └── mozart.cto.js
  ├── models
  │   └── mozart.cto
  └── package.json
  ```

  -	_lib_ contains all of the transactions processor functions
  -	_models_ contains all of the model files written in the [CTO Language](../reference/cto_language.html).
  -	_package.json_ is required, and is used to create the [Business Network Definition](../business-network/businessnetworkdefinition.html)'s identifier

  You can use the `composer archive` command to create an archive with the correct format.

  **NOTE**: *Do not zip a a folder containing **lib**, **models**, and **package.json** to create an Business Network Archive, zip the contents themselves*

2. Start [Hyperledger Fabric Peer and Membership Service](runtime-start.md)

3. [Create a Connection Profile](../installing/createconnectionprofile.html) or do *not* use `-p` and allow {{site.data.conrefs.composer_full}} to create a `Default Connection Profile` for you.

4. Enter the command on a single line. For example:

  `composer network deploy -a <BusinessNetworkDefinition>.zip -i <Your EnrollmentID>`

5. Enter your Enrollment Secret when prompted.

  `prompt: What is the enrollment secret of the user?:`

6. When you see

  ```
  Deploying business network definition. This may take a little time.
  Command completed successfully.
  ```
    you have successfully deployed a business network!
