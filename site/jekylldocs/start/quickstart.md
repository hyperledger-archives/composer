---
layout: default
title: Fabric Composer Quickstart
category: start
sidebar: sidebars/quickstart_sidebar.md
excerpt: Quickstart

---

# Fabric Composer Quickstart

---

Check that your system has the required software (at the required versions) installed:

**Operating Systems:** Ubuntu Linux 14.04 LTS (64-bit) or Mac OS 10.12

**Docker Engine:** Version 1.12.x

**Docker-Compose:** Version 1.8.x

**Node:** 4.6.x or 6.x

**npm:** 4.0.x

If you need to update or install anything please refer to the install guides:
[Installing Prerequisites](../tasks/prerequisites.md)

**Clone the Sample Applications Repository:**

```
npm install -g composer-cli
git clone https://github.com/fabric-composer/sample-applications.git
```

**Install the Getting Started Application:**

```
cd sample-applications/
cd packages
cd getting-started
npm install
```

***npm install***

`npm install` will run several scripts that are packaged into the getting-started repository. 

<small>[Reference material](https://fabric-composer.github.io/reference/commands.html) for Composer CLI</small>

1. *scripts/download-hyperledger.sh* - This kills any docker images started with the */scripts/docker-compose.yml* file, remove the current default connection profile, *~/.composer-connection-profiles/defaultProfile* and pull the required Hyperledger Fabric base image.
2. *scripts/start-hyperledger.sh* - This uses the */scripts/docker-compose.yml* by running `docker-compose up -d --build` to create a Hyperledger Fabric peer and memebership service docker container.
3. `composer archive create -m digitalproperty-network --archiveFile digitalPropertyNetwork.bna` - using Composer CLI, create an archive of the *npm* module *digitalproperty-network* and *archive* it into a `digitalPropertyNetwork.bna`.
4. `composer network deploy --archiveFile digitalPropertyNetwork.bna  --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d` - Deploy the `digitalPropertyNetwork.bna` business network to the deployed fabric using the *defaultProfile* connection progfile.
5. `composer network list -n digitalproperty-network --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d` - Lists the contents of a deployed business network.

**Run the Getting Started Application:**

Run the `npm test` command. You should see output as below.

```
> getting-started@1.0.0 test /Users/dselman/dev/git/sample-applications/packages/getting-started
> mocha --recursive && npm run bootstrapAssets && npm run listAssets && npm run submitTransaction


  Default
    #sample test
      ✓ should pass


  1 passing (8ms)


> getting-started@1.0.0 bootstrapAssets /Users/dselman/dev/git/sample-applications/packages/getting-started
> node cli.js landregistry bootstrap

info: [Composer-GettingStarted] Fabric Composer: Getting Started appliation
info: [Composer-GettingStarted] Adding default land titles to the asset registry
info: [Composer-GettingStarted] LandRegistry:<init> businessNetworkDefinition obtained digitalproperty-network@0.0.1
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

> getting-started@1.0.0 listAssets /Users/dselman/dev/git/sample-applications/packages/getting-started
> node cli.js landregistry list

info: [Composer-GettingStarted] Fabric Composer: Getting Started appliation
info: [Composer-GettingStarted] LandRegistry:<init> businessNetworkDefinition obtained digitalproperty-network@0.0.1
info: [Composer-GettingStarted] listTitles Getting the asset registry
info: [Composer-GettingStarted] listTitles Getting all assest from the registry.
info: [Composer-GettingStarted] listTitles Current Land Titles
info: [Composer-GettingStarted] Titles listed
info: [Composer-GettingStarted]
┌──────────┬────────────────┬────────────┬─────────┬─────────────────────────────┬─────────┐
│ TitleID  │ OwnerID        │ First Name │ Surname │ Description                 │ ForSale │
├──────────┼────────────────┼────────────┼─────────┼─────────────────────────────┼─────────┤
│ LID:6789 │ PID:1234567890 │ Fred       │ Bloggs  │ A small flat in the city    │ No      │
├──────────┼────────────────┼────────────┼─────────┼─────────────────────────────┼─────────┤
│ LID:1148 │ PID:1234567890 │ Fred       │ Bloggs  │ A nice house in the country │ No      │
└──────────┴────────────────┴────────────┴─────────┴─────────────────────────────┴─────────┘
info: [Composer-GettingStarted] Command completed successfully.

> getting-started@1.0.0 submitTransaction /Users/dselman/dev/git/sample-applications/packages/getting-started
> node cli.js landregistry submit && node cli.js landregistry list

info: [Composer-GettingStarted] Fabric Composer: Getting Started appliation
info: [Composer-GettingStarted] LandRegistry:<init> businessNetworkDefinition obtained digitalproperty-network@0.0.1
info: [Composer-GettingStarted] updateForSale Getting assest from the registry.
info: [Composer-GettingStarted] updateForSale Submitting transaction
info: [Composer-GettingStarted] Transaction Submitted
undefined
info: [Composer-GettingStarted] Command completed successfully.
info: [Composer-GettingStarted] Fabric Composer: Getting Started appliation
info: [Composer-GettingStarted] LandRegistry:<init> businessNetworkDefinition obtained digitalproperty-network@0.0.1
info: [Composer-GettingStarted] listTitles Getting the asset registry
info: [Composer-GettingStarted] listTitles Getting all assest from the registry.
info: [Composer-GettingStarted] listTitles Current Land Titles
info: [Composer-GettingStarted] Titles listed
info: [Composer-GettingStarted]
┌──────────┬────────────────┬────────────┬─────────┬─────────────────────────────┬─────────┐
│ TitleID  │ OwnerID        │ First Name │ Surname │ Description                 │ ForSale │
├──────────┼────────────────┼────────────┼─────────┼─────────────────────────────┼─────────┤
│ LID:6789 │ PID:1234567890 │ Fred       │ Bloggs  │ A small flat in the city    │ No      │
├──────────┼────────────────┼────────────┼─────────┼─────────────────────────────┼─────────┤
│ LID:1148 │ PID:1234567890 │ Fred       │ Bloggs  │ A nice house in the country │ Yes     │
└──────────┴────────────────┴────────────┴─────────┴─────────────────────────────┴─────────┘
info: [Composer-GettingStarted] Command completed successfully.

```

***npm test***

1. `mocha --recursive` - Runs all unit tests in the */tests* directory.
2. `node cli.js landregistry bootstrap` - Run the boostrap command included in getting-started to create two land titles owned by Fred Bloggs.
3. `node cli.js landregistry list` - Run the list command included the getting-started to lists all of the assets in the LandTitles asset registry.
4. `node cli.js landregistry submit` - Run the submit command included the getting-started to submit a transaction that changes LandTitle *LID:6789*'s *ForSale* property to *Yes*.
