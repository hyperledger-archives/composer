---
layout: default
title: Creating, Exporting, and Importing ID Cards
category: tasks
section: managing
sidebar: sidebars/accordion-toc0.md
excerpt: ID cards combine a connection profile, identity, and certificates to allow a connection to a business network in Hyperledger Composer Playground. ID cards can be [created, exported and imported](./id-cards-playground.html) from the **My Wallet** page in Hyperledger Composer Playground.
index-order: 803
---


# Creating, Exporting, and Importing ID Cards

ID cards are represented by `.card` files containing a `metadata.JSON` file, a connection profile, and optional certificates.

ID cards can be used in the {{site.data.conrefs.composer_full}} Playground to manage identities for different business networks and connection profiles.

---

## Creating ID Cards

ID cards can be created in the wallet screen, created from the component files, or created within a business network.

_Please note_: If cards are created from the wallet screen, or created from the component files, there must be a corresponding identity already created in the business network.


### Creating an ID card within a business network

1. From the **My Wallet** screen, select an identity to use to connect to your business network. Click **Connect Now**. _Please note:_ You must use an identity with the permission to create new identities.

2. _Optional_: To create a participant to assign to the identity, click the **Test** tab, and click **Create New Participant**.

3. Click the name of your identity in the upper right, and click **ID Registry**.

4. Click **Issue New ID**.

5. Choose an **ID Name**, and select a **Participant** to associate the new identity with.

6. Click **Create New**.

7. Click **Add to My Wallet**. Adding the ID card to your wallet allows you to use it to connect to the business network, or export it for someone else to use.

The **My Wallet** screen should now show the new ID card.

### Creating an ID card using from the Wallet

An ID card can be created from the **My Wallet** page, however, a corresponding identity must already have been created in the business network. Creating an ID card from the **My Wallet** page requires that you use the same _User ID_, _User Secret_ and the correct _Business network name_ credentials as when the identity was created within the business network.

To create an ID card from the **My Wallet** page:

1. After receiving a valid _User ID_ and _User Secret_, click the **Create ID Card** button in the upper right of the **My Wallet** page.

2. Select a connection profile and click **Next**.

3. Enter the _User ID_ and _User Secret_ that were generated when the identity was created.

4. Enter the correct _Business Network Name_ and click **Create**.

The ID card should now be displayed in the **My Wallet** page.


### Creating an ID card from component files

ID cards are composite files containing up to three elements:

- A connection profile. (`connection.json`)
- A metadata file containing the data for the identity to use to connect to the business network. (`metadata.json`)
- An optional `credentials` directory containing a certificate and private key for the identity in files named `certificate` and `privateKey` respectively.

_Please note_: If there is no `credentials` directory, the metadata file must contain the _enrollment secret_ required to obtain the credentials with the property name _enrollmentSecret_. If an _enrollmentSecret_ is specified and the ID card is used to connect to a business network, a credentials directory with certificates will be created and populated if the ID card is exported.

The metadata file should take the following format:

```
{
    "version": 1,
    "userName": "alice",
    "description": "Alice's identity for basic-sample-network",
    "businessNetwork": "basic-sample-network",
    "enrollmentSecret": "UserSecret",
    "roles": [
    ]
}
```

The _businessNetworkName_, _description_, _enrollmentSecret_, and _roles_ properties are optional. The available _roles_ are `PeerAdmin` and `ChannelAdmin`.

To create the ID card file, compress as a ZIP archive the connection profile, metadata file, and optionally a credentials directory, then modify the file type to `.card`.

This ID card can now be imported using the {{site.data.conrefs.composer_full}} Playground.

---

## Importing and Exporting ID cards

Importing and exporting ID cards is the simplest way to grant access to other users of the business network in Playground. Valid ID cards must be created using one of the methods above, but can then be exported and sent to other users.

### Exporting ID Cards

1. To export an ID card create an identity by [using a business network](#creating-an-id-card-within-a-business-network) and add the ID card to your wallet.

2. On the **My Wallet** page, click the **Export** icon on the ID card you wish to export. The ID card should download as a `.card` file.

_Please note_: If you export an ID card that has never been used, for example to send to a new participant, it will contain the enrollment ID and enrollment secret required to obtain the certificate and public key which are then used to identify participants. Alternatively, if you export an ID card that has been used before, it will already contain the certificate and public key.

**Important**: Exported identity cards should be handled with care since they contain unprotected credentials. For example, you should never send identity cards via email or other unencrypted means of communication.

### Importing ID Cards

Importing an ID card allows you to connect to a business network without creating a connection profile, identity, and certificates. Members of a business network can create ID cards and export them to give others access to a business network.

1. On the **My Wallet** screen, click **Import ID card** in the upper right.

2. Drag and drop, or browse, to select an ID card (`.card`) file to import. Click **Import**.

The ID card should now be visible in your wallet.
