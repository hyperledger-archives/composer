---
layout: default
title: Revoking the identity of a participant
category: tasks
section: managing
sidebar: sidebars/accordion-toc.md
excerpt: "[**An identity can be revoked from a participant using either the API or the command line**](../managing/identity-revoke.html). Once an identity has been revoked, the identity can no longer be used by the participant to interact with the business network in the context of that participant."
index-order: 4
---

# Revoke an Identity of a Participant

An identity can be revoked from a participant using either the API or the command line. Once an identity has been revoked, the identity can no longer be used by the participant to interact with the business network in the context of that participant.

{{site.data.conrefs.composer_full}} issues identities as Hyperledger Fabric enrollment
certificates (ECerts). When an identity is revoked, the enrollment certificate is
still valid, but it cannot be used to interact with the business network. This is
due to a current limitation in Hyperledger Fabric that does not allow the IBM
Blockchain Framework to revoke enrollment certificates completely.

## Before you start

Before you follow these steps, you must have added a participant to a participant
registry, and issued an identity to that participant.

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

The example also assumes that an identity `maeid1` has been issued to that participant.

## Procedure

1. Revoke an identity from the participant
  * JavaScript API

    ```javascript
    let businessNetworkConnection = /* TODO: get a business network connection */
    businessNetworkConnection.revokeIdentity('maeid1')
        .then(() => {
            // Identity is no longer valid.
        });
    ```

  * Command line

    ```bash
    composer identity revoke -n 'digitalproperty-network' -i admin -s Xurw3yU9zI0l -u maeid1
    ```
