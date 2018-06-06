---
layout: default
title: Issuing a new identity to a participant
category: tasks
section: managing
sidebar: sidebars/accordion-toc0.md
excerpt: "[**A new identity can be issued to a participant using either the API or the command line**](../managing/identity-issue.html). Once a new identity has been issued, the identity can then be used by the participant to interact with the business network in the context of that participant."
index-order: 804
---

# Issuing a new identity to a participant

A new identity can be issued to a participant using either the API, the command line, or by using ID cards in the {{site.data.conrefs.composer_full}} Playground. Once a new identity has been issued, the identity can then be used by the participant to interact with the business network in the context of that participant.

When using {{site.data.conrefs.hlf_full}}, {{site.data.conrefs.composer_full}} issues new identities by using the {{site.data.conrefs.hlf_full}} certificate authority (CA) to register new enrollment certificates. The {{site.data.conrefs.hlf_full}} certificate authority generates an enrollment secret that can be given to the participant, who can then use the enrollment secret to request their enrollment certificate and private keys from the {{site.data.conrefs.hlf_full}} certificate authority.

## Before you start

Before you follow these steps, you must have added a participant to a participant registry. The **issuer** of a new identity (whether using command line or using the Javascript APIs below) must itself have 'issuer' authority and as appropriate, ACLs that permit them to issue the identity (to be associated with the participant) in {{site.data.conrefs.composer_full}}.

The procedure below shows an example using the following model of a participant from the Digital Property sample Business Network Definition: [digitalproperty-network](https://www.npmjs.com/package/digitalproperty-network)

```
namespace net.biz.digitalPropertyNetwork

participant Person identified by personId {
  o String personId
  o String firstName
  o String lastName
}
```

The example assumes that an instance, `net.biz.digitalPropertyNetwork#mae@biznet.org`, of that participant has been created and placed into a participant registry.

## Procedure

1. Connect to the business network and issue a new identity to a participant
  * JavaScript API

  ```javascript
  const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;

  async function identityIssue() {
      let businessNetworkConnection = new BusinessNetworkConnection();
      try {
          await businessNetworkConnection.connect('admin@digitalPropertyNetwork');
          let result = await businessNetworkConnection.issueIdentity('net.biz.digitalPropertyNetwork.Person#mae@biznet.org', 'maeid1')
          console.log(`userID = ${result.userID}`);
          console.log(`userSecret = ${result.userSecret}`);
          await businessNetworkConnection.disconnect();
      } catch(error) {
          console.log(error);
          process.exit(1);
      }
  }
  
  identityIssue();
  ```
  * Command line

  ```bash
  composer identity issue -c admin@network -f maeid1.card -u maeid1 -a "resource:net.biz.digitalPropertyNetwork.Person#mae@biznet.org"
  ```

  This will issue card for the user maeid1 and export a card file in your current directory.

2. As the participant, test the connection to the business network
  * JavaScript API

  ```javascript
  const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;

  async function testConnection() {
      let businessNetworkConnection = new BusinessNetworkConnection();
      try {
          await businessNetworkConnection.connect('maeid1@network');
          let result = await businessNetworkConnection.ping();
          console.log(`participant = ${result.participant ? result.participant : '<no participant found>'}`);
          await businessNetworkConnection.disconnect();
      } catch((error) {
          console.error(error);
          process.exit(1);
      }
  }

  testConnection();
  ```

  * Command line

  ```bash
  composer card import -f maeid1@network.card
  composer network ping -c maeid1@network
  ```

  You need to make sure to import the card into business network before pinging.
