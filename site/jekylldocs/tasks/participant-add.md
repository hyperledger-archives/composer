---
layout: default
title: Task - Add a participant
category: tasks
sidebar: sidebars/tasks.md
excerpt: How to add a participant
---

# Add a participant

---

A participant can be added to a participant registry using either the API or the
command line.

## Before you start

Before you follow these steps, you must have modelled a participant in a Business
Network Definition and deployed it as a Business Network.

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

## Procedure

1. Add the participant to a participant registry
  * JavaScript API

    ```javascript
    let businessNetworkConnection = /* TODO: get a business network connection */
    businessNetworkConnection.getParticipantRegistry('net.biz.digitalPropertyNetwork')
        .then((participantRegistry) => {
            let factory = businessNetworkConnection.getFactory();
            let participant = factory.newInstance('net.biz.digitalPropertyNetwork', 'Person', 'mae@biznet.org');
            participant.firstName = 'Mae';
            participant.lastName = 'Smith';
            return participantRegistry.add(participant);
        })
        .catch((error) => {
            // TODO: handle errors.
        });

    ```

  * Command line

    ```bash
    composer participant add -n '@ibm/digitalproperty-network' -i admin -s Xurw3yU9zI0l -d '{"$class":"net.biz.digitalPropertyNetwork.Person","personId":"mae@biznet.org","firstName":"Mae","lastName":"Smith"}'
    ```
