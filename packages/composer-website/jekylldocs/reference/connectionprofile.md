---
layout: default
title: Hyperledger Composer - Connection Profile
category: reference
sidebar: sidebars/reference.md
excerpt: Using Connection Profiles
---

# Connection Profiles

---

A Connection Profile is used by {{site.data.conrefs.composer_full}} to connect to a runtime.

## Creating a Connection Profile

1. Navigate to the Connection Profile store:

        cd $HOME/.composer-connection-profiles

2. Create a new profile folder.

        mkdir ./MyProfile

3. Navigate into the new profile folder.

        cd MyProfile

4. Create a new file called `connection.json` that contains the following information for either {{site.data.conrefs.hlf_full}} v0.6 or v1.0. If you are creating a connection profile for {{site.data.conrefs.hlf_full}} v0.6, use the following format:

        {
            "type": <hlf|web>,
            "keyValStore":"/home/<your-username>/.composer-credentials",
            "membershipServicesURL": <your-membership-services-url>,
            "peerURL": <your-peer-url>,
            "eventHubURL": <your-event-hub-url>
        }
  If you are creating a connection profile for {{site.data.conrefs.hlf_full}} v1.0, use the following format:

        {
        "type": "hlfv1",
        "orderers": [
            "grpc://localhost:7050"
        ],
        "ca": "http://localhost:7054",
        "peers": [
            {
                "requestURL": "grpc://localhost:7051",
                "eventURL": "grpc://localhost:7053"
            },
            {
                "requestURL": "grpc://localhost:7056",
                "eventURL": "grpc://localhost:7058"
            }
        ],
        "keyValStore": "/home/.hfc-key-store",
        "channel": "mychannel",
        "mspID": "Org1MSP",
        "deployWaitTime": "300",
        "invokeWaitTime": "100"
        }
  *Please note: If you are connecting to an instance of {{site.data.conrefs.hlf_full}} v1.0 the `keyValStore` property must be `home/.hfc-key-store`*
