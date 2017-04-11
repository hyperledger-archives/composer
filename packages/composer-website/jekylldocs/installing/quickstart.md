---
layout: default
title: Fabric Composer Quickstart
category: start
sidebar: sidebars/installing.md
excerpt: Quickstart

---

# Fabric Composer Quickstart

---

Check that your system has the required software (at the required versions) installed:

**Operating Systems:** Ubuntu Linux 14.04 / 16.04 LTS (both 64-bit), or Mac OS 10.12

**Docker Engine:** Version 1.12.x

**Docker-Compose:** Version 1.8.x

**Node:** 6.x (note version 7 is not supported)

**npm:** 4.0.x

**git:** 2.9.x

If you need to update or install anything please refer to the install guides:
[Installing Prerequisites](../installing/prerequisites.md)

**Install the Composer command line tools:**

```
$ npm install -g composer-cli
```

**Clone the Sample Applications Git Repository:**

```
$ git clone https://github.com/fabric-composer/sample-applications.git
```

**Install the Getting Started Application:**

```
$ cd sample-applications/packages/getting-started
$ npm install
$ composer network list -n digitalproperty-network --enrollId admin --enrollSecret adminpw
```

The latter command returns details about the deployed digital property network such as name, models, registries etc.

***npm install***

`npm install` will run several scripts that are packaged into the getting-started repository. Presently, the Hyperledger Fabric v1 Docker YAML file used below is hlfv1/hlfv1_alpha-docker-compose.yml (non-TLS)

1. *scripts/download-hyperledger.sh* - This script pulls the required Hyperledger Fabric v1 Docker images.
2. *scripts/start-hyperledger.sh* - This uses the HLFv1 YAML file to bring up the Hyperledger Fabric v1 containers.
3. *composer archive create* - using Composer CLI, it creates an Business Network Archive (.bna) of the *npm* module *digitalproperty-network* and *archives* it into a file called *digitalPropertyNetwork.bna*.
4. *composer network deploy* - Deploys (in this case) the `digitalPropertyNetwork.bna` business network to the deployed Hyperledger Fabric v1 environment, using the default *defaultProfile* Composer connection profile.
5. *composer network list* - Lists the contents of a deployed business network.


There is [Reference material](https://fabric-composer.github.io/reference/commands.html) for Composer CLI

**Run the Getting Started Application:**

Run the `npm test` command. You should see output as below.

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
info: [Composer-GettingStarted] Fabric Composer: Getting Started appliation
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
