---
layout: default
title: Hyperledger Composer Quickstart
category: start
sidebar: sidebars/installing.md
excerpt: Quickstart

---

# {{site.data.conrefs.composer_full}} Quickstart

---

The steps below enable you to get started with the Composer sample application.

You can choose to install the latest  **v0.6** Composer sample application (uses a Hyperledger Fabric v0.6 environment) or the **v1.0** sample application (uses a Hyperledger Fabric v1.0 environment) and give us feedback.


**1. Check that your system has the required software (at the required versions) installed:**

**Operating Systems:** Ubuntu Linux 14.04 / 16.04 LTS (both 64-bit), or Mac OS 10.12

**Docker Engine:** Version 1.12.x

**Docker-Compose:** Version 1.8.x

**Node:** 6.x (note version 7 is not supported)

**npm:** 4.0.x

**git:** 2.9.x

If you need to update or install any pre-reqs, please refer to the install guides:
[Installing Pre-requisites](../installing/prerequisites.md)

**2. Install the Composer command line tools:**

```
$ npm install -g composer-cli
```

**3. Clone the Composer Sample Applications Git repository:**

In this step, **choose from either the v0.6 sample application or the v1.0 sample application** - the former will stand up a Hyperledger Fabric v0.6 environment ; the latter will stand up a newer Hyperledger Fabric v1.0 environment using a docker command sequence.

**v0.6**

```
$ git clone https://github.com/hyperledger/composer-sample-applications.git
```

**v1.0**

```
$ git clone https://github.com/hyperledger/composer-sample-applications-hlfv1.git
```

**4. Install the Getting Started Application:**

Change directory to the Composer sample application repository (v0.6 or v1.0) you wish to install - choose one of the following:

**v0.6**

```
$ cd composer-sample-applications/packages/getting-started
$ npm install
```
**v1.0**

```
$ cd composer-sample-applications-hlfv1/packages/getting-started
$ npm install
```

Amongst the steps (described below), the command returns information about the deployed digital property network such as name, models, registries etc.

***npm install***

`npm install` will run several scripts that are packaged into the getting-started directory and uses the docker-compose .yml file mentioned below to pull/download the relevant Hyperledger Fabric docker images.

1. *scripts/download-hyperledger.sh* - This script pulls the required Hyperledger Fabric Docker images (v0.6 or v1.0, depending on the sample application repository cloned earlier).
2. *scripts/start-hyperledger.sh* - This uses the Docker yaml file to bring up the Hyperledger Fabric containers.
3. *composer archive create* - using Composer CLI, it creates an Business Network Archive (.bna) of the *npm* module *digitalproperty-network* and *archives* it into a file called *digitalPropertyNetwork.bna*.
4. *composer network deploy* - Deploys (in this case) the `digitalPropertyNetwork.bna` business network to the deployed Hyperledger Fabric environment, using the default Composer connection profile.
5. *composer network list* - Lists the contents of a deployed business network.


There is [Reference material](https://fabric-composer.github.io/reference/commands.html) for Composer CLI

**5. Run the Getting Started Application:**

Run the `npm test` command. You should see output similar to that shown below (output below is for a v0.6 sample application)

```bash
$ npm test
> getting-started@1.0.0 test /home/ibm/samples/sample-applications/packages/getting-started
> mocha --recursive && npm run bootstrapAssets && npm run listAssets && npm run submitTransaction


  Default
    #sample test
      ✓ should pass


  1 passing (8ms)


    > getting-started@1.0.0 bootstrapAssets /home/ibm/samples/sample-applications/packages/getting-started
> node cli.js landregistry bootstrap

info: [Composer-GettingStarted] Fabric Composer: Getting Started application
info: [Composer-GettingStarted] Adding default land titles to the asset registry
info: [Composer-GettingStarted] LandRegistry:<init> businessNetworkDefinition obtained digitalproperty-network@0.0.6
info: [Composer-GettingStarted] LandRegistry:_bootstrapTitles getting asset registry for "net.biz.digitalPropertyNetwork.LandTitle"
info: [Composer-GettingStarted] about to get asset registry
info: [Composer-GettingStarted] LandRegistry:_bootstrapTitles got asset registry
info: [Composer-GettingStarted] LandRegistry:_bootstrapTitles getting factory and adding assets
info: [Composer-GettingStarted] LandRegistry:_bootstrapTitles Creating a person
info: [Composer-GettingStarted] LandRegistry:_bootstrapTitles Creating a land title#1
info: [Composer-GettingStarted] LandRegistry:_bootstrapTitles Creating a land title#2
info: [Composer-GettingStarted] LandRegistry:_bootstrapTitles Adding these to the registry
info: [Composer-GettingStarted] Default titles added
info: [Composer-GettingStarted] Command completed successfully.

> getting-started@1.0.0 listAssets /home/ibm/samples/sample-applications/packages/getting-started
> node cli.js landregistry list

info: [Composer-GettingStarted] Fabric Composer: Getting Started application
info: [Composer-GettingStarted] LandRegistry:<init> businessNetworkDefinition obtained digitalproperty-network@0.0.6
info: [Composer-GettingStarted] listTitles Getting the asset registry
info: [Composer-GettingStarted] listTitles Getting all assets from the registry.
info: [Composer-GettingStarted] listTitles Current Land Titles
info: [Composer-GettingStarted] Titles listed
info: [Composer-GettingStarted]

┌──────────┬────────────────┬────────────┬─────────┬─────────────────────────────┬─────────┐
│ TitleID  │ OwnerID        │ First Name │ Surname │ Description                 │ ForSale │
├──────────┼────────────────┼────────────┼─────────┼─────────────────────────────┼─────────┤
│ LID:1148 │ PID:1234567890 │ Fred       │ Bloggs  │ A nice house in the country │ No      │
├──────────┼────────────────┼────────────┼─────────┼─────────────────────────────┼─────────┤
│ LID:6789 │ PID:1234567890 │ Fred       │ Bloggs  │ A small flat in the city    │ No      │
└──────────┴────────────────┴────────────┴─────────┴─────────────────────────────┴─────────┘

info: [Composer-GettingStarted] Command completed successfully.

> getting-started@1.0.0 submitTransaction /home/ibm/samples/sample-applications/packages/getting-started
> node cli.js landregistry submit && node cli.js landregistry list

info: [Composer-GettingStarted] Fabric Composer: Getting Started application
info: [Composer-GettingStarted] LandRegistry:<init> businessNetworkDefinition obtained digitalproperty-network@0.0.6
info: [Composer-GettingStarted] updateForSale Getting assest from the registry.
info: [Composer-GettingStarted] updateForSale Submitting transaction
info: [Composer-GettingStarted] Transaction Submitted
info: [Composer-GettingStarted] Command completed successfully.
info: [Composer-GettingStarted] Fabric Composer: Getting Started application
info: [Composer-GettingStarted] LandRegistry:<init> businessNetworkDefinition obtained digitalproperty-network@0.0.6
info: [Composer-GettingStarted] listTitles Getting the asset registry
info: [Composer-GettingStarted] listTitles Getting all assets from the registry.
info: [Composer-GettingStarted] listTitles Current Land Titles
info: [Composer-GettingStarted] Titles listed
info: [Composer-GettingStarted]


┌──────────┬────────────────┬────────────┬─────────┬─────────────────────────────┬─────────┐
│ TitleID  │ OwnerID        │ First Name │ Surname │ Description                 │ ForSale │
├──────────┼────────────────┼────────────┼─────────┼─────────────────────────────┼─────────┤
│ LID:1148 │ PID:1234567890 │ Fred       │ Bloggs  │ A nice house in the country │ Yes     │
├──────────┼────────────────┼────────────┼─────────┼─────────────────────────────┼─────────┤
│ LID:6789 │ PID:1234567890 │ Fred       │ Bloggs  │ A small flat in the city    │ No      │
└──────────┴────────────────┴────────────┴─────────┴─────────────────────────────┴─────────┘

info: [Composer-GettingStarted] Command completed successfully.

```

***npm test***

1. `mocha --recursive` - Runs all unit tests in the */tests* directory.
2. `node cli.js landregistry bootstrap` - Run the bootstrap command to create two land titles owned by Fred Bloggs.
3. `node cli.js landregistry list` - Run the list command to list all of the assets in the LandTitles asset registry.
4. `node cli.js landregistry submit` - Run the submit command to submit a transaction that changes LandTitle *LID:1148*'s *ForSale*' property to *Yes*.

**Where next?**

* Learn more about the Digital Property Network and running the tests in the first [Getting Started Tutorial](../tutorials/getting-started-cmd-line.md)
