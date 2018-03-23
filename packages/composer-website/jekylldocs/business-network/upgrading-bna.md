---
layout: default
title: Upgrading a deployed business network
category: tasks
section: business-network
index-order: 507
sidebar: sidebars/accordion-toc0.md
excerpt: Upgrading a deployed business network
---

# Upgrading a deployed business network

After a business network has been successfully deployed to a blockchain it may be necessary to upgrade the business network definition. To upgrade a business network definition, first make the updates you wish to deploy to your local copy of the business network component files (model, script, query, access control, and transaction processor files), then update the version of your local business network files. After updating the version install the new version of the `.bna` to your blockchain, and use the `composer network upgrade` command to switch to using your new version.

## Before you begin

Before upgrading a deployed business network definition:

- Ensure your business network has successfully deployed.
- Make any required updates to your business network you wish to deploy.

## Step One: Updating the business network version

It is important that the `package.json` file is updated before installing a new version of your business network to your blockchain.

1. Open the `package.json` file in your business network directory.

2. Update the **version** property. The version property must be a `.` separated number, for example, `0.0.2` or `1.16.4`. Make sure to take note of the version number you are setting as it is required for the following steps.

## Step Two: Package your business network

After updating the version number, the business network must be packaged into a business network archive (`.bna`). The `.bna` can then be installed on the blockchain and started. The `composer archive create` command can package either a directory or an npm module, for this example we'll use the directory command.

1. From your business network directory run the `composer archive create` command:

        composer archive create -t dir -n .

## Step Three: Installing the new business network

When the business network has been packaged, it must be installed to the blockchain. It is installed using the same process as when the original business network was installed.

1. Install the business network to your blockchain using the following command:

        composer network install -a NETWORK-FILENAME.bna -c peeradmin@hlfv1

    The business network card used in the command must be a peer admin card in order to install the business network to the blockchain peers.

## Step Four: Upgrading to the new business network

Now that the business network has been installed to the peers, it must be started. The `composer network upgrade` command will instruct the peers to stop using the older version of the business network and begin using the version specified in the command.

1. Upgrade to the business network that was installed using the following command:

        composer network upgrade -c peeradmin@hlfv1 -n NETWORK-NAME -V NETWORK-VERSION

    The network name and network version must match the contents of the `package.json` in the installed business network.

Your business network should now be successfully upgraded.
