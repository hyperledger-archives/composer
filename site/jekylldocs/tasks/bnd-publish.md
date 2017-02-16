---
layout: default
title: Task - Publish Business Network Definition
category: tasks
sidebar: sidebars/tasks.md
excerpt: How to publish a business network definition for use by applications
---

# Publish the Business Network Definition for use by applications

---

The easiest way to publish a business network definition for use by applications it to push the business network definition to the `npm` package manager using the `npm publish` command. This will allow the applications that would like to use the business network definition (for example to deploy it via API) to reference the business network definition as a dependency in their `package.json` file.

Thanks to `npm` the dependency between the application and the business network definition is versioned, and if semantic versioning is used to update the version number of the business network definition then applications can safely reference the network.
