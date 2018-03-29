---
layout: default
title: Updating the Hyperledger Composer Runtime
category: tasks
section: managing
sidebar: sidebars/accordion-toc0.md
excerpt: To [update Hyperledger Composer](./updating-composer.html) to a new version, the Hyperledger Composer components must be uninstalled and reinstalled using npm.
index-order: 809
---

# Updating {{site.data.conrefs.composer_full}} Runtime

After deploying {{site.data.conrefs.composer_full}} you may wish to update to a new version. To update your installed version of {{site.data.conrefs.composer_full}} you must uninstall the client, admin, and runtime CLI components and reinstall them by using npm.

## Procedure

1. Uninstall the {{site.data.conrefs.composer_full}} components by using the following commands (where 'x' is your currently installed version):

        npm uninstall -g composer-cli@0.16.x
        npm uninstall -g composer-rest-server@0.16.x
        npm uninstall -g generator-hyperledger-composer@0.16.x

2. Install the 0.16.x (where 'x' is your desired version) tagged version of the {{site.data.conrefs.composer_full}} components by using the following commands:

        npm install -g composer-cli@0.16.x
        npm install -g composer-rest-server@0.16.x
        npm install -g generator-hyperledger-composer@0.16.x


## What next?

- [Defining a business network](../business-network/bnd-create.html)
- [Modeling language](../reference/cto_language.html)
- [Managing your solution](./managingindex.html)
