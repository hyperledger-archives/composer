---
layout: default
title: Binding an existing identity to a participant
category: tasks
section: managing
sidebar: sidebars/accordion-toc0.md
excerpt: "[**An existing identity can be bound to a participant using either the API or the command line**](../managing/identity-issue.html). Once an existing identity has been bound, the identity can then be used by the participant to interact with the business network in the context of that participant."
index-order: 805
---

# Binding an existing identity to a participant

An existing identity can be issued to a participant using either the API or the command line.
Once the existing identity has been bound, the identity can then be used by the participant
to interact with the business network in the context of that participant.

When using Hyperledger Fabric, you can bind existing certificates that have been created
by using the Hyperledger Fabric certificate authority (CA) or by using other tooling such
as `cryptogen`. The existing certificates must be valid for use for submitting transactions
on the Hyperledger Fabric network.

## Before you start

Before you follow these steps, you must have added a participant to a participant
registry. You must have an existing certificate in the PEM format to bind to the
participant. The **binder** of the existing identity (whether using command line or
using the Javascript APIs below) must have ACLs that permit them to bind the identity
(to be associated with the participant) in {{site.data.conrefs.composer_full}}.

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

## Procedure

1. Connect to the business network and bind an existing identity to a participant
  * JavaScript API

  ```javascript
  const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
  let businessNetworkConnection = new BusinessNetworkConnection();
  let certificate = `-----BEGIN CERTIFICATE-----
    MIIB8DCCAZegAwIBAgIURanHh55fqrUecvHNHtcMKiHJRkwwCgYIKoZIzj0EAwIw
    czELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh
    biBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT
    E2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMTcwNzI3MTc0MzAwWhcNMTgwNzI3MTc0
    MzAwWjAQMQ4wDAYDVQQDEwVhZG1pbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IA
    BAANIGFIrXXr5+h0NfUNJhx5YFQ4w6r182eZYRhc9KvYQhYo5D0ZbecfR9sGX2b6
    0aW+C7bUaXc6DU3pJSD4fNijbDBqMA4GA1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8E
    AjAAMB0GA1UdDgQWBBRwuAyWrGlzVQFqRf0OqoTNuoq7QDArBgNVHSMEJDAigCAZ
    q2WruwSAfa0S5MCpqqZknnCGjjq9AhejItieR+GmrjAKBggqhkjOPQQDAgNHADBE
    AiBcj/JvxmKHel4zQ3EmjITEFhdYku5ijIZEDuR5v9HK3gIgTUbVEfq3MuasVZKx
    rkM5DH3e5ECM7T+T1Ovr+1AK6bs=
    -----END CERTIFICATE-----`
  return businessNetworkConnection.connect('hlfv1', 'digitalproperty-network', 'admin', 'adminpw')
      .then(() => {
          return businessNetworkConnection.bindIdentity('net.biz.digitalPropertyNetwork.Person#mae@biznet.org', certificate)
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
  composer identity bind -p hlfv1 -n 'digitalproperty-network' -i admin -s adminpw -c /tmp/cert.pem -a "resource:net.biz.digitalPropertyNetwork.Person#mae@biznet.org"
  ```

2. As the participant, test the connection to the business network
  * JavaScript API

  ```javascript
  const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
  let businessNetworkConnection = new BusinessNetworkConnection();
  return businessNetworkConnection.connect('hlfv1', 'digitalproperty-network', 'maeid1', 'RJJmlOpvNVRV')
      .then(() => {
          return businessNetworkConnection.ping();
      })
      .then((result) => {
          console.log(`participant = ${result.participant ? result.participant : '<no participant found>'}`);
          return businessNetworkConnection.disconnect();
      })
      .catch((error) => {
          console.error(error);
          process.exit(1);
      });
  ```

  * Command line

  ```bash
  composer network ping -p hlfv1 -n 'digitalproperty-network' -i maeid1 -s RJJmlOpvNVRV
  ```

  The participant ID will be printed to the console, and should match the participant
  ID that was specified in the `composer identity bind` command.
