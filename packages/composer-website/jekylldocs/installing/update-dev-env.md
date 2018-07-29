---
layout: default
title: Updating the development environment
category: start
section: installing
sidebar: sidebars/accordion-toc0.md
excerpt: To update the full development environment click [**Updating the development environment**](../installing/update-dev-env.html) here or in the table of contents on the left.
index-order: 203
---

# Updating the development environment

Follow these instructions if you have already installed the {{site.data.conrefs.composer_full}} development tools, and you wish to update your installation to the latest version of {{site.data.conrefs.composer_full}}.

## Before you begin

These instructions assume that you've installed the development tools and used them before. If you have not installed the development tools before, then follow the instructions in [**Installing the development environment**](./development-tools.html).

# Updating components

### Step 1: Update the CLI tools

Any running instances of the CLI tools should be stopped before continuing. If you have any running instances of the {{site.data.conrefs.composer_short}} REST server, ensure that those instances are stopped before continuing. You can look for the process `composer-rest-server` if you are not sure if there are any running instances.

1. Uninstall the currently installed version of all the CLI tools:

        npm uninstall -g composer-cli composer-rest-server generator-hyperledger-composer

2. Install the latest version of all of the CLI tools:

        npm install -g composer-cli@{{site.data.conrefs.composer_version}} composer-rest-server@{{site.data.conrefs.composer_version}} generator-hyperledger-composer@{{site.data.conrefs.composer_version}}

### Step 2: Update Playground

If you have installed the browser app "Playground" on your development machine, you will need to update this as well. If you have any running instances of the browser app, ensure that those instances are stopped before continuing. You can look for the process `composer-playground` if you are not sure if there are any running instances.

1. Uninstall the currently installed version of the browser app:

        npm uninstall -g composer-playground

2. Install the latest version of the browser app:

        npm install -g composer-playground@{{site.data.conrefs.composer_version}}

> Congratulations, you have updated your development environment with the latest version of the development tools. You can now continue developing your blockchain applications using the latest features and bug fixes!

## What Next?

- Learn how to use the web app UI with the [Playground Tutorial](../tutorials/playground-tutorial.html)
- Learn how to use the CLI and VSCode tools with the [Developer Tutorial](../tutorials/developer-tutorial.html)
