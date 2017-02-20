---
layout: default
title: Fabric Composer - Connection Profile
category: reference
sidebar: sidebars/reference.md
excerpt: Overview of the Connection Profiles
---

# Connection Profile

---

The AdminConnection and BusinessNetworkConnection classes use references to named Connection Profiles to connect to a running Fabric. A Connection Profile captures the URLs and configuration options required to connect to a physical instance of the Hyperledger Fabric.

Connection Profiles are stored under sub-directories of the 'composer-connection-profiles' directory in the user's home directory.

For example, if connecting using the 'testprofile' Connection Profile, the '<HOMEDIR>/.composer-connection-profiles/testprofile' directory must exist, and must contain a file named 'connection.json'.

The contents of the file will depend on the location of the Fabric, but will be similar to the example below:

      ``{
          "type": "hlf",
          "keyValStore": "/home/<your-username>/.composer-credentials",
          "membershipServicesURL": "grpc://localhost:7054",
          "peerURL": "grpc://localhost:7051",
          "eventHubURL": "grpc://localhost:7053"
      }``

This connection profile connects to a Fabric instance running on localhost and places the HFC keyValStore under the '/home/<your-username>/.composer-credentials' directory.

Connection Profiles may be shared across a development team to ensure that everyone on the team is using consistent connection information. The use of Connection Profiles ensures that physical connection details are not stored in application code.
