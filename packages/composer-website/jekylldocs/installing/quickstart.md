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

<!-- These steps will install the Composer sample application running against Hyperledger Fabric v1.0. To use Hyperledger Fabric v0.6 run the optional command in step 2. -->
You can choose to install the latest **v0.6** Composer sample application (uses a Hyperledger Fabric v0.6 environment) or the **v1.0** sample application (uses a Hyperledger Fabric v1.0 environment) and give us feedback.

## Before you begin

Check that your system has the required software (at the required versions) installed:

```
Operating Systems: Ubuntu Linux 14.04 / 16.04 LTS (both 64-bit), or Mac OS 10.12
Docker Engine: Version 1.12.x
Docker-Compose: Version 1.8.x
Node: 6.x (note version 7 is not supported)
npm: 3.10.x
git: 2.9.x
```

If you need to update or install any of the prerequisites, please refer to [installing prerequisites](../installing/prerequisites.md)

## Procedure

1. To install the Composer command line tools:

        ```
        $ npm install -g composer-cli
        ```
  *Please note: When using Ubuntu this command will fail when running in a root user shell.*

2. Clone the Composer sample applications GitHub repository. Choose from either the v0.6 sample application or the v1.0 sample application, the former will stand up a Hyperledger Fabric v0.6 environment ; the latter will stand up a newer Hyperledger Fabric v1.0 environment using a docker command sequence. For Hyperledger v0.6 use the following command:

        ```
        $ git clone https://github.com/hyperledger/composer-sample-applications.git
        ```
  For Hyperledger v1.0 use the following command:

        ```
        $ git clone https://github.com/hyperledger/composer-sample-applications-hlfv1.git
        ```

3. Install the getting started application using one of the following commands. If you are using Hyperledger v0.6 use the following command:

        ```
        $ cd composer-sample-applications/packages/getting-started
        $ npm install
        ```
  If you are using Hyperledger v1.0, use the following command:

        ```
        $ cd composer-sample-applications-hlfv1/packages/getting-started
        $ npm install
        ```
  Amongst the steps (described below), the command returns information about the deployed digital property network such as name, models, registries etc.<br><br>`npm install` runs several scripts that are packaged into the getting-started directory and uses the docker-compose `.yml` file mentioned below to pull/download the relevant Hyperledger Fabric docker images.<br><br>There is [reference material](https://hyperledger.github.io/composer/reference/commands.html) for Composer CLI.

4. Run the `npm test` command. You should see output similar to that shown below (output below is for a v0.6 sample application)

```
$ npm test
> getting-started@1.0.0 test /home/ibm/samples/sample-applications/packages/getting-started
> mocha --recursive && npm run bootstrapAssets && npm run listAssets && npm run submitTransaction


  Default
    #sample test
      ✓ should pass


  1 passing (8ms)


    > getting-started@1.0.0 bootstrapAssets /home/ibm/samples/sample-applications/packages/getting-started
> node cli.js landregistry bootstrap

info: [Composer-GettingStarted] Hyperledger Composer: Getting Started application
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

info: [Composer-GettingStarted] Hyperledger Composer: Getting Started application
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

info: [Composer-GettingStarted] Hyperledger Composer: Getting Started application
info: [Composer-GettingStarted] LandRegistry:<init> businessNetworkDefinition obtained digitalproperty-network@0.0.6
info: [Composer-GettingStarted] updateForSale Getting assest from the registry.
info: [Composer-GettingStarted] updateForSale Submitting transaction
info: [Composer-GettingStarted] Transaction Submitted
info: [Composer-GettingStarted] Command completed successfully.
info: [Composer-GettingStarted] Hyperledger Composer: Getting Started application
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

## Testing the application

1. `mocha --recursive` - Runs all unit tests in the */tests* directory.
2. `node cli.js landregistry bootstrap` - Run the bootstrap command to create two land titles owned by Fred Bloggs.
3. `node cli.js landregistry list` - Run the list command to list all of the assets in the LandTitles asset registry.
4. `node cli.js landregistry submit` - Run the submit command to submit a transaction that changes LandTitle *LID:1148*'s *ForSale*' property to *Yes*.

## Where next?

* Learn more about the Digital Property Network and running the tests in the first [Getting Started Tutorial](../tutorials/getting-started-cmd-line.md)
