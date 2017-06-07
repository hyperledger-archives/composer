---
layout: default
title: Task - Deploying and Updating Business Networks
category: tasks
sidebar: sidebars/businessnetworks.md
excerpt: How to deploy or update Business Networks
---

# Deploying and Updating Business Networks

---

Before a business network definition can be deployed it must be packaged into a _Business Network Archive_ (BNA) file. The `composer archive create` command is used to create a BNA file from a root folder on disk.

Once the BNA file has been created it can be deployed to a runtime using the `composer network deploy` command using a suitable [Connection Profile](../reference/connectionprofile.html)

For example:

        composer network deploy -p connectionProfileName -a <BusinessNetworkDefinition>.bna 
           -i <Your EnrollmentID> -s <Your EnrollmentSecret>

To update the definition of an already deployed business network use the `composer network update` CLI command.

## References

* [**Composer CLI commands**](../reference/commands.html)
