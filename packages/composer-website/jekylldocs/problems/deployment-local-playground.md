---
layout: default
title: Error using the local Playground
category: tasks
sidebar: sidebars/accordion-toc0.md
---

# Errors deploying a business network to a local fabric using the {{site.data.conrefs.composer_full}} Playground

When deploying a business network to an instance of {{site.data.conrefs.hlf_full}} by using a locally installed {{site.data.conrefs.composer_full}} Playground, you may encounter the following error:

```
Error: error trying to list instantiated chaincodes. Error: chaincode error (status 500, message: Authorization for GETCHAINCODES on channel getchaincodes has been denied with error Failed verifying that proposal's creator satisfies local MSP principal during channelless check policy with policy [Admins]:[This identity is not an admin])
```

Once this error has occurred, you must delete your local browser storage to restore normal function. *Please note*: Deleting local browser storage will delete your connection profile and identities in your wallet.

## What causes the error

The error occurs if both the identity you are using to deploy the business network does not have network-level access control, and the instance of {{site.data.conrefs.hlf_full}} does not have a deployed business network with the name `org-acme-biznet`.

## Fixes for the error

If you attempt to deploy a network using an identity which does not have network-level access control, and the instance of {{site.data.conrefs.hlf_full}} does not have a business network called `org-acme-biznet` deployed, you must delete your local browser storage. This will delete the connection profile and the identities.

## How to avoid the error

When using the a local instance of the {{site.data.conrefs.composer_full}} Playground to deploy a business network to a local {{site.data.conrefs.hlf_full}} instance, you must use an identity which has [network-level access control](../reference/acl_language.html). If an identity without network-level access control is used, there must be a business network with the name `org-acme-biznet` deployed to the instance of {{site.data.conrefs.hlf_full}} being used.
