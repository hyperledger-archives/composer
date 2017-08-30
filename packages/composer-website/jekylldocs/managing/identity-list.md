---
layout: default
title: Listing all identities in a business network
category: tasks
section: managing
sidebar: sidebars/accordion-toc0.md
excerpt: "[**A new identity can be issued to a participant using either the API or the command line**](../managing/identity-issue.html). Once a new identity has been issued, the identity can then be used by the participant to interact with the business network in the context of that participant."
index-order: 806
---

# Listing all identities in a business network

When a new identity is issued to a participant, or an existing identity is bound to a
participant, a mapping between the identity and the participant is created in the identity
registry in the deployed business network. When that participant uses that identity to
submit transactions to the deployed business network, the Composer runtime looks for a
valid mapping for that identity in the identity registry. This lookup is done using
the public key signature or fingerprint, essentially a hash of the certificate contents
that is unique to that certificate and identity.

In order to perform identity management operations in a deployed business network, you
will need to list and review the set of identities in the identity registry.

## Before you start

Before you follow these steps, you should have added a participant to a participant
registry, and issued a new identity or bound an existing identity to that participant.
Otherwise the identity registry will be empty and you will not see any results.

## Procedure

1. Connect to the business network and list the identities in the identity registry
  * JavaScript API

  ```javascript
  const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
  let businessNetworkConnection = new BusinessNetworkConnection();
  return businessNetworkConnection.connect('hlfv1', 'digitalproperty-network', 'admin', 'adminpw')
      .then(() => {
          return businessNetworkConnection.getIdentityRegistry();
      })
      .then((identityRegistry) => {
          return identityRegistry.getAll();
      })
      .then((identities) => {
          identities.forEach((identity) => {
            console.log(`identityId = ${identity.identityId}, name = ${identity.name}, state = ${identity.state}`);
          });
          return businessNetworkConnection.disconnect();
      })
      .catch((error) => {
          console.error(error);
          process.exit(1);
      });
  ```
  * Command line

  ```bash
  composer identity list -p hlfv1 -n 'digitalproperty-network' -i admin -s adminpw
  ```
