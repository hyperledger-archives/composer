# Hyperledger Composer REST Server

Set up the Composer REST Server with this command

```
npm install composer-rest-server -g
```

You may need to prefix this with a `sudo` command in order to have the necessary permissions ie.
```
sudo npm install composer-rest-server -g
```

## Overview
This is a simple application that prompts the user for details of a connection profile, Business Network Identifier, participant id and participant password.  The application then starts a loopback application which uses the Hyperledger Composer LoopBack Connector to connect to the Business Network, extract the models and then present a page containing the REST APIs that have been generated for the model.   

Executing those APIs will then have a real effect on the business network to which the application is connected.

## Usage

```bash  
composer-rest-server
```

## Hints and Tips
For a connection profile, Hyperledger Composer looks for a `connection.json` file in the user's `<HOME>/.composer-connection-profiles`
directory.  

e.g. If your connection profile is specified in `<HOME DIR>/.composer-connection-profiles/auction-app/connection.json` then you
would need to specify `auction-app` as your connection profile.

Additionally the business network identifier that you'll need to specify is that which the business network was deployed with.
Here is an example connection.json profile:
```
{
    "type": "hlf",
    "keyValStore": "/Users/me/.composer-credentials/kvs",
    "membershipServicesURL": "grpc://some.ip.address.here:7054",
    "peerURL": "grpc://some.ip.address.here:7051",
    "eventHubURL": "grpc://some.ip.address.here:7053",
    "deployWaitTime": 300,
    "invokeWaitTime": 10,
    "networks": {
        "org.acme.biznissnet": "1facb9f46ac3998f4bce1dbaf8979085b01737fccb45db70903895901288ec00"
    }
}
```
