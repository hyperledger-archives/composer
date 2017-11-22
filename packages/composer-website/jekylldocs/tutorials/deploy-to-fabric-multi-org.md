---
layout: default
title: Deploying to a multi-organization Hyperledger Fabric
category: tutorials
section: tutorials
index-order: 305
sidebar: sidebars/accordion-toc0.md
---

# Deploying a {{site.data.conrefs.composer_full}} blockchain business network to {{site.data.conrefs.hlf_full}} (multiple organizations)

This tutorial will demonstrate the steps that administrators in multiple organization scenarios must take to deploy a blockchain business network to an instance of {{site.data.conrefs.hlf_full}}, including how to generate the {{site.data.conrefs.composer_full}} configuration.

It is recommended that you first follow the previous tutorial that demonstrates how to deploy a blockchain business network to an instance of {{site.data.conrefs.hlf_full}} for a single organization, as it will explain some of the concepts in more detail.

This tutorial will cover how to deploy a blockchain business network to a {{site.data.conrefs.hlf_full}} network that spans two organizations, `Org1` and `Org2`. The tutorial is presented with different types of steps depending on which organization should follow the step.

The first kind of step is for both organizations to follow:

<h2 class='everybody'>Example Step: A step for Org1 and Org2 to follow</h2>

The organization `Org1` is represented by Alice, the Green Conga Block:

<h2 class='alice'>Example Step: A step for Org1 to follow</h2>

The organization `Org2` is represented by Bob, the Violet Conga Block:

<h2 class='bob'>Example Step: A step for Org2 to follow</h2>

You can follow these steps by yourself, or pair with a friend or colleague and follow the steps together.

Let's get started!

<h2 class='everybody'>Prerequisites</h2>

If you have installed the development environment, you will need to first stop the {{site.data.conrefs.hlf_full}} provided by the development environment:

    cd ~/fabric-tools
    ./stopFabric.sh
    ./teardownFabric.sh

Clone the following GitHub repository:

    git clone -b issue-6978 https://github.com/sstone1/fabric-samples.git

Follow the [Building Your First Network tutorial](http://hyperledger-fabric.readthedocs.io/en/release/build_network.html), ensuring that you use the GitHub repository cloned in the previous step. You must not clone and use the Hyperledger Fabric version of the GitHub repository as it is currently missing changes that are required for this tutorial.

<h2 class='everybody'>Step One: Starting a {{site.data.conrefs.hlf_full}} network</h2>

In order to follow this tutorial, you must start a {{site.data.conrefs.hlf_full}} network.

This tutorial will assume that you use the {{site.data.conrefs.hlf_full}} network provided in the {{site.data.conrefs.hlf_full}} [Building Your First Network tutorial](http://hyperledger-fabric.readthedocs.io/en/release/build_network.html). We will refer to this {{site.data.conrefs.hlf_full}} network as the BYFN (Building Your First Network) network.

You can now start the BYFN network. You must specify additional flags that are not specified in the Building Your First Network tutorial. This is because we want to use CouchDB as the world state database, and we want to start a Certificate Authority (CA) for each organization.

    ./byfn.sh -m generate
    ./byfn.sh -m up -s couchdb -a

If the command works successfully, the BYFN network is started, and you will see the following output:

    ========= All GOOD, BYFN execution completed ===========


    _____   _   _   ____   
    | ____| | \ | | |  _ \  
    |  _|   |  \| | | | | |
    | |___  | |\  | | |_| |
    |_____| |_| \_| |____/

Next, delete any business network cards that may exist in your wallet. It is safe to ignore any errors that state that the business network cards cannot be found:

    composer card delete -n PeerAdmin@byfn-network-org1-only
    composer card delete -n PeerAdmin@byfn-network-org1
    composer card delete -n PeerAdmin@byfn-network-org2-only
    composer card delete -n PeerAdmin@byfn-network-org2
    composer card delete -n alice@tutorial-network
    composer card delete -n bob@tutorial-network
    composer card delete -n admin@tutorial-network
    composer card delete -n PeerAdmin@fabric-network

<h2 class='everybody'>Step Two: Exploring the {{site.data.conrefs.hlf_full}} network</h2>

This step will explore the BFYN network configuration and components. The configuration details are required to complete the subsequent steps.

#### Organizations

The BYFN network is made up of two organizations: `Org1` and `Org2`. The organization `Org1` uses the domain name `org1.example.com`. The Membership Services Provider (MSP) for `Org1` is called `Org1MSP`. The organization `Org2` uses the domain name `org2.example.com`. The MSP for `Org2` is called `Org2MSP`. In this tutorial, you will deploy a blockchain business network that both of the organizations `Org1` and `Org2` can interact with.

#### Network components

The {{site.data.conrefs.hlf_full}} network is made up of several components:

- Two peer nodes for `Org1`, named `peer0.org1.example.com` and `peer1.org1.example.com`.
    - The request port for `peer0` is 7051.
    - The event hub port for `peer0` is 7053.
    - The request port for `peer1` is 8051.
    - The event hub port for `peer1` is 8053.
- A single CA (Certificate Authority) for `Org1`, named `ca.org1.example.com`.
    - The CA port is 7054.
- Two peer nodes for `Org2`, named `peer0.org2.example.com` and `peer1.org2.example.com`.
    - The request port for `peer0` is 9051.
    - The event hub port for `peer0` is 9053.
    - The request port for `peer1` is 10051.
    - The event hub port for `peer1` is 10053.
- A single CA (Certificate Authority) for `Org2`, named `ca.org2.example.com`.
    - The CA port is 8054.
- A single orderer node, named `orderer.example.com`.
    - The orderer port is 7050.

These components are running inside Docker containers. When running {{site.data.conrefs.composer_full}} within a Docker container, the names above (for example, `peer0.org1.example.com`) can be used to interact with the {{site.data.conrefs.hlf_full}} network.

This tutorial will run {{site.data.conrefs.composer_full}} commands on the Docker host machine, rather than from inside the Docker network. This means that the {{site.data.conrefs.composer_full}} commands must interact with the {{site.data.conrefs.hlf_full}} network using `localhost` as the host name and the exposed container ports.

All of the network components are secured using TLS to encrypt communications. You will need the Certificate Authority (CA) certificates for all of the network components in order to connect to those network components. The CA certificates can be found in the directory containing the byfn.sh script.

CA certificate for the orderer node:

    crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt

CA certificate for `Org1`:

    crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

CA certificate for `Org2`:

    crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

You will use these files later on to interact with the {{site.data.conrefs.hlf_full}} network.

#### Users

The organization `Org1` is configured with a user named `Admin@org1.example.com`. This user is an administrator.

The user `Admin@org1.example.com` has a set of certificates and private key files stored in the directory:

    crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

The organization `Org2` is configured with a user named `Admin@org2.example.com`. This user is an administrator.

The user `Admin@org2.example.com` has a set of certificates and private key files stored in the directory:

    crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

You will use some of these files later on to interact with the {{site.data.conrefs.hlf_full}} network.

In addition to the administrator, the CAs (Certificate Authorities) for `Org1` and `Org2` have been configured with a default user. This default user has an enrolment ID of `admin` and an enrolment secret of `adminpw`. However, this user does not have permission to deploy a blockchain business network.

#### Channel

A channel named `mychannel` has been created. All four peer nodes - `peer0.org1.example.com`, `peer1.org1.example.com`, `peer0.org2.example.com`, and `peer1.org2.example.com` have been joined to this channel.

<h2 class='alice'>Step Three: Building connection profiles for Org1</h2>

`Org1` requires two connection profiles. One connection profile will contain just the peer nodes that belong to `Org1`, and the other connection profile will contain the peer nodes that belong to `Org1` and `Org2`.

Create a connection profile file called `connection-org1-only.json` with the following contents and save it to disk. This connection profile will contain just the peer nodes that belong to `Org1`. You will use this file in later steps, so remember where you place it!

    {
        "name": "byfn-network-org1-only",
        "type": "hlfv1",
        "mspID": "Org1MSP",
        "peers": [
            {
                "requestURL": "grpcs://localhost:7051",
                "eventURL": "grpcs://localhost:7053",
                "cert": "INSERT_ORG1_CA_CERT_FILE_PATH",
                "hostnameOverride": "peer0.org1.example.com"
            },
            {
                "requestURL": "grpcs://localhost:8051",
                "eventURL": "grpcs://localhost:8053",
                "cert": "INSERT_ORG1_CA_CERT_FILE_PATH",
                "hostnameOverride": "peer1.org1.example.com"
            }
        ],
        "ca": {
            "url": "https://localhost:7054",
            "name": "ca-org1",
            "cert": "INSERT_ORG1_CA_CERT_FILE_PATH",
            "hostnameOverride": "ca.org1.example.com"
        },
        "orderers": [
            {
                "url" : "grpcs://localhost:7050",
                "cert": "INSERT_ORDERER_CA_CERT_FILE_PATH",
                "hostnameOverride": "orderer.example.com"
            }
        ],
        "channel": "mychannel",
        "timeout": 300
    }

Replace all instances of the text `INSERT_ORG1_CA_CERT_FILE_PATH` with the fully qualified path to the file containing the CA certificate for the peer nodes for `Org1`:

    crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

Replace all instances of the text `INSERT_ORDERER_CA_CERT_FILE_PATH` with the fully qualified path to the file containing the CA certificate for the orderer node:

    crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt

Create another connection profile file called `connection-org1.json` with the following contents and save it to disk.  This connection profile will contain the peer nodes that belong to `Org1` and `Org2`. You will use this file in later steps, so remember where you place it!

    {
        "name": "byfn-network-org1",
        "type": "hlfv1",
        "mspID": "Org1MSP",
        "peers": [
            {
                "requestURL": "grpcs://localhost:7051",
                "eventURL": "grpcs://localhost:7053",
                "cert": "INSERT_ORG1_CA_CERT_FILE_PATH",
                "hostnameOverride": "peer0.org1.example.com"
            },
            {
                "requestURL": "grpcs://localhost:8051",
                "eventURL": "grpcs://localhost:8053",
                "cert": "INSERT_ORG1_CA_CERT_FILE_PATH",
                "hostnameOverride": "peer1.org1.example.com"
            },
            {
                "requestURL": "grpcs://localhost:9051",
                "cert": "INSERT_ORG2_CA_CERT_FILE_PATH",
                "hostnameOverride": "peer0.org2.example.com"
            },
            {
                "requestURL": "grpcs://localhost:10051",
                "cert": "INSERT_ORG2_CA_CERT_FILE_PATH",
                "hostnameOverride": "peer1.org2.example.com"
            }
        ],
        "ca": {
            "url": "https://localhost:7054",
            "name": "ca-org1",
            "cert": "INSERT_ORG1_CA_CERT_FILE_PATH",
            "hostnameOverride": "ca.org1.example.com"
        },
        "orderers": [
            {
                "url" : "grpcs://localhost:7050",
                "cert": "INSERT_ORDERER_CA_CERT_FILE_PATH",
                "hostnameOverride": "orderer.example.com"
            }
        ],
        "channel": "mychannel",
        "timeout": 300
    }

Replace all instances of the text `INSERT_ORG1_CA_CERT_FILE_PATH` with the fully qualified path to the file containing the CA certificate for the peer nodes for `Org1`:

    crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

Replace all instances of the text `INSERT_ORG2_CA_CERT_FILE_PATH` with the fully qualified path to the file containing the CA certificate for the peer nodes for `Org2`:

    crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

Replace all instances of the text `INSERT_ORDERER_CA_CERT_FILE_PATH` with the fully qualified path to the file containing the CA certificate for the orderer node:

    crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt

Note that where this connection profile contains details of the peer nodes for `Org2`, it only includes the request port and does not contain the event hub port. This is because one organization cannot access another organizations event hub port.

<h2 class='bob'>Step Four: Building connection profiles for Org2</h2>

`Org2` requires two connection profiles. One connection profile will contain just the peer nodes that belong to `Org2`, and the other connection profile will contain the peer nodes that belong to `Org2` and `Org1`.

Create a connection profile file called `connection-org2-only.json` with the following contents and save it to disk. This connection profile will contain just the peer nodes that belong to `Org2`. You will use this file in later steps, so remember where you place it!

    {
        "name": "byfn-network-org2-only",
        "type": "hlfv1",
        "mspID": "Org2MSP",
        "peers": [
            {
                "requestURL": "grpcs://localhost:9051",
                "eventURL": "grpcs://localhost:9053",
                "cert": "INSERT_ORG2_CA_CERT_FILE_PATH",
                "hostnameOverride": "peer0.org2.example.com"
            },
            {
                "requestURL": "grpcs://localhost:10051",
                "eventURL": "grpcs://localhost:10053",
                "cert": "INSERT_ORG2_CA_CERT_FILE_PATH",
                "hostnameOverride": "peer1.org2.example.com"
            }
        ],
        "ca": {
            "url": "https://localhost:8054",
            "name": "ca-org2",
            "cert": "INSERT_ORG2_CA_CERT_FILE_PATH",
            "hostnameOverride": "ca.org2.example.com"
        },
        "orderers": [
            {
                "url" : "grpcs://localhost:7050",
                "cert": "INSERT_ORDERER_CA_CERT_FILE_PATH",
                "hostnameOverride": "orderer.example.com"
            }
        ],
        "channel": "mychannel",
        "timeout": 300
    }

Replace all instances of the text `INSERT_ORG2_CA_CERT_FILE_PATH` with the fully qualified path to the file containing the CA certificate for the peer nodes for `Org2`:

    crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

Replace all instances of the text `INSERT_ORDERER_CA_CERT_FILE_PATH` with the fully qualified path to the file containing the CA certificate for the orderer node:

    crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt

Create another connection profile file called `connection-org2.json` with the following contents and save it to disk.  This connection profile will contain the peer nodes that belong to `Org2` and `Org1`. You will use this file in later steps, so remember where you place it!

    {
        "name": "byfn-network-org2",
        "type": "hlfv1",
        "mspID": "Org2MSP",
        "peers": [
            {
                "requestURL": "grpcs://localhost:9051",
                "eventURL": "grpcs://localhost:9053",
                "cert": "INSERT_ORG2_CA_CERT_FILE_PATH",
                "hostnameOverride": "peer0.org2.example.com"
            },
            {
                "requestURL": "grpcs://localhost:10051",
                "eventURL": "grpcs://localhost:10053",
                "cert": "INSERT_ORG2_CA_CERT_FILE_PATH",
                "hostnameOverride": "peer1.org2.example.com"
            },
            {
                "requestURL": "grpcs://localhost:7051",
                "cert": "INSERT_ORG1_CA_CERT_FILE_PATH",
                "hostnameOverride": "peer0.org1.example.com"
            },
            {
                "requestURL": "grpcs://localhost:8051",
                "cert": "INSERT_ORG1_CA_CERT_FILE_PATH",
                "hostnameOverride": "peer1.org1.example.com"
            }
        ],
        "ca": {
            "url": "https://localhost:8054",
            "name": "ca-org2",
            "cert": "INSERT_ORG2_CA_CERT_FILE_PATH",
            "hostnameOverride": "ca.org2.example.com"
        },
        "orderers": [
            {
                "url" : "grpcs://localhost:7050",
                "cert": "INSERT_ORDERER_CA_CERT_FILE_PATH",
                "hostnameOverride": "orderer.example.com"
            }
        ],
        "channel": "mychannel",
        "timeout": 300
    }

Replace all instances of the text `INSERT_ORG2_CA_CERT_FILE_PATH` with the fully qualified path to the file containing the CA certificate for the peer nodes for `Org2`:

    crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

Replace all instances of the text `INSERT_ORG1_CA_CERT_FILE_PATH` with the fully qualified path to the file containing the CA certificate for the peer nodes for `Org1`:

    crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

Replace all instances of the text `INSERT_ORDERER_CA_CERT_FILE_PATH` with the fully qualified path to the file containing the CA certificate for the orderer node:

    crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt

Note that where this connection profile contains details of the peer nodes for `Org1`, it only includes the request port and does not contain the event hub port. This is because one organization cannot access another organizations event hub port.

<h2 class='alice'>Step Five: Locating the certificate and private key for the {{site.data.conrefs.hlf_full}} administrator for Org1</h2>

The administrator for our {{site.data.conrefs.hlf_full}} network is a user called `Admin@org1.example.com`. The certificates and private key files for this user are stored in the directory:

    crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

You must first locate the certificate file for this user. The certificate is the public part of the identity. The certificate file can be found in the `signcerts` subdirectory and is named `Admin@org1.example.com-cert.pem`.

Next, you must locate the private key file for this user. The private key is used to sign transactions as this identity. The private key file can be found in the `keystore` subdirectory. The name of the private key file is a long hexadecimal string, with a suffix of `_sk`, for example `78f2139bfcfc0edc7ada0801650ed785a11cfcdef3f9c36f3c8ca2ebfa00a59c_sk`. The name will change every time the configuration is generated.

Remember the path to both of these files, or copy them into the same directory as the connection profile file `connection-org1.json` that you created in step three. You will need these files in the next steps.

<h2 class='bob'>Step Six: Locating the certificate and private key for the {{site.data.conrefs.hlf_full}} administrator for Org2</h2>

The administrator for our {{site.data.conrefs.hlf_full}} network is a user called `Admin@org2.example.com`. The certificates and private key files for this user are stored in the directory:

    crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

You must first locate the certificate file for this user. The certificate is the public part of the identity. The certificate file can be found in the `signcerts` subdirectory and is named `Admin@org2.example.com-cert.pem`.

Next, you must locate the private key file for this user. The private key is used to sign transactions as this identity. The private key file can be found in the `keystore` subdirectory. The name of the private key file is a long hexadecimal string, with a suffix of `_sk`, for example `d4889cb2a32e167bf7aeced872a214673ee5976b63a94a6a4e61c135ca2f2dbb_sk`. The name will change every time the configuration is generated.

Remember the path to both of these files, or copy them into the same directory as the connection profile file `connection-org2.json` that you created in step four. You will need these files in the next steps.

<h2 class='alice'>Step Seven: Creating business network cards for the {{site.data.conrefs.hlf_full}} administrator for Org1</h2>

In this step you will create business network cards for the administrator to use to deploy the blockchain business network to the {{site.data.conrefs.hlf_full}} network.

Run the `composer card create` command to create a business network card using the connection profile that just contains the peers for `Org1`. You must specify the path to all three files that you either created or located in the previous steps: (note: the _sk_ file will differ.)

    composer card create -p connection-org1-only.json -u PeerAdmin -c Admin@org1.example.com-cert.pem -k 78f2139bfcfc0edc7ada0801650ed785a11cfcdef3f9c36f3c8ca2ebfa00a59c_sk -r PeerAdmin -r ChannelAdmin

If the command works successfully, a business network card file called `PeerAdmin@byfn-network-org1-only.card` will have been written to the current directory.

Run the `composer card create` command to create a business network card using the connection profile that contains the peers for `Org1` and `Org2`. You must specify the path to all three files that you either created or located in the previous steps:

    composer card create -p connection-org1.json -u PeerAdmin -c Admin@org1.example.com-cert.pem -k 78f2139bfcfc0edc7ada0801650ed785a11cfcdef3f9c36f3c8ca2ebfa00a59c_sk -r PeerAdmin -r ChannelAdmin

If the command works successfully, a business network card file called `PeerAdmin@byfn-network-org1.card` will have been written to the current directory.

<h2 class='bob'>Step Eight: Creating business network cards for the {{site.data.conrefs.hlf_full}} administrator for Org2</h2>

In this step you will create business network cards for the administrator to use to deploy the blockchain business network to the {{site.data.conrefs.hlf_full}} network.

Run the `composer card create` command to create a business network card using the connection profile that just contains the peers for `Org2`. You must specify the path to all three files that you either created or located in the previous steps:

    composer card create -p connection-org2-only.json -u PeerAdmin -c Admin@org2.example.com-cert.pem -k d4889cb2a32e167bf7aeced872a214673ee5976b63a94a6a4e61c135ca2f2dbb_sk -r PeerAdmin -r ChannelAdmin

If the command works successfully, a business network card file called `PeerAdmin@byfn-network-org2-only.card` will have been written to the current directory.

Run the `composer card create` command to create a business network card using the connection profile that contains the peers for `Org2` and `Org1`. You must specify the path to all three files that you either created or located in the previous steps:

    composer card create -p connection-org2.json -u PeerAdmin -c Admin@org2.example.com-cert.pem -k d4889cb2a32e167bf7aeced872a214673ee5976b63a94a6a4e61c135ca2f2dbb_sk -r PeerAdmin -r ChannelAdmin

If the command works successfully, a business network card file called `PeerAdmin@byfn-network-org2.card` will have been written to the current directory.

<h2 class='alice'>Step Nine: Importing the business network cards for the {{site.data.conrefs.hlf_full}} administrator for Org1</h2>

Run the `composer card import` command to import the business network card that just contains the peers for `Org1` into the wallet:

    composer card import -f PeerAdmin@byfn-network-org1-only.card

If the command works successfully, a business network card called `PeerAdmin@byfn-network-org1-only` will have been imported into the wallet.

Run the `composer card import` command to import the business network card that contains the peers for `Org1` and `Org2` into the wallet:

    composer card import -f PeerAdmin@byfn-network-org1.card

If the command works successfully, a business network card called `PeerAdmin@byfn-network-org1` will have been imported into the wallet.

<h2 class='bob'>Step Ten: Importing the business network cards for the {{site.data.conrefs.hlf_full}} administrator for Org2</h2>

Run the `composer card import` command to import the business network card that just contains the peers for `Org2` into the wallet:

    composer card import -f PeerAdmin@byfn-network-org2-only.card

If the command works successfully, a business network card called `PeerAdmin@byfn-network-org2-only` will have been imported into the wallet.

Run the `composer card import` command to import the business network card that contains the peers for `Org2` and `Org1` into the wallet:

    composer card import -f PeerAdmin@byfn-network-org2.card

If the command works successfully, a business network card called `PeerAdmin@byfn-network-org2` will have been imported into the wallet.

<h2 class='alice'>Step Eleven: Installing the {{site.data.conrefs.composer_full}} runtime onto the {{site.data.conrefs.hlf_full}} peer nodes for Org1</h2>

Run the `composer runtime install` command to install the {{site.data.conrefs.composer_full}} runtime onto all of the {{site.data.conrefs.hlf_full}} peer nodes for `Org1` that you specified in the connection profile file you created in step three:

    composer runtime install -c PeerAdmin@byfn-network-org1-only -n tutorial-network

<h2 class='bob'>Step Twelve: Installing the {{site.data.conrefs.composer_full}} runtime onto the {{site.data.conrefs.hlf_full}} peer nodes for Org2</h2>

Run the `composer runtime install` command to install the {{site.data.conrefs.composer_full}} runtime onto all of the {{site.data.conrefs.hlf_full}} peer nodes for `Org2` that you specified in the connection profile file you created in step four:

    composer runtime install -c PeerAdmin@byfn-network-org2-only -n tutorial-network

<h2 class='everybody'>Step Thirteen: Defining the endorsement policy for the business network</h2>

A running business network has an endorsement policy, which defines the rules around which organizations must endorse transactions before they can be committed to the blockchain. By default, a business network is deployed with an endorsement policy that states that only one organization has to endorse a transaction before it can be committed to the blockchain.

In real world blockchain business networks, multiple organizations will want to ensure that they endorse transactions before they can be committed to the blockchain, and so the default endorsement policy is not suitable. Instead, you can specify a custom endorsement policy when you start a business network.

You can find more information on endorsement policies in the {{site.data.conrefs.hlf_full}} documentation, in [Endorsement policies](https://hyperledger-fabric.readthedocs.io/en/release/endorsement-policies.html).

> Please note that the endorsement policies used for a business network must be in the JSON format used by the {{site.data.conrefs.hlf_full}} Node.js SDK. This is a different format to the simple endorsement policy format used by the {{site.data.conrefs.hlf_full}} CLI, which you will see in the {{site.data.conrefs.hlf_full}} documentation.

Create an endorsement policy file called `endorsement-policy.json` with the following contents and save it to disk. You will use this file in later steps, so remember where you place it!

    {
        "identities": [
            {
                "role": {
                    "name": "member",
                    "mspId": "Org1MSP"
                }
            },
            {
                "role": {
                    "name": "member",
                    "mspId": "Org2MSP"
                }
            }
        ],
        "policy": {
            "2-of": [
                {
                    "signed-by": 0
                },
                {
                    "signed-by": 1
                }
            ]
        }
    }

The endorsement policy you have just created states that both `Org1` and `Org2` must endorse transactions in the business network before they can be committed to the blockchain. If `Org1` or `Org2` do not endorse transactions, or disagree on the result of a transaction, then the transaction will be rejected by the business network.

<h2 class='everybody'>Step Fourteen: Understanding and selecting the business network administrators</h2>

When a business network is started, the business network must be configured with a set of initial participants. These participants will be responsible for bootstrapping the business network and onboarding other participants into the business network. In {{site.data.conrefs.composer_full}}, we call these initial participants the business network administrators.

In our business network, the organizations `Org1` and `Org2` have equal rights. Each organization will provide a business network administrator for the business network, and those business network administrators will onboard the other participants in their organizations. The business network administrator for `Org1` will be Alice, and the business network administrator for `Org2` will be Bob.

When the business network is started, the certificates (the public part of the identity) for all of the business network administrators must be passed to the organization performing the commands to start the business network. After the business network has been started, all of the business network administrators can use their identities to interact with the business network.

You can find more information on business network administrators in [Deploying Business Networks](../business-network/bnd-deploy.html).

<h2 class='alice'>Step Fifteen: Retrieving business network administrator certificates for Org1</h2>

Run the `composer identity request` command to retrieve certificates for Alice to use as the business network administrator for `Org1`:

    composer identity request -c PeerAdmin@byfn-network-org1-only -u admin -s adminpw -d alice

The `-u admin` and the `-s adminpw` options to this command correspond to the default user registered with the {{site.data.conrefs.hlf_full}} CA (Certificate Authority).

The certficates will be placed into a directory called `alice` in the current working directory. There are three certificate files created, but only two are important. These are `admin-pub.pem`, the certificate (including the public key), and `admin-priv.pem`, the private key. Only the `admin-pub.pem` file is suitable for sharing with other organizations. The `admin-priv.pem` file must be kept secret as it can be used to sign transactions on behalf of the issuing organization.

<h2 class='bob'>Step Sixteen: Retrieving business network administrator certificates for Org2</h2>

Run the `composer identity request` command to retrieve certificates for Bob to use as the business network administrator for `Org2`:

    composer identity request -c PeerAdmin@byfn-network-org2-only -u admin -s adminpw -d bob

The `-u admin` and the `-s adminpw` options to this command correspond to the default user registered with the {{site.data.conrefs.hlf_full}} CA (Certificate Authority).

The certficates will be placed into a directory called `bob` in the current working directory. There are three certificate files created, but only two are important. These are `admin-pub.pem`, the certificate (including the public key), and `admin-priv.pem`, the private key. Only the `admin-pub.pem` file is suitable for sharing with other organizations. The `admin-priv.pem` file must be kept secret as it can be used to sign transactions on behalf of the issuing organization.

<h2 class='alice'>Step Seventeen: Starting the business network</h2>

Run the `composer network start` command to start the business network. Only `Org1` needs to perform this operation. This command uses the `endorsement-policy.json` file created in step thirteen, and the `admin-pub.pem` files created by both Alice and Bob in step fifteen and step sixteen, so you must ensure that all of these files are accessible to this command:

    composer network start -c PeerAdmin@byfn-network-org1 -a tutorial-network@0.0.1.bna -o endorsementPolicyFile=endorsement-policy.json -A alice -C alice/admin-pub.pem -A bob -C bob/admin-pub.pem

Once this command completes, the business network will have been started. Both Alice and Bob will be able to access the business network, start to set up the business network, and onboard other participants from their respective organizations. However, both Alice and Bob must create new business network cards with the certificates that they created in the previous steps so that they can access the business network.

<h2 class='alice'>Step Eighteen: Creating a business network card to access the business network as Org1</h2>

Run the `composer card create` command to create a business network card that Alice, the business network administrator for `Org1`, can use to access the business network:

    composer card create -p connection-org1.json -u alice -n tutorial-network -c alice/admin-pub.pem -k alice/admin-priv.pem

Run the `composer card import` command to import the business network card that you just created:

    composer card import -f alice@tutorial-network.card

Run the `composer network ping` command to test the connection to the blockchain business network:

    composer network ping -c alice@tutorial-network

If the command completes successfully, then you should see the fully qualified participant identifier `org.hyperledger.composer.system.NetworkAdmin#alice` in the output from the command. You can now use this business network card to interact with the blockchain business network and onboard other participants in your organization.

<h2 class='bob'>Step Nineteen: Creating a business network card to access the business network as Org2</h2>

Run the `composer card create` command to create a business network card that Bob, the business network administrator for `Org2`, can use to access the business network:

    composer card create -p connection-org2.json -u bob -n tutorial-network -c bob/admin-pub.pem -k bob/admin-priv.pem

Run the `composer card import` command to import the business network card that you just created:

    composer card import -f bob@tutorial-network.card

Run the `composer network ping` command to test the connection to the blockchain business network:

    composer network ping -c bob@tutorial-network

If the command completes successfully, then you should see the fully qualified participant identifier `org.hyperledger.composer.system.NetworkAdmin#bob` in the output from the command. You can now use this business network card to interact with the blockchain business network and onboard other participants in your organization.

<h2 class='everybody'>Conclusion</h2>

In this tutorial you have seen how to configure {{site.data.conrefs.composer_full}} with all of the information required to connect to a {{site.data.conrefs.hlf_full}} network that spans multiple organizations, and how to deploy a blockchain business network that spans all of the organizations in that {{site.data.conrefs.hlf_full}} network.
