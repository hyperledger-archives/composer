---
layout: default
title: Task - Creating a connection profile
category: tasks
sidebar: sidebars/installing.md
excerpt: How to create a new connection profile
---

# Creating a new Connection Profile

---

A Connection Profile is used by {{site.data.conrefs.composer_full}} to connect to a running Hyperledger Fabric instance. More information about Connection Profiles can be found [here](../reference/connectionprofile.html)

## Procedure

1. Navigate to the Connection Profile store:
  ```
  cd $HOME/.composer-connection-profiles
  ```
2. Create a new profile folder.
  ```
  mkdir ./MyProfile
  ```
3. Navigate into the new profile folder.
  ```
  cd MyProfile
  ```
4. Create a new file called `connection.json` that contains the following information for either Hyperledger Fabric v0.6 or v1.0. If you are creating a connection profile for Hyperledger Fabric v0.6, use the following format:

  ```
  {
      "type": <hlf|web>,
      "keyValStore":"/home/<your-username>/.composer-credentials",
      "membershipServicesURL": <your-membership-services-url>,
      "peerURL": <your-peer-url>,
      "eventHubURL": <your-event-hub-url>
  }
  ```

  If you are creating a connection profile for Hyperledger Fabric v1.0, use the following format:

  ```
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
  "keyValStore": "/home/matthew/.hfc-key-store",
  "channel": "mychannel",
  "mspID": "Org1MSP",
  "deployWaitTime": "300",
  "invokeWaitTime": "100"
  }
  ```
---

## What next?

* Learn more about [defining business networks](../business-network/businessnetwork.html)
* Writing [applications for your solution](../applications/genapp.html)
