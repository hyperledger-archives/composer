---
layout: default
title: Deploying to a single organization Hyperledger Fabric
category: tutorials
section: tutorials
index-order: 304
sidebar: sidebars/accordion-toc0.md
excerpt: "This tutorial will walk you through the steps required to configure Composer for connection with a running Hyperledger Fabric instance."
---

# Deploying a {{site.data.conrefs.composer_full}} blockchain business network to {{site.data.conrefs.hlf_full}} for a single organization

In the [development environment](../installing/development-tools.html), a simple development only {{site.data.conrefs.hlf_full}} single organization, single peer network is created for you (`fabric-dev-servers`), along with all of the {{site.data.conrefs.composer_full}} configuration that you need in order to deploy a blockchain business network.

This tutorial will demonstrate the steps that an administrator needs to take in order to deploy a blockchain business network to an instance of {{site.data.conrefs.hlf_full}} for a single organization, including how to generate the necessary {{site.data.conrefs.composer_full}} configuration. A subsequent tutorial will demonstrate how to deploy a blockchain business network to an instance of {{site.data.conrefs.hlf_full}} for multiple organizations.

During this tutorial, you may wish to refer to the [{{site.data.conrefs.hlf_full}} documentation](http://hyperledger-fabric.readthedocs.io).

## Prerequisites

1. Before you continue, ensure that you have followed the steps in [installing a development environment](../installing/development-tools.html).

## Step One: Starting a {{site.data.conrefs.hlf_full}} network

In order to follow this tutorial, you must start a {{site.data.conrefs.hlf_full}} network. You can use the simple {{site.data.conrefs.hlf_full}} network provided in the development environment, or you can use your own {{site.data.conrefs.hlf_full}} network that you have built by following the {{site.data.conrefs.hlf_full}} documentation.

The tutorial will assume that you use the simple {{site.data.conrefs.hlf_full}} network provided in the development environment. If you use your own {{site.data.conrefs.hlf_full}} network, then you must map between the configuration detailed below and your own configuration and it should be a single organization network.

1. Start a clean {{site.data.conrefs.hlf_full}} by running the following commands:

        cd ~/fabric-dev-servers
        {{site.data.conrefs.export_fabric_version_command}}
        ./stopFabric.sh
        ./teardownFabric.sh
        ./downloadFabric.sh
        ./startFabric.sh

2. Delete any business network cards that may exist in your wallet. It is safe to ignore any errors that state that the business network cards cannot be found:

        composer card delete -c PeerAdmin@fabric-network
        composer card delete -c admin@tutorial-network

If these commands fail, then you have network cards from a previous version and you will have to delete the file system card store.

        rm -fr ~/.composer

## Step Two: Exploring the {{site.data.conrefs.hlf_full}} network

This step will explore the {{site.data.conrefs.hlf_full}} network that you have just started, so that you can understand how it has been configured, and what components it consists of. You will use all of the information in this section to configure {{site.data.conrefs.composer_full}} in subsequent steps.

#### Configuration files

The simple {{site.data.conrefs.hlf_full}} network provided in the development environment has been configured using the {{site.data.conrefs.hlf_full}} configuration tools `cryptogen` and `configtxgen`.

The configuration for `cryptogen` is stored in the file:

    ~/fabric-dev-servers/fabric-scripts/hlfv12/composer/crypto-config.yaml

The configuration for `configtxgen` is stored in the file:

    ~/fabric-dev-servers/fabric-scripts/hlfv12/composer/configtx.yaml

You can find more information about these configuration tools, what they do, and how to use them by reading the {{site.data.conrefs.hlf_full}} documentation.

#### Organizations

The simple {{site.data.conrefs.hlf_full}} network is made up of a single organization called `Org1`. The organization uses the domain name `org1.example.com`. Additionally, the Membership Services Provider (MSP) for this organization is called `Org1MSP`. In this tutorial, you will deploy a blockchain business network that only the organization `Org1` can interact with.

#### Network components

The {{site.data.conrefs.hlf_full}} network is made up of several components:

- A single peer node for `Org1`, named `peer0.org1.example.com`.
    - The request port is 7051.
    - The event hub port is 7053.
- A single Certificate Authority (CA) for `Org1`, named `ca.org1.example.com`.
    - The CA port is 7054.
- A single orderer node, named `orderer.example.com`.
    - The orderer port is 7050.

The {{site.data.conrefs.hlf_full}} network components are running inside Docker containers. When running {{site.data.conrefs.composer_full}} within a Docker container, the names above (for example, `peer0.org1.example.com`) can be used to interact with the {{site.data.conrefs.hlf_full}} network.

This tutorial will run {{site.data.conrefs.composer_full}} commands on the Docker host machine, rather than from inside the Docker network. This means that the {{site.data.conrefs.composer_full}} commands must interact with the {{site.data.conrefs.hlf_full}} network using `localhost` as the host name and the exposed container ports.

#### Users

The organization `Org1` is configured with a user named `Admin@org1.example.com`. This user is an administrator. Administrators for an organization have the permission to install the code for a blockchain business network onto their organization's peers, and can also have the permission to start the blockchain business network, depending on configuration. In this tutorial, you will deploy a blockchain business network by acting as the user `Admin@org1.example.com`.

The user `Admin@org1.example.com` has a set of certificates and private key files stored in the directory:

    ~/fabric-dev-servers/fabric-scripts/hlfv12/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

You will use some of these files later on to interact with the {{site.data.conrefs.hlf_full}} network.

In addition to the administrator, the CA (Certificate Authority) for `Org1` has been configured with a default user. This default user has an enrollment ID of `admin` and an enrollment secret of `adminpw`. However, this user does not have permission to deploy a blockchain business network.

#### Channel

Finally, a channel named `composerchannel` has been created. The peer node `peer0.org1.example.com` has been joined to this channel. You can only deploy {{site.data.conrefs.composer_full}} blockchain business networks into existing channels, but you can create additional channels by following the {{site.data.conrefs.hlf_full}} documentation.

## Step Three: Building a connection profile

A connection profile specifies all of the information required to locate and connect to the {{site.data.conrefs.hlf_full}} network, for example the host names and ports of all of the {{site.data.conrefs.hlf_full}} network components. In this step, you will create a connection profile for {{site.data.conrefs.composer_full}} to use to connect to the {{site.data.conrefs.hlf_full}} network.

1. Create a connection profile file called `connection.json`.

2. Give the connection profile `name`, `version` and `x-type` properties by adding the following three lines to the top of `connection.json`:

        {
            "name": "fabric-network",
            "x-type": "hlfv1",
            "version": "1.0.0",

      The `name` property in a connection profile gives a name to the {{site.data.conrefs.hlf_full}} network, so we can reference it later on. In the connection profile you have just created, the name is `fabric-network`. You can use any name you like for the {{site.data.conrefs.hlf_full}} network.

      {{site.data.conrefs.composer_full}} is designed to be compatible with different types blockchain networks. Currently, only {{site.data.conrefs.hlf_full}} v1.x is supported, but you must specify the type of blockchain network to use. The x-type for {{site.data.conrefs.hlf_full}} {{site.data.conrefs.hlf_latest}} is `hlfv1`.

      The version number is the version of this connection profile format. Currently there is only 1 version of `1.0.0`.

      There is also an optional property `x-commitTimeout` which can also be specified with defines how long {{site.data.conrefs.composer_full}} should wait for a submitted transaction to be committed to your organization's peer before
      giving up waiting. The default if not specified is `300 seconds`.

3. We must specify the host names and ports of all of the peer nodes in the {{site.data.conrefs.hlf_full}} network. There is only 1 peer and we give it a label of `peer0.org1.example.com`.

            "peers": {
                "peer0.org1.example.com": {
                    "url": "grpc://localhost:7051"
                }
            },

    Here, we have specified our single peer node `peer0.org1.example.com` (using the host name `localhost`), the request port 7051, and the event hub port 7053.

    The `peers` array can contain multiple peer nodes. If you have multiple peer nodes, you should add them all to the `peers` object.

4. We must specify the host name and port of the certificate authority (CA) in the {{site.data.conrefs.hlf_full}} network that we want to use for enrolling existing users and registering new users.

            "certificateAuthorities": {
                "ca.org1.example.com": {
                    "url": "http://localhost:7054",
                    "caName": "ca.org1.example.com"
                }
            },

    Here we have specified our single CA `ca.org1.example.com` (using the hostname `localhost`) and the CA port 7054, and we also label this entry as `ca-org1.example.com`

5. We must specify the host names and ports of all of the ordering nodes in the {{site.data.conrefs.hlf_full}} that we want to connect to.

            "orderers": {
                "orderer.example.com": {
                    "url": "grpc://localhost:7050"
                }
            },


    Here, we have specified our single orderer node `orderer.example.com` (using the hostname `localhost`) and the orderer port 7050 and we also label this as `orderer.example.com`.

    The `orderers` object can contain multiple orderer nodes. If you have multiple orderer nodes, you should add them all to the `orderers` object.

6. We now must specify all the organizations in the network. In this tutorial there is only 1 organization, `Org1`.

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

    Here we are describing the owners of the peers and who their certificate authority is plus we also declare the MSP id that has been defined for this organisation. In this tutorial it has been defined as `Org1MSP`.

7. We must specify the name of an existing channel. We will deploy our blockchain business network into the channel `composerchannel`. This is defined in the channels object.

            "channels": {
                "composerchannel": {
                    "orderers": [
                        "orderer.example.com"
                    ],
                    "peers": {
                        "peer0.org1.example.com": {
                            "endorsingPeer": true,
                            "chaincodeQuery": true,
                            "eventSource": true
                        }
                    }
                }
            },

    Here we are defined the channel `composerchannel` and also the orderers and peers that are part of that channel. We also specify the roles the peer will perform in this channel. In this tutorial we have added the single orderer and single peer defined earlier referenced using their labels. The peer will have the business network installed so will be a transaction endorser, able to handle chaincode queries and also generate events.
    The blockchain business network will be deployed to all of the specified peer nodes. Once the blockchain business network has been deployed, the specified peer nodes will be used for querying the blockchain business network, endorsing transactions, and subscribing to events.

8. The final section this is required is the client section. This is used by client applications (such as {{site.data.conrefs.composer_full}}) to know what organization it is representing when interacting and also some extra optional timeouts.

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
            }
        }

Here we are specifying that we are in `Org1`. The timeouts are used to determine how long to wait for a response when interacting with a peer or orderer and the values are specified in seconds. If you don't specify anything then the default is `45 seconds`.


9. Save your changes to `connection.json`. The completed connection profile should look like the following:

        {
            "name": "fabric-network",
            "x-type": "hlfv1",
            "version": "1.0.0",
            "peers": {
                "peer0.org1.example.com": {
                    "url": "grpc://localhost:7051"
                }
            },
            "certificateAuthorities": {
                "ca.org1.example.com": {
                    "url": "http://localhost:7054",
                    "caName": "ca.org1.example.com"
                }
            },
            "orderers": {
                "orderer.example.com": {
                    "url": "grpc://localhost:7050"
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
            "channels": {
                "composerchannel": {
                    "orderers": [
                        "orderer.example.com"
                    ],
                    "peers": {
                        "peer0.org1.example.com": {
                            "endorsingPeer": true,
                            "chaincodeQuery": true,
                            "eventSource": true
                        }
                    }
                }
            },
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
            }
        }

## Step Four: Locating the certificate and private key for the {{site.data.conrefs.hlf_full}} administrator

In order to deploy a blockchain business network to this {{site.data.conrefs.hlf_full}} network, we must identify ourselves as an administrator with the permissions to perform this operation. In this step, you locate the files required to identify yourself as an administrator.

The administrator for our {{site.data.conrefs.hlf_full}} network is a user called `Admin@org1.example.com`. The certificates and private key files for this user are stored in the directory:

    ~/fabric-dev-servers/fabric-scripts/hlfv12/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

You must first locate the certificate file for this user. The certificate is the public part of the identity. The certificate file can be found in the `signcerts` subdirectory and is named `Admin@org1.example.com-cert.pem`. If you look at the contents of this file, then you will find a PEM encoded certificate similar to the following:

    -----BEGIN CERTIFICATE-----
    MIICGjCCAcCgAwIBAgIRANuOnVN+yd/BGyoX7ioEklQwCgYIKoZIzj0EAwIwczEL
    MAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG
    cmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh
    Lm9yZzEuZXhhbXBsZS5jb20wHhcNMTcwNjI2MTI0OTI2WhcNMjcwNjI0MTI0OTI2
    WjBbMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMN
    U2FuIEZyYW5jaXNjbzEfMB0GA1UEAwwWQWRtaW5Ab3JnMS5leGFtcGxlLmNvbTBZ
    MBMGByqGSM49AgEGCCqGSM49AwEHA0IABGu8KxBQ1GkxSTMVoLv7NXiYKWj5t6Dh
    WRTJBHnLkWV7lRUfYaKAKFadSii5M7Z7ZpwD8NS7IsMdPR6Z4EyGgwKjTTBLMA4G
    A1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMCsGA1UdIwQkMCKAIBmrZau7BIB9
    rRLkwKmqpmSecIaOOr0CF6Mi2J5H4aauMAoGCCqGSM49BAMCA0gAMEUCIQC4sKQ6
    CEgqbTYe48az95W9/hnZ+7DI5eSnWUwV9vCd/gIgS5K6omNJydoFoEpaEIwM97uS
    XVMHPa0iyC497vdNURA=
    -----END CERTIFICATE-----

Next, you must locate the private key file for this user. The private key is used to sign transactions as this identity. The private key file can be found in the `keystore` subdirectory. The name of the private key file is a long hexadecimal string, with a suffix of `_sk`, for example `114aab0e76bf0c78308f89efc4b8c9423e31568da0c340ca187a9b17aa9a4457_sk`. The name will change every time the configuration is generated. If you look at the contents of this file, then you will find a PEM encoded private key similar to the following:

    -----BEGIN PRIVATE KEY-----
    MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg00IwLLBKoi/9ikb6
    ZOAV0S1XeNGWllvlFDeczRKQn2uhRANCAARrvCsQUNRpMUkzFaC7+zV4mClo+beg
    4VkUyQR5y5Fle5UVH2GigChWnUoouTO2e2acA/DUuyLDHT0emeBMhoMC
    -----END PRIVATE KEY-----

Remember the path to both of these files, or copy them into the same directory as the connection profile file `connection.json` that you created in the previous step. You will need these files in the next step.

## Step Five: Creating a business network card for the {{site.data.conrefs.hlf_full}} administrator

A business network card contains all of the information required to connect to a blockchain business network and the underlying {{site.data.conrefs.hlf_full}} network. This information includes the connection profile created in step three, and the certificate and private key for the administrator located in step four.

In this step you will create a business network card for the administrator to use to deploy the blockchain business network to the {{site.data.conrefs.hlf_full}} network.

Run the `composer card create` command to create a business network card. You must specify the path to all three files that you either created or located in the previous steps:

    composer card create -p connection.json -u PeerAdmin -c Admin@org1.example.com-cert.pem -k 114aab0e76bf0c78308f89efc4b8c9423e31568da0c340ca187a9b17aa9a4457_sk -r PeerAdmin -r ChannelAdmin

A business network card file called `PeerAdmin@fabric-network.card` will have been written to the current directory. Let's explore the options that we passed to the `composer card create` command.

    -p connection.json

This is the path to the connection profile file that we created in step three.

    -u PeerAdmin

This is a name that we use to refer to the administrator user. Instead of using `Admin@org1.example.com` everywhere, which is quite lengthy to type, we have given a name of `PeerAdmin` so we can easily refer to this user.

    -c Admin@org1.example.com-cert.pem

This is the path to the certificate file for the user `Admin@org1.example.com` that we located in step four.

    -k 114aab0e76bf0c78308f89efc4b8c9423e31568da0c340ca187a9b17aa9a4457_sk

This is the path to the private key file for the user `Admin@org1.example.com` that we located in step four.

    -r PeerAdmin -r ChannelAdmin

Here, we specify which roles the user has. This information is required so that {{site.data.conrefs.composer_full}} playground knows which users are able to perform which operations. The user `Admin@org1.example.com` is an administrator for the {{site.data.conrefs.hlf_full}} network, and has the roles `PeerAdmin` (ability to install chaincode) and `ChannelAdmin` (ability to instantiate chaincode).

## Step Six: Importing the business network card for the {{site.data.conrefs.hlf_full}} administrator

{{site.data.conrefs.composer_full}} can only use business network cards that are placed into a wallet. The wallet is a directory on the file system that contains business network cards. In this step, you will import the business network card created in step five into the wallet so that you can use the business network card in subsequent steps.

Run the `composer card import` command to import the business network card into the wallet:

    composer card import -f PeerAdmin@fabric-network.card

Let's explore the options that we passed to the `composer card import` command.

    -f PeerAdmin@fabric-network.card

This is the path to the business network card file that we created in step five.

You can now use this business network card by specifying the name `PeerAdmin@fabric-network`. You are now all set to deploy the blockchain business network to the {{site.data.conrefs.hlf_full}} network.

We are going to deploy the blockchain business network `tutorial-network` that is created by following the [Developer Tutorial](./developer-tutorial.html). If you haven't created a business network archive (.bna) file by following the developer tutorial, follow steps 1, 2, and 3 of the developer tutorial.

## Step Seven: Installing the {{site.data.conrefs.composer_full}} business network onto the {{site.data.conrefs.hlf_full}} peer nodes

In this step, you will install your blockchain business network onto all of your organizations {{site.data.conrefs.hlf_full}} peer nodes. In {{site.data.conrefs.hlf_full}} terms, this is a chaincode install operation.

Run the `composer network install` command to install the {{site.data.conrefs.composer_full}} runtime onto the {{site.data.conrefs.hlf_full}} peer nodes that you specified in the connection profile file you created in step three:

    composer network install -c PeerAdmin@fabric-network -a tutorial-network@0.0.1.bna

Let's explore the options that we passed to the `composer network install` command.

    -c PeerAdmin@fabric-network

This is the name of the business network card that we imported into the wallet in step six.

    -a tutorial-network@0.0.1.bna

You must install a copy of the business network. Here we specify the file name of the blockchain business network that we are deploying, `tutorial-network@0.0.1.bna`.

## Step Eight: Starting the blockchain business network

In this step, you will start the blockchain business network. In {{site.data.conrefs.hlf_full}} terms, this is a chaincode instantiate operation.

Run the `composer network start` command to start the blockchain business network:

    composer network start --networkName tutorial-network --networkVersion 0.0.1 -A admin -S adminpw -c PeerAdmin@fabric-network

Let's explore the options that we passed to the `composer network start` command.

    -c PeerAdmin@fabric-network

This is the name of the business network card that we imported into the wallet in step six.

    --networkName tutorial-network

This is the name of blockchain business network called `tutorial-network`.

    --networkVersion 0.0.1

This is the version of blockchain business network called `tutorial-network`, defined in the `version` property of the package.json for the business network

    -A admin

When a blockchain business network is deployed, you must create at least one participant who will be a blockchain business network administrator. This participant is responsible for onboarding other participants into the blockchain business network. Here, we are specifying that we want to create a single blockchain business network administrator called `admin`.

    -S adminpw

This specifies that our blockchain business network administrator `admin` will use an enrollment secret of `adminpw` to request a certificate and private key from the CA (Certificate Authority). When you specify this option, the name specified for the business network administrator must be an existing enrollment ID for a user that is already registered with the CA.

Now that our blockchain business network has been started, we can interact with it using the business network card file `admin@tutorial-network.card` that was created.

## Step Nine: Importing the business network card for the business network administrator

Run the `composer card import` command to import the business network card into the wallet:

    composer card import -f admin@tutorial-network.card

You can now use this business network card by specifying the name `admin@tutorial-network`. You are now all set to interact with the running blockchain business network!

## Step Ten: Testing the connection to the blockchain business network

Run the `composer network ping` command to test the connection to the blockchain business network:

    composer network ping -c admin@tutorial-network

Check that the test result was successful, and there is a single participant listed for the business network with the name `NetworkAdmin`.

## Conclusion

In this tutorial you have seen how to configure {{site.data.conrefs.composer_full}} with all of the information required to connect to a {{site.data.conrefs.hlf_full}} network, and how to deploy a blockchain business network to that {{site.data.conrefs.hlf_full}} network.

If you used the simple {{site.data.conrefs.hlf_full}} network provided in the development environment, why not try building your own {{site.data.conrefs.hlf_full}} network by following the {{site.data.conrefs.hlf_full}} documentation and see if you can successfully deploy a blockchain business network to it?
