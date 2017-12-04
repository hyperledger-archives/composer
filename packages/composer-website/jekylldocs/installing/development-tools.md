---
layout: default
title: Installing the development environment
category: start
section: installing
sidebar: sidebars/accordion-toc0.md
excerpt: To install the full development environment click [**Installing the development environment**](../installing/development-tools.html) here or in the table of contents on the left.
index-order: 202
---

# Installing the development environment

Follow these instructions to obtain the {{site.data.conrefs.composer_full}} development tools (primarily used to _create_ Business Networks) and stand up a {{site.data.conrefs.hlf_full}} (primarily used to _run/deploy_ your Business Networks locally).
Note that the Business Networks you create can also be deployed to {{site.data.conrefs.hlf_full}} runtimes in other environments e.g. on a cloud platform.


## Before you begin

Make sure you have installed the required pre-requisites, following the instructions in [**Installing pre-requisites**](../installing/installing-prereqs.html).

These instructions assume that you've not installed the tools and used them before.  If this is not the case, you might want to check that your previous setup is completely destroyed before you start following this guide.  To learn how to do this, skip to the [Appendix](#appendix).

> To provide flexibility and enable the maximum number of dev, test and deployment scenarios, {{site.data.conrefs.composer_short}} is delivered as a set of components you can install with `npm` and control from the CLI.  These instructions will tell you how to install everything first, then how to control your development environment.

# Installing components

### Step 1: Install the CLI tools
There are a few useful CLI tools for {{site.data.conrefs.composer_short}} developers.  The most important one is `composer-cli`, which contains all the essential operations, so we'll install that first.  Next, we'll also pick up `generator-hyperledger-composer`, `composer-rest-server` and `Yeoman` plus the `generator-hyperledger-composer`.  Those last 3 are not core parts of the development environment, but they'll be useful if you're following the tutorials or developing applications that interact with your Business Network, so we'll get them installed now.

1. Essential CLI tools:

        npm install -g composer-cli

2. Utility for running a REST Server on your machine to expose your business networks as RESTful APIs:

        npm install -g composer-rest-server

3. Useful utility for generating application assets:

        npm install -g generator-hyperledger-composer

4. Yeoman is a tool for generating applications, which utilises `generator-hyperledger-composer`:

        npm install -g yo

### Step 2: Install Playground
If you've already tried {{site.data.conrefs.composer_short}} online, you'll have seen the browser app "Playground".  You can run this locally on your development machine too, giving you a UI for viewing and demonstrating your business networks.

5. Browser app for simple editing and testing Business Networks:

        npm install -g composer-playground

### Step 3: Set up your IDE
Whilst the browser app _can_ be used to work on your Business Network code, most users will prefer to work in an IDE.  Our favourite is `VSCode`, because a {{site.data.conrefs.composer_short}} extension is available.

6. Install VSCode from this URL: [https://code.visualstudio.com/download](https://code.visualstudio.com/download)

7. Open VSCode, go to Extensions, then search for and install the `Hyperledger Composer` extension from the Marketplace.

### Step 4: Install {{site.data.conrefs.hlf_full}}
This step gives you a local {{site.data.conrefs.hlf_full}} runtime to deploy your business networks to.

8. In a directory of your choice (we will assume `~/fabric-tools`), get the `.zip` file that contains the tools to install {{site.data.conrefs.hlf_full}}:

        mkdir ~/fabric-tools && cd ~/fabric-tools

        curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.zip
        unzip fabric-dev-servers.zip

      A `tar.gz` is also available if you prefer: just replace the `.zip` file with `fabric-dev-servers.tar.gz1` and the `unzip` command with a `tar xvzf` command in the above snippet.


9. Use the scripts you just downloaded and extracted to download a local {{site.data.conrefs.hlf_full}} runtime:

        cd ~/fabric-tools
        ./downloadFabric.sh

> Congratulations, you've now installed everything required for the typical Developer Environment.
Read on to learn some of the most common things you'll do with this environment to develop and test your Blockchain Business Networks.

# Controlling your dev environment

## Starting and stopping {{site.data.conrefs.hlf_full}}
You control your runtime using a set of scripts which you'll find in `~/fabric-tools` if you followed the suggested defaults.  

The first time you start up a new runtime, you'll need to run the start script, then generate a PeerAdmin card:

        cd ~/fabric-tools
        ./startFabric.sh
        ./createPeerAdminCard.sh

You can start and stop your runtime using `~/fabric-tools/stopFabric.sh`, and start it again with `~/fabric-tools/startFabric.sh`.

At the end of your development session, you run `~/fabric-tools/stopFabric.sh` and then `~/fabric-tools/teardownFabric.sh`.  Note that if you've run the teardown script, the next time you start the runtime, you'll need to create a new PeerAdmin card just like you did on first time startup.

> The local runtime is intended to be frequently started, stopped and torn down, for development use.  If you're looking for a runtime with more persistent state, you'll want to run one outside of the dev environment, and deploy Business Networks to it.  Examples of this include running it via Kubernetes, or on a managed platform such as IBM Cloud.  For further details, see <INSERT LINK HERE>.

## Start the web app ("Playground")
To start the web app, run:

        composer-playground

It will typically open your browser automatically, at the following address: [http://localhost:8080/login](http://localhost:8080/login)

You should see the `PeerAdmin@hlfv1` Card you created with the `createPeerAdminCard` script on your "My Business Networks" screen in the web app: if you don't see this, you may not have correctly started up your runtime!

> Congratulations, you've got all the components running, and you also know how to stop and tear them down when you're done with your dev session.

## What Next?

- Learn how to use the web app UI with the [Playground Tutorial](../tutorials/playground-tutorial.html)
- Learn how to use the CLI and VSCode tools with the [Developer Tutorial](../tutorials/developer-tutorial.html)



<a name="appendix"></a>
# Appendix: destroy a previous setup
If you've previously used an older version of **{{site.data.conrefs.composer_full}}** and are now setting up a new install, you may want to kill and remove all previous Docker containers, which you can do with these commands:

        docker kill $(docker ps -q)
        docker rm $(docker ps -aq)
        docker rmi $(docker images dev-* -q)
