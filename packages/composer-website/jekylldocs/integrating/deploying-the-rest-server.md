---
layout: default
title: Deploying the REST server for a business network
category: start
section: integrating
index-order: 706
sidebar: sidebars/accordion-toc0.md
excerpt: By deploying a REST server for a business network, you can [**integrate existing systems and data with your Hyperledger Composer business network**](./deploying-the-rest-server.html), allowing you to create, update, or delete assets and participants, as well as get and submit transactions.
---

# Deploying the REST server for a business network

---

When deploying the {{site.data.conrefs.composer_full}} REST server in a production environment, for example using Docker Swarm or Kubernetes, the REST server should be configured to be highly available. This means that you must deploy multiple instances of the REST server, and those instances should be configured to share data. For example, data such as connection profiles, Blockchain identities, and REST API authentication settings should be shared so that a REST API client can make a request to any of the instances without having to reauthenticate.

## Business network cards and the business network card store

The REST server uses a business network card specified during startup to connect to and discover the assets, participants, and transactions within a deployed business network. This information is required in order to generate the REST API. This business network card is known as the discovery business network card. By default, the discovery business network card is also used to handle all requests to the REST API. However the REST server can also be configured to multiple user mode, which allows authenticated users to supply their own business network cards for handling requests to the REST API.

In order to use a discovery business network card, that business network card must first be imported into a business network card store available to the REST server. The default business network card store is a local file system directory with the path `~/.composer` (where `~` is the current users home directory). When using the Docker image for the REST server, you must mount a volume into place of the default business network card store that contains an imported discovery business network card. In the Docker image for the REST server, the business network card store used by the REST server is in the directory `/home/composer/.composer` (because the REST server in the Docker image always runs under the `composer` user).

A business network card contains a connection profile that describes how to connect to the Hyperledger Fabric network where the deployed business network is running. Note that the connection profile must be valid for use within the Docker image for the REST server, and the hostnames must be correct and accessible by this Docker image.

## Configuring the REST server with a persistent data store

All information regarding authenticated users and their wallets (containing that users business network cards when multiple user mode is enabled) is persisted in a LoopBack data source by using a LoopBack connector. By default, the REST server uses the LoopBack "memory" connector to persist user information, which is lost when the REST server is terminated. The REST server should be configured with a LoopBack connector that stores data in a highly available data source, for example a database.

You should be able to use any LoopBack connector, but we recommend that you use a LoopBack connector for a NoSQL database. For example, MongoDB or Apache CouchDB.

The LoopBack connector needs to be installed in order for the REST server to locate and use it. You can install additional LoopBack connectors by using `npm`, for example:

    npm install -g loopback-connector-mongodb

Finally, you need to supply the REST server with the connection information required by the LoopBack connector. This connection information should be supplied by using the `COMPOSER_DATASOURCES` environment variable. For more information on the environment variables that can be used to configure the REST server, see the reference documentation: [Hyperledger Composer REST Server](../reference/rest-server.html)

## Extending the Docker image for the REST server with additional Node.js modules

In order to deploy the REST server as a Docker container with additional LoopBack connectors and Passport strategies, you must extend the `hyperledger/composer-rest-server` Docker image.

Here is an example Dockerfile that adds the LoopBack connector for MongoDB and the Passport strategy for GitHub to the Docker image:

    FROM hyperledger/composer-rest-server
    RUN npm install --production loopback-connector-mongodb passport-github && \
        npm cache clean --force && \
        ln -s node_modules .node_modules

You can build this Docker image by placing the Dockerfile above into a directory and using the `docker build` command, for example:

    docker build -t myorg/my-composer-rest-server .

You may need to publish this Docker image to a Docker image repository, for example Docker Hub, in order to use it with cloud based Docker deployment services.

## Deploying a persistent and secured REST server using Docker

The following example will demonstrate how to deploy the REST server using Docker. The deployed REST server will persist data using MongoDB, and will be secured using GitHub authentication.

The examples are based on the business network that is deployed to Hyperledger Fabric v1.0 as part of the Developer Tutorial, and may need adjusting for your configuration, for example if the Docker network name does not match.

1. Ensure that a valid business network card for your business network is in your local business network card store by running the following `composer network ping` command. This example uses a business network card for the `admin` user on the `my-network` business network:

    ```
    composer network ping -c admin@my-network
    ```

    Note that you **must** use the `composer network ping` command to test the connection to the business network before proceeding. If the business network card only contains a user ID and enrollment secret, then the `composer network ping` command will trigger the enrollment process to occur and certificates to be stored in the business network card. It is **not** advisable to use a business network card with only a user ID and enrollment secret when using the Docker image for the REST server.

2. Start an instance of the Docker image for MongoDB named `mongo`. This MongoDB instance will be used to persist all information regarding authenticated users and their wallets (containing that users business network cards when multiple user mode is enabled) for the REST server.

    ```
    docker run -d --name mongo --network composer_default -p 27017:27017 mongo
    ```

    Note that the MongoDB instance is attached to the Docker network named `composer_default`. This means that the MongoDB instance will be available on the Docker network named `composer_default` using the hostname `mongo`. We will use the hostname `mongo` to configure the REST server in a subsequent step. Depending on your Docker networking configuration, you may need to specify a different Docker network name. The MongoDB port `27017` is also exposed on the host network using port `27017`, so you can use other MongoDB client applications to interact with this MongoDB instance if desired.

3. Extend the Docker image for the REST server by adding the LoopBack connector for MongoDB and the Passport strategy for GitHub authentication. Create a new, empty directory on your local file system, and create a new file named `Dockerfile` in the new directory, with the following contents:

    ```
    FROM hyperledger/composer-rest-server
    RUN npm install --production loopback-connector-mongodb passport-github && \
        npm cache clean --force && \
        ln -s node_modules .node_modules
    ```

    Build the extended Docker image by running the following `docker build` command in the directory containing the file named `Dockerfile` that you just created:

    ```
    docker build -t myorg/my-composer-rest-server .
    ```

    If this command completes successfully, a new Docker image called `myorg/my-composer-rest-server` has been built and stored in the local Docker registry on your system. If you wish to use this Docker image on other systems, you may need to push the Docker image into a Docker registry, such as Docker Hub.

4. The Docker image for the REST server is configured using environment variables rather than command line options. Create a new file named `envvars.txt` to store the environment variables for our REST server, with the following contents:

    ```
    COMPOSER_CARD=admin@my-network
    COMPOSER_NAMESPACES=never
    COMPOSER_AUTHENTICATION=true
    COMPOSER_MULTIUSER=true
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
    COMPOSER_DATASOURCES='{
        "db": {
            "name": "db",
            "connector": "mongodb",
            "host": "mongo"
        }
    }'
    ```

    Note that the name of the discovery business network card `admin@my-network` has been set as the value of the `COMPOSER_CARD` environment variable. We have disabled namespaces in the generated REST API by specifying `never` as the value of the `COMPOSER_NAMESPACES` environment variable. We have enabled authentication of REST API clients by setting the `COMPOSER_AUTHENTICATION` environment variable to `true`, and also enabled multi-user mode by setting the `COMPOSER_MULTIUSER` environment variable to `true`.

    We have configured our REST server to use GitHub authentication by configuring the Passport strategy for GitHub in the `COMPOSER_PROVIDERS` environment variable. Note that you must replace both `REPLACE_WITH_CLIENT_ID` and `REPLACE_WITH_CLIENT_SECRET` with the appropriate configuration from GitHub in order for this configuration to work successfully.

    We have configured our REST server to use our MongoDB instance by configuring the LoopBack connector for MongoDB in the `COMPOSER_DATASOURCES` environment variable. Note that the host name of the MongoDB instance, `mongo`, has been specified in the `host` property of the LoopBack data source named `db`.

    Load the environment variables into your current shell by running the following command:

    ```
    source envvars.txt
    ```

    If you open a new shell, for example a new terminal window or tab, then you must run the same `source` command again to load the environment variables into the new shell.

    For more information on the environment variables that can be used to configure the REST server, see the reference documentation: [Hyperledger Composer REST Server](../reference/rest-server.html)

5. Start a new instance of the extended Docker image for the REST server that you created in step 3 by running the following `docker run` command:

    ```
    docker run \
        -d \
        -e COMPOSER_CARD=${COMPOSER_CARD} \
        -e COMPOSER_NAMESPACES=${COMPOSER_NAMESPACES} \
        -e COMPOSER_AUTHENTICATION=${COMPOSER_AUTHENTICATION} \
        -e COMPOSER_MULTIUSER=${COMPOSER_MULTIUSER} \
        -e COMPOSER_PROVIDERS="${COMPOSER_PROVIDERS}" \
        -e COMPOSER_DATASOURCES="${COMPOSER_DATASOURCES}" \
        -v ~/.composer:/home/composer/.composer \
        --name rest \
        --network composer_default \
        -p 3000:3000 \
        myorg/my-composer-rest-server
    ```

    Note that we have passed through all of the environment variables that we set in previous steps by using multiple `-e` options. If you need to add or remove any additional environment variables to configure the REST server, then you must add or remove the appropriate `-e` options as well.

    We have mounted our local business network card store into the REST server Docker container by specifying `-v ~/.composer:/home/composer/.composer`. This permits the REST server to access and use our local business network card store when trying to load the discovery business network card specified using the `COMPOSER_CARD` environment variable.

    We have also specified the Docker network name `composer_default`, and name of the Docker container as `rest`. This means that the REST server instance will be available on the Docker network named `composer_default` using the hostname `rest`. The REST server port `3000` is also exposed on the host network using port `3000`.
    
    You can check that the REST server has started successfully by using the `docker logs` command, for example:

    ```
    docker logs -f rest
    ```

    If the REST server has started successfully, then you will see it output a log message similar to `Browse your REST API at http://localhost:3000/explorer`.
    
Now that the REST server has started successfully, you can access the REST server running inside the Docker container by using the following URL: [http://localhost:3000/explorer/](http://localhost:3000/explorer/). 

## Final notes

In this guide, you have seen how to start a single instance of the REST server using Docker, where that single instance is configured to use MongoDB as a persistent data store. For a true highly available, production deployment of the REST server, you will need to:

- Configure a highly available instance of the persistent data store, for example a MongoDB replica set.
- Run multiple instances of the REST server Docker image. This is easy to do by changing the name of the Docker container using the `--name` argument, and updating or removing the host port mapping for subsequent REST server instances using the `-p 3000:3000` argument.
- Deploy a load balancer, for example Nginx, to distribute REST requests from clients across all of the instances of the REST server.

Once you have performed these three tasks, you should be able to stop, restart, or remove any of the REST server instances (but not all!) without losing access to the deployed business network over REST.
