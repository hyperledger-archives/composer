---
layout: default
title: Uninstalling the development environment
category: start
section: installing
sidebar: sidebars/accordion-toc0.md
excerpt: To uninstall the full development environment click [**Uninstalling the development environment**](../installing/uninstall-dev-env.html) here or in the table of contents on the left.
index-order: 204
---

# Uninstall the development environment

Follow these instructions if you have already installed the {{site.data.conrefs.composer_full}} development tools, and you wish to uninstall them. You may want to do this if you wish to update your existing development environment to an incompatible version of {{site.data.conrefs.composer_full}} (for example, from v0.16.x to v0.19.x), or you no longer require a development environment.

## Before you begin

These instructions assume that you've installed the development tools and used them before. If you have not installed the development tools before, then there's nothing to do here!

# Uninstalling components

### Step 1: Uninstall the CLI tools

Any running instances of the CLI tools should be stopped before continuing. If you have any running instances of the {{site.data.conrefs.composer_short}} REST server, ensure that those instances are stopped before continuing. You can look for the process `composer-rest-server` if you are not sure if there are any running instances.

1. Uninstall the currently installed version of all the CLI tools:

        npm uninstall -g composer-cli composer-rest-server generator-hyperledger-composer

### Step 2: Uninstall Playground

If you have installed the browser app "Playground" on your development machine, you will need to uninstall this as well. If you have any running instances of the browser app, ensure that those instances are stopped before continuing. You can look for the process `composer-playground` if you are not sure if there are any running instances.

1. Uninstall the currently installed version of the browser app:

        npm uninstall -g composer-playground

### Step 3: Remove the business network card store

Business network cards are stored in a business network card store, which by default is a directory in the current users home directory. Delete this directory to remove all business network cards. Be warned that this will also delete all identities (public certificates and private keys) that are stored in the business network card store, so you may wish to back them up before continuing!

1. Remove the business network card store:

        rm -rf ~/.composer

### Step 4: Uninstall {{site.data.conrefs.hlf_full}}

You control your local {{site.data.conrefs.hlf_full}} runtime using a set of scripts which you'll find in `~/fabric-dev-servers` if you followed the suggested defaults.

1. Stop the local {{site.data.conrefs.hlf_full}} runtime and remove any runtime Docker containers or images:

        {{site.data.conrefs.export_fabric_version_command}}
        ~/fabric-dev-servers/stopFabric.sh
        ~/fabric-dev-servers/teardownFabric.sh

2. Uninstall the local {{site.data.conrefs.hlf_full}} runtime:

        rm -rf ~/fabric-dev-servers

> Congratulations, you have uninstalled your development environment. To continue developing your blockchain applications, you will need to install the development tools from scratch.

## What Next?

- Install the development tools again by following [Installing the development environment](./development-tools.html)
