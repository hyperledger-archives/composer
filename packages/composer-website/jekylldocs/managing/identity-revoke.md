---
layout: default
title: Revoking an identity from a participant
category: tasks
section: managing
sidebar: sidebars/accordion-toc0.md
excerpt: "[**An identity can be revoked from a participant using either the API or the command line**](../managing/identity-revoke.html). Once an identity has been revoked, the identity can no longer be used by the participant to interact with the business network in the context of that participant."
index-order: 807
---

# Revoking an identity from a participant

An identity can be revoked from a participant using either the API or the command line.
Once an identity has been revoked, the identity can no longer be used by the participant
to interact with the business network in the context of that participant.

When using Hyperledger Fabric, {{site.data.conrefs.composer_full}} does not currently
attempt to revoke the identity by using the Hyperledger Fabric certificate authority (CA)
APIs. The identity can still be used to submit transactions to the underlying Blockchain
network, but the transactions will be rejected by the deployed business network.

## Before you start

Before you follow these steps, you must have added a participant to a participant
registry, and issued or bound an identity to that participant. You must also find
the unique identifier for that identity in the identity registry. For more information
on finding the unique identifiers for identities, look at [Listing all identities in a business network](./identity-list.html).

The procedure below shows an example using the following model of a participant
from the Digital Property sample Business Network Definition: [digitalproperty-network](https://www.npmjs.com/package/digitalproperty-network)

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

The example also assumes that an identity `maeid1` has been issued to that participant,
and the unique identifier for that identity is 'f1c5b9fe136d7f2d31b927e0dcb745499aa039b201f83fe34e243f36e1984862'.

## Procedure

1. Connect to the business network and revoke an existing identity from a participant
  * JavaScript API

    ```javascript
    const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
    let businessNetworkConnection = new BusinessNetworkConnection();
    return businessNetworkConnection.connect('hlfv1', 'digitalproperty-network', 'admin', 'adminpw')
        .then(() => {
            return businessNetworkConnection.revokeIdentity('f1c5b9fe136d7f2d31b927e0dcb745499aa039b201f83fe34e243f36e1984862')
        })
        .then(() => {
            return businessNetworkConnection.disconnect();
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
    ```

  * Command line

    ```bash
    composer identity revoke -p hlfv1 -n 'digitalproperty-network' -i admin -s adminpw -u f1c5b9fe136d7f2d31b927e0dcb745499aa039b201f83fe34e243f36e1984862
    ```
