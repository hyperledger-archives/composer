---
layout: default
title: Connection Profiles
section: reference
index-order: 1006
sidebar: sidebars/accordion-toc0.md
excerpt: In order to connect your business network to a fabric, you must [**define a connection profile**](./connectionprofile.html). Connection profiles contain the information necessary to connect to a fabric. This topic contains example connection profiles for Hyperledger Fabric v1.1
---

# Connection Profiles

---

A Connection Profile is used by {{site.data.conrefs.composer_full}} to connect to a runtime.

## Creating a Connection Profile for {{site.data.conrefs.hlf_full}} v1.1

{{site.data.conrefs.hlf_full}} defines the format of the connection profile. The following is an example of a single organisation fabric network

```
{
    "name": "hlfv1",
    "x-type": "hlfv1",
    "x-commitTimeout": 300,
    "version": "1.0.0",
    "client": {
        "organization": "Org1",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300",
                    "eventHub": "300",
                    "eventReg": "300"
                },
                "orderer": "300"
            }
        }
    },
    "channels": {
        "composerchannel": {
            "orderers": [
                "orderer.example.com"
            ],
            "peers": {
                "peer0.org1.example.com": {
                    "endorsingPeer": true
                    "chaincodeQuery": true
                    "ledgerQuery": true
                    "eventSource": true
                }
            }
        }
    },
    "organizations": {
        "Org1": {
            "mspid": "Org1MSP",
            "peers": [
                "peer0.org1.example.com"
            ],
            "certificateAuthorities": [
                "ca.org1.example.com"
            ]
        }
    },
    "orderers": {
        "orderer.example.com": {
            "url": "grpc://orderer.example.com:7050"
        }
    },
    "peers": {
        "peer0.org1.example.com": {
            "url": "grpc://peer0.org1.example.com:7051",
            "eventUrl": "grpc://peer0.org1.example.com:7053"
        }
    },
    "certificateAuthorities": {
        "ca.org1.example.com": {
            "url": "http://ca.org1.example.com:7054",
            "caName": "ca.org1.example.com"
        }
    }
}
```

Official documentation for this structure can be found here:  https://fabric-sdk-node.github.io/tutorial-network-config.html.

The {{site.data.conrefs.hlf_full}} v1.1 connection profile is significantly different to the connection profiles used by previous versions of {{site.data.conrefs.composer_full}}. The v1.1 connection profile defines all the servers that exist, not only in your organisation but all organisations as well as all defined channels.

The full capability of the connection profile is not given here and not all of it is supported but this will be discussed in the sections.

The following sections define the server details:
- Orderers
- Peers
- Certificate Authorities

Organizational details are defined in:

- Organizations
- Channels
- Client section

### General information

```
"name": "hlfv1",
"x-type": "hlfv1",
"x-commitTimeout": 300,
"version": "1.0.0",
```

- `name` is a name used to refer to the connection profile, and is required.
- `x-type` defines the version of {{site.data.conrefs.hlf_full}} that you will connect to. To connect to {{site.data.conrefs.hlf_full}} v1.1, `x-type` must be `hlfv1`.
- `x-commitTimeout` defines the number of seconds to wait for a commit response to be received for a transaction.
- `version` defines the version of a connection profile and currently only a version of `1.0.0` is supported.

### Orderers

Here we define all the orderers that are part of the network. The name "orderer.example.com" is a label allowing us to reference this definition later.

```
"orderers": {
    "orderer.example.com": {
        "url": "grpc://orderer.example.com:7050"
    }
},
```

This section defines all the available orderers, the example here provides a basic configuration for a non-tls orderer. To configure an orderer to use TLS, use the following format:

```
"orderers": {
    "orderer.example.com": {
        "url": "grpcs://orderer.example.com:7050",
        "grpcOptions": {
            "ssl-target-name-override": "orderer.example.com"
        },
        "tlsCACerts": {
            "pem": "-----BEGIN CERTIFICATE----- <etc> "
        }
    }
},
```

In order to guarantee portability it is highly recommended to embed required certificate(s) into the connection profile using the `pem` option.

Certificates can also be defined using a file path, but this is not recommended.

### Peers

Here we define all the peers in all organizations in the network. Each has a unique label so it can be referenced later. In the example the label is `peer0.org1.example.com`.

```
"peers": {
    "peer0.org1.example.com": {
        "url": "grpc://peer0.org1.example.com:7051",
        "eventUrl": "grpc://peer0.org1.example.com:7053"
    }
},
```

Peer definitions are similar to orderer definitions in structure, but you should define both the `url` and `eventUrl` of a peer. Older connection profile formats required that you only define the eventUrl for peers in your organization. Defining TLS for a peer is similar to orderers

```
"peers": {
    "peer0.org1.example.com": {
        "url": "grpc://peer0.org1.example.com:7051",
        "eventUrl": "grpc://peer0.org1.example.com:7053"
        "grpcOptions": {
            "ssl-target-name-override": "peer.org1.example.com"
        },
        "tlsCACerts": {
            "pem": "-----BEGIN CERTIFICATE----- <etc> "
        }
    }
},
```

To define multiple peers, use the following format:

```
"peers": {
    "peer0.org1.example.com": {
        "url": "grpc://peer0.org1.example.com:7051",
        "eventUrl": "grpc://peer0.org1.example.com:7053"
    },
    "peer1.org1.example.com": {
        "url": "grpc://peer1.org1.example.com:7051",
        "eventUrl": "grpc://peer1.org1.example.com:7053"
    },
    "peer0.org2.example.com": {
        "url": "grpc://peer0.org2.example.com:7051",
        "eventUrl": "grpc://peer0.org2.example.com:7053"
    },
},
```

### Certificate Authorities
Here you define all the certificate authorities

```
"certificateAuthorities": {
    "ca.org1.example.com": {
        "url": "http://ca.org1.example.com:7054",
        "caName": "ca.org1.example.com"
    }
}
```

- `url` defines the url of a {{site.data.conrefs.hlf_full}} certificate authority to connect to. If your certificate authority requires a name, it must be defined in `caName`.
- `trustedRoots` and `verify` options for the Certificate Authority are described here https://fabric-sdk-node.github.io/global.html#TLSOptions


### Organizations

Here you define the servers that are part of your organization as well as your MSPid and provide it with a name which can be referenced.
In the example our MSPid is `Org1MSP` and we have a single peer and a single certificate authority and label our organization `Org1`. Note the referencing of the peer and certificate authority.

```
    "organizations": {
        "Org1": {
            "mspid": "Org1MSP",
            "peers": [
                "peer0.org1.example.com"
            ],
            "certificateAuthorities": [
                "ca.org1.example.com"
            ]
        }
    },
```

- `mspid` is the Membership Service Provider ID of your organization. It is associated with the enrolment id that you will use to interact with the business network.

### Channels

This defines the various {{site.data.conrefs.hlf_full}} peers and orderers that are participating on a specific channel as well as the role of the peers.
**IMPORTANT** {{site.data.conrefs.composer_full}} can only work with 1 channel, so you need to ensure that only a single channel is defined in this section even though the document can support multiple channel definitions.

```
"channels": {
    "composerchannel": {
        "orderers": [
            "orderer.example.com"
        ],
        "peers": {
            "peer0.org1.example.com": {
                "endorsingPeer": true,
                "chaincodeQuery": true,
                "ledgerQuery": true,
                "eventSource": true
            }
        }
    }
},
```

A peer has 4 possible roles. If a role is not specified then it is assumed to be true.
- `endorsingPeer` means that peer is there to endorse transactions and must have chaincode instantiated.
- `chaincodeQuery` means that peer is able to handle chaincode query requests and must have chaincode instantiated.
- `ledgerQuery` means that peer is able to perform a ledger query. This does not require chaincode to be instantiated on that peer.
- `eventSource` means that this peer will generate events.

### Client
This section will be unique for each organization and defines configuration information specific to your client application.

```
"client": {
    "organization": "Org1",
    "connection": {
        "timeout": {
            "peer": {
                "endorser": "300",
                "eventHub": "300",
                "eventReg": "300"
            },
            "orderer": "300"
        }
    }
},
```

In this section you define the `organization` you belong to, in the example this is `Org1` which references the Org1 organization in the profile. You also define timeouts in seconds for each of the possible interactions.

### Common properties
When defining a peer or orderer there are some common options you can use. These are:
- `grpcOptions`
- `tlsCACerts`

For example a peer definition might look like:

```
"peer0.org1.example.com": {
    "url": "grpcs://peer0.org1.example.com:7051",
    "eventUrl": "grpcs://peer0.org1.example.com:7053"
    "grpcOptions": {
        "ssl-target-name-override": "peer.org1.example.com",
        "grpc-max-send-message-length": 15
    },
    "tlsCACerts": {
        "pem": "-----BEGIN CERTIFICATE----- <etc> "
    }
}
```

A similar thing could be done for an orderer definition:

```
"orderer.example.com": {
    "url": "grpcs://orderer.example.com:7050",
    "grpcOptions": {
        "ssl-target-name-override": "peer.org1.example.com",
        "grpc-max-send-message-length": 15
    },
    "tlsCACerts": {
        "pem": "-----BEGIN CERTIFICATE----- <etc> "
    }
}
```

There are other `grpcOptions` available, please refer to the https://fabric-sdk-node.github.io/tutorial-network-config.html for more information
