---
layout: default
title: Adding participants
category: tasks
section: managing
sidebar: sidebars/accordion-toc0.md
excerpt: "[**Participants must be added to a business network**](../managing/participant-add.html) before they can make transactions. Participants can create assets, and also exchange assets with other participants. A participant works with assets by submitting transactions."
index-order: 802
---

# Adding participants

A participant can be added to a participant registry using either the API or the command line.

## Before you start

Before you follow these steps, you must have modeled a participant in a Business Network Definition and deployed it as a Business Network.

The procedure below shows an example using the following model of a participant from the Digital Property sample Business Network Definition: [digitalproperty-network](https://www.npmjs.com/package/digitalproperty-network)

*Please note*: If you are adding the participant using the `composer participant add` command, ensure that the JSON representation of the participant is wrapped in single quotes.

```
namespace net.biz.digitalPropertyNetwork

participant Person identified by personId {
  o String personId
  o String firstName
  o String lastName
}
```

## Procedure

1. Add the participant to a participant registry
  * JavaScript API

    ```javascript
    const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
    let businessNetworkConnection = new BusinessNetworkConnection();
    return businessNetworkConnection.connect('hlfv1', 'digitalproperty-network', 'maeid1', 'RJJmlOpvNVRV')
        .then(() => {
            return businessNetworkConnection.getParticipantRegistry('net.biz.digitalPropertyNetwork');
        })
        .then((participantRegistry) => {
            let factory = businessNetworkConnection.getFactory();
            let participant = factory.newResource('net.biz.digitalPropertyNetwork', 'Person', 'mae@biznet.org');
            participant.firstName = 'Mae';
            participant.lastName = 'Smith';
            return participantRegistry.add(participant);
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
    composer participant add -p hlfv1 -n 'digitalproperty-network' -i admin -s adminpw -d '{"$class":"net.biz.digitalPropertyNetwork.Person","personId":"mae@biznet.org","firstName":"Mae","lastName":"Smith"}'
    ```
