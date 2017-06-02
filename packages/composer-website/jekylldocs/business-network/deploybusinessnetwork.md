---
layout: default
title: Task - Deploy a Business Network Definition
category: tasks
sidebar: sidebars/businessnetworks.md
excerpt: How to deploy a Business Network
---

# Deploying a Business Network

---

A business network definition is deployed using the `composer network deploy` command. You can use the `composer archive` command to create an archive with the correct format.

1. [Create a Connection Profile](../reference/connectionprofile.html)

2. Enter the command on a single line. For example:

        composer network deploy -p connectionProfileName -a <BusinessNetworkDefinition>.bna -i <Your EnrollmentID>

3. Enter your Enrollment Secret when prompted.