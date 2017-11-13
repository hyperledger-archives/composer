---
layout: default
title: Connection Profiles
section: reference
index-order: 1006
sidebar: sidebars/accordion-toc0.md
excerpt: In order to connect your business network to a fabric, you must [**define a connection profile**](./connectionprofile.html). Connection profiles contain the information necessary to connect to a fabric. This topic contains example connection profiles for Hyperledger Fabric v0.6 and v1.0.
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

4. Create a new file called `connection.json` that contains the following information for {{site.data.conrefs.hlf_full}} v1.0.
        }

  Create a connection profile for {{site.data.conrefs.hlf_full}} v1.0, use the following format:

        {
            "type": "hlfv1",
            "orderers": [
                {
                    "url": "grpcs://",
                    "hostnameOverride": "",
                    "cert": ""
                },
                {
                    "url": "grpcs://",
                    "hostnameOverride": "",
                    "cert": ""
                }
            ],
            "ca": {
                    "url:" "https://",
                    "name": "",
                    "trustedRoots": [""],
                    "verify": true
            },
            "peers": [
                {
                    "requestURL": "grpcs://",
                    "eventURL": "grpcs://",
                    "hostnameOverride": "",
                    "cert": ""
                },
                {
                    "requestURL": "grpcs://",
                    "eventURL": "grpcs://",
                    "hostnameOverride": "",
                    "cert": ""
                }
            ],
            "keyValStore": "/YOUR_HOME_DIR/.composer-credentials",
            "channel": "composerchannel",
            "mspID": "Org1MSP",
            "timeout": 300,
            "globalCert": "",
            "maxSendSize": 10,
            "maxRecvSize": 15
        }

    If you are connecting to {{site.data.conrefs.hlf_full}} v1.0 and are not using TLS or if you don't need the trustedRoots and verify options of the Certificate Authority definition you can use the following simplified connection profile:

    _Please note: The simplified version of the connection profile will only work if the relevant certificate authority has no name defined. If the certificate authority has a defined name, it must be specified._

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
        "keyValStore": "/home/.composer-credentials",
        "channel": "composerchannel",
        "mspID": "Org1MSP",
        "timeout": 300,
        "globalCert": "",
        "maxSendSize": 10,
        "maxRecvSize": 15
        }

  - `type` defines the version of {{site.data.conrefs.hlf_full}} that you will connect to. To connect to {{site.data.conrefs.hlf_full}} v1.0 is must be `hlfv1`.
  - `ca` defines the url of a {{site.data.conrefs.hlf_full}} certificate authority to connect to. If your certificate authority requires a name, it must be defined as a property of `ca` as shown in the first {{site.data.conrefs.hlf_full}} v1.0 example above.
  - `trustedRoots` and `verify` options for the Certificate Authority are described here https://fabric-sdk-node.github.io/global.html#TLSOptions
  - `orderers` is an array of objects which describe the orderes to communicate with. Within `orderers`, you must define the `url` of each orderer. If you are connecting via TLS, all `url` properties in your connection profile must begin with `grpcs://` and must also contain the correct TLS certificate in the `cert` property.
  - `peers` is an array of objects describing the peers to communicate with. Each `peer` must have a defined `requestURL` and a defined `eventURL`. If you are connecting using TLS, each `peer` must also have the correct TLS certificate in the `cert` property.
  - `hostnameOverride` is used in a test environment only, when the server certificate's hostname does not match the actual host endpoint that the server process runs at, the application can work around the client TLS verify failure by setting this property to the value of the server certificate's hostname.
  - Each instance of the `cert` property should contain the correct TLS certificate string in PEM format. Multiple certificates can be placed in each `cert` property.  

        -----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----


  - `mspid` is the Membership Service Provider ID of your organization. It is associated with the enrollment id that you will use to interact with the business network.
  - `timeout` is an optional property which controls the timeout for each request made to peers and orderers. Please note, some commands may make several sequential requests and the timeout will be applied individually to each request.
  - `globalCert` defines the TLS certificate which is used for all peers and orderers if no `cert` property is specified. If a `cert` property is specified, it overrides the `globalCert` property only for the peer or orderer it is specified for.
  - `maxSendSize` is an optional property which defines the size limit of outbound grpc messages being send to orderers and peers. The value is defined in megabytes. If this is not set, grpc sets a default. Setting this property to `-1` results in no size restriction.
  - `maxRecvSize` is an optional property which defines the size limit of inbound grpc messages being received from orderers and peers. The value is defined in megabytes. If this is not set, grpc sets a default. Setting this property to `-1` results in no size restriction.
