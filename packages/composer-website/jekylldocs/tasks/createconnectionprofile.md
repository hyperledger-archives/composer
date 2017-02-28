---
layout: default
title: Task - Creating a Connection Profile
category: tasks
sidebar: sidebars/tasks.md
excerpt: How to create a new Connection Profile
---

# Creating a new Connection Profile

---

A Connection Profile is used by Fabric Composer to connect to a running fabric. More information about Connection Profiles can be found [here](../reference/connectionprofile.md)

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
3. Using your favourite text editor, create a new file called `connection.json` that contains the following information:

    ```
    {
        "type": <hlf|web>,
        "keyValStore":"/home/<your-username>/.composer-credentials",
        "membershipServicesURL": <your-membership-services-url>,
        "peerURL": <your-peer-url>,
        "eventHubURL": <your-event-hub-url>
    }
    ```
