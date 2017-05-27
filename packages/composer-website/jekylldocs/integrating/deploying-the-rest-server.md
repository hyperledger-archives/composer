---
layout: default
title: Deploying the REST server for a business network
category: start
sidebar: sidebars/integrating.md
excerpt: Deploying the REST server for a business network
---

# Deploying the REST server for a business network

---

When deploying the Hyperledger Composer REST server in a production environment, for example using Docker Swarm or Kubernetes, the REST server should be configured to be highly available. This means that you must deploy multiple instances of the REST server, and those instances should be configured to share data. For example, data such as connection profiles, Blockchain identities, and REST API authentication settings should be shared so that a REST API client can make a request to any of the instances without having to reauthenticate.

## Configuring the REST server with a persistent data store

All user information is persisted in a LoopBack data source by using a LoopBack connector. By default, the REST server uses the LoopBack "memory" connector to persist user information, which is lost when the REST server is terminated. The REST server should be configured with a LoopBack connector that stores data in a highly available data source, for example a database.

You should be able to use any LoopBack connector, but we recommend that you use a LoopBack connector for a NoSQL database. For example, MongoDB or Apache CouchDB.

The LoopBack connector needs to be installed in order for the REST server to locate and use it. You can install additional LoopBack connectors by using `npm`, for example:

    npm install -g loopback-connector-mongodb

Finally, you need to supply the REST server with the connection information required by the LoopBack connector. This connection information should be supplied by using the `COMPOSER_DATASOURCES` environment variable. For more information, see below.

## Configuring the REST server using environment variables

The REST server can be configured using environment variables, instead of supplying configuration options via the command line. The REST server supports the following environment variables:

1. `COMPOSER_CONFIG`

    You can use the `COMPOSER_CONFIG` environment variable to supply connection profiles to the REST server.

    For example:

        COMPOSER_CONFIG='{
          "connectionProfiles": {
            "hlfabric": {
              "type": "hlf",
              "keyValStore": "/home/composer/.composer-credentials",
              "membershipServicesURL": "grpc://membersrvc:7054",
              "peerURL": "grpc://vp0:7051",
              "eventHubURL": "grpc://vp0:7053",
              "deployWaitTime": 300,
              "invokeWaitTime": 30,
              "networks": {
                "org.acme.biznet": "25e9c6abfdc8a081c218e773f2e513ee504ba9acb437d05fac7e08fa5c0d309d"
              }
            }
          }
        }'

2. `COMPOSER_CONNECTION_PROFILE`

    You can use the `COMPOSER_CONNECTION_PROFILE` environment variable to specify the name of the connection profile that the REST server should use.

    For example:

        COMPOSER_CONNECTION_PROFILE=hlfabric

3. `COMPOSER_BUSINESS_NETWORK`

    You can use the `COMPOSER_BUSINESS_NETWORK` environment variable to specify the name of the deployed business network that the REST server should connect to.

    For example:

        COMPOSER_BUSINESS_NETWORK=digitalproperty-network

4. `COMPOSER_ENROLLMENT_ID`

    You can use the `COMPOSER_ENROLLMENT_ID` environment variable to specify the enrollment ID of the Blockchain identity that the REST server should use to connect to the deployed business network.

    For example:

        COMPOSER_ENROLLMENT_ID=loopback1

5. `COMPOSER_ENROLLMENT_SECRET`

    You can use the `COMPOSER_ENROLLMENT_SECRET` environment variable to specify the enrollment secret of the Blockchain identity that the REST server should use to connect to the deployed business network.

    For example:

        COMPOSER_ENROLLMENT_SECRET=RVsigkBwXrDv

6. `COMPOSER_NAMESPACES`

    You can use the `COMPOSER_NAMESPACES` environment variable to specify if the REST server should generate a REST API with namespaces or not. Valid values are `always`, `required`, and `never`.

    For example:

        COMPOSER_NAMESPACES=never

7. `COMPOSER_SECURITY`

    You can use the `COMPOSER_SECURITY` environment variable to specify if the REST server should enable REST API authentication or not. Valid values are `true` and `false`.

    For example:

        COMPOSER_SECURITY=true

    For more information, see [Enabling REST API authentication for a business network](./enabling-rest-authentication.html).

8. `COMPOSER_DATASOURCES`

    You can use the `COMPOSER_DATASOURCES` environment variable to specify the LoopBack data sources and the connection information required by the selected LoopBack connector.

    For example:

        COMPOSER_DATASOURCES='{
          "db": {
            "name": "db",
            "connector": "mongodb",
            "host": "mongo"
          }
        }'

9. `COMPOSER_PROVIDERS`

    You can use the `COMPOSER_PROVIDERS` environment variable to specify the Passport strategies that the REST server should use to authenticate clients of the REST API.

    For example:

        COMPOSER_PROVIDERS='{
          "github": {
            "provider": "github",
            "module": "passport-github",
            "clientID": "REPLACE_WITH_CLIENT_ID",
            "clientSecret": "REPLACE_WITH_CLIENT_SECRET",
            "authPath": "/auth/github",
            "callbackURL": "/auth/github/callback",
            "successRedirect": "/",
            "failureRedirect": "/"
          }
        }'

## Packaging the REST server with additional Node.js modules

In order to deploy the REST server as a Docker container with additional LoopBack connectors and Passport strategies, you must extend the `hyperledger/composer-rest-server` Docker image.

Here is an example Dockerfile that adds the LoopBack connector for MongoDB and the Passport strategy for GitHub to the Docker image:

    FROM hyperledger/composer-rest-server
    RUN npm install --production loopback-connector-mongodb passport-github && \
        npm cache clean && \
        ln -s node_modules .node_modules

You can build this Docker image by placing the Dockerfile above into a directory and using the `docker build` command, for example:

    docker build -t myorg/my-composer-rest-server .

You may need to publish this Docker image to a Docker image repository, for example Docker Hub, in order to use it with cloud based Docker deployment services.

## Deploying a persistent and secured REST server using Docker

The following example will demonstrate how to deploy the REST server using Docker. The deployed REST server will persist data using MongoDB, and will be secured using GitHub authentication.

The examples are based on the Getting Started guide for Hyperledger Fabric v1.0, and may need adjusting for your configuration, for example if the Docker network name does not match.

1. Start an instance of MongoDB:

        docker run -d --name mongo --network hlfv1_default -p 27017:27017 mongo

2. Create a new, empty directory. Create a new file named `Dockerfile` in the new directory, with the following contents:

        FROM hyperledger/composer-rest-server
        RUN npm install --production loopback-connector-mongodb passport-github && \
            npm cache clean && \
            ln -s node_modules .node_modules

3. Change into the directory created in step 2, and build the Docker image:

        docker build -t myorg/my-composer-rest-server .

4. Create a new file named `envvars.txt`, with the following contents:

        COMPOSER_CONNECTION_PROFILE=hlfabric
        COMPOSER_BUSINESS_NETWORK=digitalproperty-network
        COMPOSER_ENROLLMENT_ID=admin
        COMPOSER_ENROLLMENT_SECRET=adminpw
        COMPOSER_NAMESPACES=never
        COMPOSER_SECURITY=true
        COMPOSER_CONFIG='{
          "connectionProfiles": {
            "hlfabric": {
              "type": "hlfv1",
              "orderers": [
                "grpc://orderer0:7050"
              ],
              "ca": "http://ca0:7054",
              "peers": [
                {
                  "requestURL": "grpc://peer0:7051",
                  "eventURL": "grpc://peer0:7053"
                },
                {
                  "requestURL": "grpc://peer1:7051",
                  "eventURL": "grpc://peer1:7053"
                }
              ],
              "keyValStore": "/home/composer/.hfc-key-store",
              "channel": "mychannel",
              "mspID": "Org1MSP",
              "deployWaitTime": "300",
              "invokeWaitTime": "100"
            }
          }
        }'
        COMPOSER_DATASOURCES='{
          "db": {
            "name": "db",
            "connector": "mongodb",
            "host": "mongo"
          }
        }'
        COMPOSER_PROVIDERS='{
          "github": {
              "provider": "github",
              "module": "passport-github",
              "clientID": "REPLACE_WITH_CLIENT_ID",
              "clientSecret": "REPLACE_WITH_CLIENT_SECRET",
              "authPath": "/auth/github",
              "callbackURL": "/auth/github/callback",
              "successRedirect": "/",
              "failureRedirect": "/"
          }
        }'

5. Load the environment variables:

        source envvars.txt

6. Start the Docker container:

        docker run \
            -d \
            -e COMPOSER_CONNECTION_PROFILE=${COMPOSER_CONNECTION_PROFILE} \
            -e COMPOSER_BUSINESS_NETWORK=${COMPOSER_BUSINESS_NETWORK} \
            -e COMPOSER_ENROLLMENT_ID=${COMPOSER_ENROLLMENT_ID} \
            -e COMPOSER_ENROLLMENT_SECRET=${COMPOSER_ENROLLMENT_SECRET} \
            -e COMPOSER_NAMESPACES=${COMPOSER_NAMESPACES} \
            -e COMPOSER_SECURITY=${COMPOSER_SECURITY} \
            -e COMPOSER_CONFIG="${COMPOSER_CONFIG}" \
            -e COMPOSER_DATASOURCES="${COMPOSER_DATASOURCES}" \
            -e COMPOSER_PROVIDERS="${COMPOSER_PROVIDERS}" \
            --name rest \
            --network hlfv1_default \
            -p 3000:3000 \
            myorg/my-composer-rest-server

You should now be able to access the persistent and secured REST server using the following URL: [http://localhost:3000/explorer/](http://localhost:3000/explorer/).