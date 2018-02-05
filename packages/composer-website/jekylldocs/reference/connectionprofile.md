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

1. Create a new file called `connection.json` which will define the connection profile that contains the following information for {{site.data.conrefs.hlf_full}} v1.0. 

A simple connection profile that doesn't use TLS has the following format:

        {
            "name": "my-fabric",
            "type": "hlfv1",
            "orderers": [
                {
                    "url" : "grpc://localhost:7050"
                }
            ],
            "ca": {
                "url": "http://localhost:7054",
                "name": "ca.org1.example.com"
            },
            "peers": [
                {
                    "requestURL": "grpc://localhost:7051",
                    "eventURL": "grpc://localhost:7053"
                }
            ],
            "channel": "composerchannel",
            "mspID": "Org1MSP",
            "timeout": 300
        }

If you are connecting to {{site.data.conrefs.hlf_full}} v1.0 and are not using TLS or if you don't need the trustedRoots and verify options of the Certificate Authority definition you can use the following simplified connection profile:

A more complete example of a connection profile with all possible properties defined is shown here (property values are examples and not necessarily valid values)

         {
            "name": "my-fabric",
            "type": "hlfv1",
            "ca": {
                "url": "https://localhost:7054",
                "name": "ca.org1.example.com",
                "trustedRoots" : ["-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----", "-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----"],
                "verify": true
            },
            "orderers": [
                {
                   "url" : "grpcs://localhost:7050",
                   "cert": "-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----",
                   "hostNameOverride": "ordererHostName"
                }
            ],
            "peers": [
                {
                    "requestURL": "grpcs://localhost:7051",
                    "eventURL": "grpcs://localhost:7053",
                    "cert": "-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----",
                    "hostNameOverride": "peerHostName"
                }
            ],
            "channel": "composerchannel",
            "mspID": "Org1MSP",
            "timeout": 300,
            "globalCert": "-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----",
            "maxSendSize": 20,
            "maxRecvSize": 20
        }

  - `name` is a name used to refer to the connection profile, and is required.
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

### HSM Support

Support for HSM (Hardware Security Module) is now possible so long as you have PKCS#11 support for your HSM. To drive management of identities through a HSM you need to provide the connection profile with information about your HSM setup for example

        {
            "name": "my-fabric-with-hsm",
            "type": "hlfv1",
            "orderers": [
                {
                    "url": "grpc://localhost:7050"
                }
            ],
            "ca": {
                "url": "http://localhost:7054",
                "name": "ca.org1.example.com"
            },
            "peers": [
                {
                    "requestURL": "grpc://localhost:7051",
                    "eventURL": "grpc://localhost:7053"
                },
            ],
            "channel": "composerchannel",
            "mspID": "Org1MSP",
            "timeout": "300",
            "hsm": {
                "library": "/usr/local/lib/myhsm.so",
                "slot": 0,
                "pin": 98765432
            }
        };
 
  - `library` is the absolute path to the pkcs#11 library required for communication with your specific HSM
  - `slot` is the configured slot number for the HSM
  - `pin` is the pin defined for access to that slot.

To be able to ensure connection profiles remain portable as well as not hard coding the slot and pin in the connection profile, each of the hsm properties can be referenced from an environment variable. For example if you define an environment variables on your system called `PKCS.LIBRARY`, `PKCS.SLOT` and `PKCS.PIN` to hold the hsm information, for example

        export PKCS.LIBRARY=/usr/local/lib/myhsm.so
        export PKCS.SLOT=0
        export PKCS.PIN=98765432

then you can reference this in the connection profile as follows

            "hsm": {
                "library": "{PKCS.LIBRARY}",
                "slot": "{PKCS.SLOT}",
                "pin": "{PKCS.PIN}"
            }
