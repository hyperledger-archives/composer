---
layout: default
title: Enabling REST API authentication for a business network
category: start
section: integrating
index-order: 602
sidebar: sidebars/accordion-toc0.md
excerpt: By default, the Hyperledger Composer REST server services all requests by using the Blockchain identity specified on the command line at startup. By [**enabling authentication, the identity of the client can be used to digitally sign all transactions made by that client.**](./enabling-rest-authentication.html)
---

# Enabling REST API authentication for a business network

---

By default, the {{site.data.conrefs.composer_full}} REST server services all requests by using the Blockchain identity specified on the command line at startup. For example, when using the following command, all requests made to the REST server will be serviced by using the Blockchain identity **alice1** to digitally sign all transactions:

    composer-rest-server -p hlfv1 -n my-network -i alice1 -s suchs3cret

This means that the business network cannot distinguish between different clients of the REST server. This may be acceptable in certain use cases, for example if the Blockchain identity only has read-only access and the REST server is secured using an API management gateway.

The REST server can be optionally configured to authenticate clients. Once authenticated, a client can add Blockchain identities to a wallet. The wallet is private to that client, and is not accessible to other clients. When a client makes a request to the REST server, a Blockchain identity in the clients wallet is used to digitally sign all transactions made by that client.

Please note that this feature requires that clients trust the REST server. This trust is required because this feature requires that the REST server stores the clients Blockchain identities, including the private keys. Therefore, it is strongly recommended that clients only use REST servers that are managed by a trusted party, such as an administrator within their organization.

## Selecting an authentication strategy

The REST server uses the open source [Passport](http://passportjs.org) authentication middleware. Administrators of the REST server must select Passport strategies to authenticate clients. Multiple Passport strategies can be selected, allowing clients of the REST server to select a preferred authentication mechanism. Passport includes a wide range of strategies (300+ at the time of writing), including a mix of social media (Google, Facebook, Twitter) and enterprise (SAML, LDAP) strategies.

The rest of this document will demonstrate how to use the `passport-github` strategy to authenticate users using their GitHub ID. Install the `passport-github` strategy by executing the following command:

    npm install -g passport-github

## Configuring the REST server to use an authentication strategy

The REST server must be configured with a list of Passport strategies to use before REST API authentication can be enabled. This configuration includes both the names of the strategies to use and the individual configuration for each strategy.

In order to configure the `passport-github` strategy, we will need to register an OAuth application on GitHub and retrieve the client ID and client secret. Follow these steps to register an OAuth application on GitHub:

1. Navigate to [GitHub](https://github.com) and log in with your user ID and password.
2. Click on your profile picture on the top right, and click on **Settings** from the drop down menu.
3. Click on **OAuth applications** under **Developer settings** on the left hand bar.
4. Click on **Register a new application**.
5. Specify the following settings:
  * Application name: Composer
  * Homepage: http://localhost:3000/
  * Application description: OAuth application for Composer
  * Authorization callback URL: http://localhost:3000/auth/github/callback
6. Click on **Register application**.
7. Note down the values for **Client ID** and **Client Secret**.

The configuration for the REST server should be specified using the environment variable `COMPOSER_PROVIDERS`. Set the configuration for the REST server by replacing the values of `REPLACE_WITH_CLIENT_ID` and `REPLACE_WITH_CLIENT_SECRET` with the values retrieved from step 7, and executing the following command:

    export COMPOSER_PROVIDERS='{
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

## Starting the REST server with REST API authentication enabled

Once the environment variable `COMPOSER_PROVIDERS` has been set, you can use the `-S true` argument to start the REST server with security enabled. Once security is enabled, clients will have to authenticate before they can make any requests to the business network.

For example, here is the command for the business network that is deployed as part of the Developer Tutorial, however you may need to modify the command for your business network:

    composer-rest-server -p hlfv1 -n my-network -i admin -s adminpw -S true

Now, navigate to the REST API explorer at [http://localhost:3000/explorer/](http://localhost:3000/explorer/). If security has been successfully enabled, any attempts to call one of the business network REST API operations using the REST API explorer should be rejected with an `HTTP 401 Authorization Required` message.

## Authenticating to the REST server

This step is dependent on the configuration and behaviour of the Passport strategies being used by the REST server.

1. Authenticate to the REST server by navigating to the value of the `authPath` property specified in the environment variable `COMPOSER_PROVIDERS`. In the example above, this is [http://localhost:3000/auth/github](http://localhost:3000/auth/github).
2. The REST server will redirect you to GitHub to perform the OAuth web server authentication flow. GitHub will ask you if you want to authorize the Composer application to access your account. Click the **Authorize** button.
3. If successful, GitHub will redirect you back to the REST server.

Now, navigate to the REST API explorer at http://localhost:3000/explorer/. Attempt to call one of the business network REST API operations again using the REST API explorer. This time, the calls should be rejected with an `No enrollment ID or enrollment secret has been provided` error message.

## Adding a Blockchain identity to the default wallet

First, you must issue a Blockchain identity to a participant in the business network. This example will assume that you have issued the Blockchain identity `alice1` to the participant `org.acme.mynetwork.Trader#alice@email.com`, and the secret is `suchs3cret`.

Follow these steps to add a Blockchain identity to the default wallet:

1. Navigate to the REST API explorer at http://localhost:3000/explorer/.
2. List all of the authenticated clients wallets by expanding the **Wallet** category and calling the `GET /wallets` operation.
    The response from the operation should be similiar to the following:

    ```json
    [
      {
        "description": "Default wallet",
        "id": 1
      }
    ]
    ```

    Each wallet has a unique ID that will be used in subsequent REST API calls for interacting with the wallet. Note down the value of the `id` property for the wallet with the description `Default wallet`, in this example `1`.
3. List the Blockchain identities in the default wallet by calling the `GET /wallets/{id}/identities` operation with the `id` parameter set to the unique wallet ID noted from step 2.
    The response from the operation should be:

    ```json
    []
    ```

    This means that there are no Blockchain identities in the default wallet.
4. Add the Blockchain identity to the default wallet by calling the `POST /wallets/{id}/identities` operation with the `id` parameter set to the unique wallet ID noted from step 2, and the `data` parameter set to the following JSON payload (do not include the `id` property in the JSON payload):

    ```json
    {
      "enrollmentID": "alice1",
      "enrollmentSecret": "suchs3cret"
    }
    ```

    The response from the operation should be similiar to the following:

    ```json
    {
      "enrollmentID": "alice1",
      "enrollmentSecret": "suchs3cret",
      "id": 2
    }
    ```

    The Blockchain identity for `alice1` has now been added to the default wallet. Each Blockchain identity has a unique ID that will be used in subsequent REST API calls for interacting with the Blockchain identity. Note down the value of the `id` property for the Blockchain identity, in this example `2`.
5. Set the Blockchain identity as the default Blockchain identity for the default wallet by calling the `POST /wallets/{id}/identities/{fk}/setDefault` operation with the `id` parameter set to the unique wallet ID noted from step 2, and the `fk` parameter set to the unique Blockchain identity ID noted from step 4.
    The response from the operation should be:

    ```
    no content
    ```

    The Blockchain identity has now been set as the default Blockchain identity for the default wallet.

Now, navigate to the REST API explorer at http://localhost:3000/explorer/. Attempt to call one of the business network REST API operations again using the REST API explorer. This time, the calls should succeed.

You can test that the Blockchain identity is being used by calling the `GET /system/ping` operation. This operation returns the fully qualified identifier for the participant that the Blockchain identity was issued to:

    {
      "version": "0.8.0",
      "participant": "org.acme.mynetwork.Trader#alice@email.com"
    }

## Final notes

When the REST server is started with REST API authentication enabled, all REST API requests made by clients use a Blockchain identity stored in the clients wallet. The Blockchain identity specified on the command line at startup is not used to service any requests; it is only used to initially connect to the business network and download the business network definition, which is required to generate the REST API. Therefore, the Blockchain identity specified on the command line only requires minimal permissions - the ability to connect, and the ability to download the business network definition - it does not need permission for any assets, participants, or transactions.

All user information is persisted in a LoopBack data source by using a LoopBack connector. By default, the REST server uses the LoopBack "memory" connector to persist user information, which is lost when the REST server is terminated. The REST server should be configured with a LoopBack connector that stores data in a highly available data source, for example a database. For more information, see [Deploying the REST server](./deploying-the-rest-server.md).
