---
layout: default
title: Issuing an identity to a participant
category: tasks
section: managing
sidebar: sidebars/accordion-toc0.md
excerpt: "[**An identity can be issued to a participant using either the API or the command line**](../managing/identity-issue.html). Once an identity has been issued, the identity can then be used by the participant to interact with the business network in the context of that participant."
index-order: 703
---

# Issue an Identity to a Participant

An identity can be issued to a participant using either the API or the command line. Once an identity has been issued, the identity can then be used by the participant to interact with the business network in the context of that participant.

{{site.data.conrefs.composer_full}} issues identities as Hyperledger Fabric enrollment
certificates (ECerts). An enrollment secret is generated that should be given to
the participant, who can use the enrollment secret to download their enrollment
certificate.

## Before you start

Before you follow these steps, you must have added a participant to a participant
registry. The **issuer** of a new identity (whether using command line or using the Javascript APIs below) must itself have 'issuer' authority and as appropriate, ACLs that permit him/her issue the identity (to be associated with the participant) in Composer.

The procedure below shows an example using the following model of a participant
from the Getting Started walkthrough.

```
namespace net.biz.digitalPropertyNetwork

participant Person identified by personId {
  o String personId
  o String firstName
  o String lastName
}
```

The example assumes that an instance, `net.biz.digitalPropertyNetwork#mae@biznet.org`,
of that participant has been created and placed into a participant registry.

## Procedure

1. Connect and Issue an identity to the participant
  * JavaScript API
  
  

  ```javascript
 /* replace with your connection info   */
   this.businessNetworkConnection = new BusinessNetworkConnection();
   this.businessNetworkConnection.connect('hlfv1', 'net.biz.digitalPropertyNetwork', participantId, participantPwd)
   .then((result) => {
   this.businessNetworkDefinition = result;
   });

  businessNetworkConnection.issueIdentity('net.biz.digitalPropertyNetwork.Person#mae@biznet.org', 'maeid1')
      .then((result) => {
          console.log(`userID = ${result.userID}`);
          console.log(`userSecret = ${result.userSecret}`);
      });
  ```
  * Command line

  ```bash
  composer identity issue -n 'digitalproperty-network' -i admin -s Xurw3yU9zI0l -u maeid1 -a "net.biz.digitalPropertyNetwork.Person#mae@biznet.org"
  ```

  The enrollment secret will be printed to the console.

2. As the participant, test the connection to the business network
  * JavaScript API

  ```javascript
  let businessNetworkConnection = /* TODO: get a business network connection */
  businessNetworkConnection.ping()
      .then((result) => {
          console.log(`participant = ${result.participant ? result.participant : '<no participant found>'}`);
      });
  ```

  * Command line

  ```bash
  composer network ping -n 'digitalproperty-network' -i maeid1 -s RJJmlOpvNVRV
  ```

  The participant ID will be printed to the console, and should match the participant
  ID that was specified in the `composer identity issue` command.
