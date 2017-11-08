---
layout: default
title: Securing the REST server using HTTPS and TLS
category: start
section: integrating
index-order: 705
sidebar: sidebars/accordion-toc0.md
excerpt: When deploying Hyperledger Composer REST server in a production environment, the REST server should be [**configured to be secured with HTTPS and TLS**](./securing-the-rest-server.html) (Transport Layer Security). Once the REST server has been configured with HTTPS and TLS, all data transferred between the REST server and all of the REST clients is encrypted.
---

# Securing the REST server using HTTPS and TLS

---

When deploying {{site.data.conrefs.composer_full}} REST server in a production environment, the REST server should be configured to be secured with HTTPS and TLS (Transport Layer Security). Once the REST server has been configured with HTTPS and TLS, all data transferred between the REST server and all of the REST clients is encrypted.

You must provide both a certificate and a private key pair to configure the REST server. The REST server includes a sample certificate and private key pair that can be used to easily get going, but this configuration is only recommended for ease of use during initial development. Do not use the sample certificate and private key pair in a production environment.

## Enabling HTTPS and TLS by using the sample certificate and private key pair

You can enable HTTPS and TLS using the sample certificate and private key pair by using the `-t` argument to the command line:

    composer-rest-server -c alice1@my-network -t

Alternatively, you can enable HTTPS and TLS using the sample certificate and private key pair by using the `COMPOSER_TLS` environment variable:

    export COMPOSER_TLS=true
    composer-rest-server -c alice1@my-network

When you have successfully enabled HTTPS and TLS, you will see that the output of the REST server specifies an `https://` URL instead of a `http://` URL:

    Web server listening at: https://localhost:3000
    Browse your REST API at https://localhost:3000/explorer

This configuration is only recommended for ease of use during initial development. For a test, QA, or production deployment, you should provide your own certificate and private key to enable HTTPS and TLS.

## Enabling HTTPS and TLS by providing a certificate and private key pair

You can enable HTTPS and TLS by providing your own certificate and private key pair. The certificate and private key pair must be provided as two separate files in the PEM format. The files must be available on the file system of the system running the REST server, and the REST server must have read access to those files.

You can configure the THE REST server to use your certificate and private key pair files by using the '-e' (certificate file) and '-k' (private key file) arguments to the command line:

    composer-rest-server -c alice1@my-network -t -e /tmp/cert.pem -k /tmp/key.pem

Alternatively, you can configure the THE REST server to use your certificate and private key pair files by using the `COMPOSER_TLS_CERTIFICATE` and `COMPOSER_TLS_KEY` environment variables:

    export COMPOSER_TLS=true
    export COMPOSER_TLS_CERTIFICATE=/tmp/cert.pem
    export COMPOSER_TLS_KEY=/tmp/key.pem
    composer-rest-server -c alice1@my-network
