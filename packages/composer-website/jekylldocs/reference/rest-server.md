---
layout: default
title: Hyperledger Composer REST Server
section: reference
index-order: 1010
sidebar: sidebars/accordion-toc0.md
excerpt: Reference documentation for the Hyperledger Composer REST server.
---

# Hyperledger Composer REST Server

The Hyperledger Composer REST server, `composer-rest-server`, can be used to generate a REST API from a deployed blockchain business network that can be easily consumed by HTTP or REST clients.

## Configuring the REST server using environment variables

The REST server can be configured using environment variables, instead of supplying configuration options via the command line. The REST server supports the following environment variables:

1. `COMPOSER_CARD`

    You can use the `COMPOSER_CARD` environment variable to specify the name of the discovery business network card that the REST server should use to connect to the business network.

    For example:

        COMPOSER_CARD=admin@my-network

2. `COMPOSER_NAMESPACES`

    You can use the `COMPOSER_NAMESPACES` environment variable to specify if the REST server should generate a REST API with namespaces or not. Valid values are `always`, `required`, and `never`.

    For example:

        COMPOSER_NAMESPACES=never

3. `COMPOSER_AUTHENTICATION`

    You can use the `COMPOSER_AUTHENTICATION` environment variable to specify if the REST server should enable REST API authentication or not. Valid values are `true` and `false`.

    For example:

        COMPOSER_AUTHENTICATION=true

    For more information, see [Enabling authentication for the REST server](../integrating/enabling-rest-authentication.html).

4. `COMPOSER_MULTIUSER`

    You can use the `COMPOSER_MULTIUSER` environment variable to specify if the REST server should enable multiple user mode or not. Valid values are `true` and `false`.

    For example:

        COMPOSER_MULTIUSER=true

    For more information, see [Enabling multiple user mode for the REST server](../integrating/enabling-multiuser.html).

5. `COMPOSER_PROVIDERS`

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

6. `COMPOSER_DATASOURCES`

    You can use the `COMPOSER_DATASOURCES` environment variable to specify the LoopBack data sources and the connection information required by the selected LoopBack connector.

    For example:

        COMPOSER_DATASOURCES='{
          "db": {
            "name": "db",
            "connector": "mongodb",
            "host": "mongo"
          }
        }'

7. `COMPOSER_TLS`

    You can use the `COMPOSER_TLS` environment variable to specify if the REST server should enable HTTPS and TLS. Valid values are `true` and `false`.

    For example:

        COMPOSER_TLS=true

    For more information, see [Securing the REST server using HTTPS and TLS](../integrating/securing-the-rest-server.html).

8. `COMPOSER_TLS_CERTIFICATE`

    You can use the `COMPOSER_TLS_CERTIFICATE` environment variable to specify the certificate file that the REST server should use when HTTPS and TLS are enabled.

    For example:

        COMPOSER_TLS_CERTIFICATE=/tmp/cert.pem

9. `COMPOSER_TLS_KEY`

    You can use the `COMPOSER_TLS_KEY` environment variable to specify the private key file that the REST server should use when HTTPS and TLS are enabled.

    For example:

        COMPOSER_TLS_KEY=/tmp/key.pem