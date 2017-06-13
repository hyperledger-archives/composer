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
                {
                    "url": "grpcs://",
                    "cert": ""
                },
                {
                    "url": "grpcs://",
                    "cert": ""
                }
            ],
            "ca": {
                    "url:" "https://",
                    "trustedRoots": "",
                    "verify": true
            },
            "peers": [
                {
                    "requestURL": "grpcs://",
                    "eventURL": "grpcs://",
                    "cert": ""
                },
                {
                    "requestURL": "grpcs://",
                    "eventURL": "grpcs://",
                    "cert": ""
                }
            ],
            "keyValStore": "/YOUR_HOME_DIR/.hfc-key-store",
            "channel": "mychannel",
            "mspID": "Org1MSP",
            "timeout": 300,
            "globalcert": "",
            "maxSendSize": 10,
            "maxRecvSize": 15
        }

    If you are connecting to {{site.data.conrefs.hlf_full}} v1.0 and are not using TLS or if you don't need the trustedRoots and verify options of the Certificate Authority definition you can use the following simplified connection profile:

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
        "timeout": 300,
        "globalcert": "",
        "maxSendSize": 10,
        "maxRecvSize": 15
        }

  - `type` defines the version of {{site.data.conrefs.hlf_full}} that you will connect to. To connect to {{site.data.conrefs.hlf_full}} v1.0-alpha is must be `hlfv1`.
  - `orderers` is an array of objects which describe the orderes to communicate with. Within `orderers`, you must define the `url` of each orderer. If you are connecting via TLS, all `url` properties in your connection profile must begin with `grpcs://` and must also contain the correct TLS certificate in the `cert` property.
  - `peers` is an array of objects describing the peers to communicate with. Each `peer` must have a defined `requestURL` and a defined `eventURL`. If you are connecting using TLS, each `peer` must also have the correct TLS certificate in the `cert` property.

  - Each instance of the `cert` property should contain the correct TLS certificate string in PEM format. Multiple certificates can be placed in each `cert` property.  

        -----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----


  - `mspid` is the Membership Service Provider ID of your organization. It is associated with the enrollment id that you will use to interact with the business network.
  - `timeout` is an optional property which controls the timeout for each request made to peers and orderers. Please note, some commands may make several sequential requests and the timeout will be applied individually to each request.
  - `maxSendSize` is an optional property which defines the size limit of outbound grpc messages being send to orderers and peers. The value is defined in megabytes. If this is not set, grpc sets a default. Setting this property to `-1` results in no size restriction.
  - `maxRecvSize` is an optional property which defines the size limit of inbound grpc messages being received from orderers and peers. The value is defined in megabytes. If this is not set, grpc sets a default. Setting this property to `-1` results in no size restriction.

  *Please note: If you are connecting to an instance of {{site.data.conrefs.hlf_full}} v1.0 the `keyValStore` property must be `home/.hfc-key-store`*
