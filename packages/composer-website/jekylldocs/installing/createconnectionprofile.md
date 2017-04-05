---
layout: default
title: Task - Creating a Connection Profile
category: tasks
sidebar: sidebars/installing.md
excerpt: How to create a new Connection Profile
---

# Creating a new Connection Profile

---

A Connection Profile is used by Fabric Composer to connect to a running fabric. More information about Connection Profiles can be found [here](../reference/connectionprofile.html)

## Procedure

1. Navigate to the Connection Profile store:
    ```
    cd $HOME/.composer-connection-profiles
    ```
2. Create a new profile folder
    ```
    mkdir ./MyProfile
    ```
    then navigate into the new profile folder
    ```
    cd MyProfile
    ```
3. Using your favourite text editor, create a new file called `connection.json` that contains the following information for fabric V0.6

    ```
    {
        "type": <hlf|web>,
        "keyValStore":"/home/<your-username>/.composer-credentials",
        "membershipServicesURL": <your-membership-services-url>,
        "peerURL": <your-peer-url>,
        "eventHubURL": <your-event-hub-url>
    }
    ```
4. Using your favourite text editor, create a new file called `connection.json` that contains the following information as an example for fabric V1.0

    ```
    {
      "type": "hlfv1",
      "orderers": [
          {
          "url": "grpc://localhost:7050"
        }
      ],
      "ca": "http://localhost:7054",
      "peers": [
        {
          "requestURL":"grpc://localhost:7051",
          "eventURL":"grpc://localhost:7053"
        },
        {
          "requestURL":"grpc://localhost:7056",
          "eventURL":"grpc://localhost:7058"
        }
      ],
      "keyValStore": "/Users/Fenglian/.hfc-key-store",
      "channel": "mychannel",
      "mspID": "Org1MSP",
      "deployWaitTime": "300",
      "invokeWaitTime": "100"
  }
    ```
