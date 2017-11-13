---
layout: default
title: Enabling multiple user mode for the REST server
category: start
section: integrating
index-order: 704
sidebar: sidebars/accordion-toc0.md
excerpt: The REST server can be [**configured to multiple user mode**](./enabling-multiuser.html). Multiple user mode permits clients of the REST server to provide their own Blockchain identities for digitally signing transactions. This enables the business network to differentiate between different clients of the REST server.
---

# Enabling multiple user mode for the REST server

---

By default, the {{site.data.conrefs.composer_full}} REST server services all requests by using the Blockchain identity specified on the command line at startup. For example, when using the following command, all requests made to the REST server will be serviced by using the Blockchain identity **alice1** to digitally sign all transactions:

    composer-rest-server -c alice1@my-network

This means that the business network cannot distinguish between different clients of the REST server. This may be acceptable in certain use cases, for example if the Blockchain identity only has read-only access and the REST server is secured using an API management gateway.

The REST server can be configured to multiple user mode. Multiple user mode permits clients of the REST server to provide their own Blockchain identities for digitally signing transactions. This enables the business network to differentiate between different clients of the REST server.

Multiple user mode requires that REST API authentication is enabled, and will automatically enable REST API authentication if it is not explicitly specified. You must select and configure a Passport strategy for authenticating users. REST API authentication is required so that clients can be identified.

Once a client has authenticated to the REST API, that client can add Blockchain identities to a wallet. The wallet is private to that client, and is not accessible to other clients. When a client makes a request to the REST server, a Blockchain identity in the clients wallet is used to digitally sign all transactions made by that client.

Please note that this feature requires that clients trust the REST server. This trust is required because this feature requires that the REST server stores the clients Blockchain identities, including the private keys. Therefore, it is strongly recommended that clients only use REST servers that are managed by a trusted party, such as an administrator within their organization.

## Starting the REST server with multiple user mode enabled

You must configure the environment variable `COMPOSER_PROVIDERS` before continuing. For instructions on how to perform this task, read the following topic before continuing: [Enabling authentication for the REST server](./enabling-rest-authentication.md)

You can use the `-m true` argument to start the REST server with multiple user mode enabled. Once multiple user mode is enabled, clients will have to authenticate before they can make any requests to the business network.

For example, here is the command for the business network that is deployed as part of the Developer Tutorial, however you may need to modify the command for your business network:

    composer-rest-server -c admin@my-network -m true

The `-m true` argument automatically enables REST API authentication. You can alternatively supply both arguments, `-a true -m true`, if you wish to be explicit. Before continuing, you must authenticate to the REST API using the configured authentication mechanism.

Now, navigate to the REST API explorer at [http://localhost:3000/explorer/](http://localhost:3000/explorer/). If multiple user mode has been successfully enabled, any attempts to call one of the business network REST API operations using the REST API explorer should be rejected with an `A business network card has not been specified` error message.

If you see a `HTTP 401 Authorization Required` error message, you have not authenticated correctly to the REST API.

## Adding a business network card to the wallet

First, you must issue a Blockchain identity to a participant in the business network. This example will assume that you have issued the Blockchain identity `alice1` to the participant `org.acme.mynetwork.Trader#alice@email.com`, and that you have created a business network card for this Blockchain identity stored in the file `alice1@my-network.card`.

Follow these steps to add a business network card to the wallet:

1. Navigate to the REST API explorer at http://localhost:3000/explorer/, and then navigate to the wallet APIs by expanding the **Wallet** category.
2. Check that the wallet does not contain any business network cards by calling the `GET /wallet` operation. The response from the operation should be:

    ```json
    []
    ```
3. Import the business network card into the wallet by calling the `POST /wallet/import` operation. You must specify the business network card file `alice1@my-network.card` by clicking the **Choose File** button. The response from the operation should be:

    ```
    no content
    ```

    The business network card `alice1@my-network` has now been imported into the wallet.
4. Check that the wallet does contain the business network card `alice1@my-network` by calling the `GET /wallet` operation. The response from the operation should be:

    ```json
    [
        {
            "name": "alice1@my-network",
            "default": true
        }
    ]
    ```

    The business network card `alice1@my-network` is displayed. The value of the `default` property is `true`, which means that this business network card will be used by default when interacting with the business network.

Now, navigate to the REST API explorer at http://localhost:3000/explorer/. Attempt to call one of the business network REST API operations again using the REST API explorer. This time, the calls should succeed.

You can test that the Blockchain identity is being used by calling the `GET /system/ping` operation. This operation returns the fully qualified identifier for the participant that the Blockchain identity was issued to:

    {
      "version": "0.8.0",
      "participant": "org.acme.mynetwork.Trader#alice@email.com"
    }

## Final notes

When the REST server is started with multiple user mode enabled, all REST API requests made by clients use a Blockchain identity stored in the clients wallet. The Blockchain identity specified on the command line at startup is not used to service any requests; it is only used to initially connect to the business network and download the business network definition, which is required to generate the REST API. Therefore, the Blockchain identity specified on the command line only requires minimal permissions - the ability to connect, and the ability to download the business network definition - it does not need permission for any assets, participants, or transactions.

All user information is persisted in a LoopBack data source by using a LoopBack connector. By default, the REST server uses the LoopBack "memory" connector to persist user information, which is lost when the REST server is terminated. The REST server should be configured with a LoopBack connector that stores data in a highly available data source, for example a database. For more information, see [Deploying the REST server](./deploying-the-rest-server.md).
