---
layout: default
title: Enabling authentication for the REST server
category: start
section: integrating
index-order: 703
sidebar: sidebars/accordion-toc0.md
excerpt: The REST server can be [**configured to authenticate clients**](./enabling-rest-authentication.html). When this option is enabled, clients must authenticate to the REST server before they are permitted to call the REST API.
---

# Enabling authentication for the REST server

---

The REST server can be configured to authenticate clients. When this option is enabled, clients must authenticate to the REST server before they are permitted to call the REST API.

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

Once the environment variable `COMPOSER_PROVIDERS` has been set, you can use the `-a true` argument to start the REST server with authentication enabled. Once authentication is enabled, clients will have to authenticate before they can make any requests to the business network.

For example, here is the command for the business network that is deployed as part of the Developer Tutorial, however you may need to modify the command for your business network:

    composer-rest-server -c admin@my-network -a true

Now, navigate to the REST API explorer at [http://localhost:3000/explorer/](http://localhost:3000/explorer/). If authentication has been successfully enabled, any attempts to call one of the business network REST API operations using the REST API explorer should be rejected with an `HTTP 401 Authorization Required` message.

## Authenticating to the REST server using a web browser

This step is dependent on the configuration and behaviour of the Passport strategies being used by the REST server.

1. Authenticate to the REST server by navigating to the value of the `authPath` property specified in the environment variable `COMPOSER_PROVIDERS`. In the example above, this is [http://localhost:3000/auth/github](http://localhost:3000/auth/github).
2. The REST server will redirect you to GitHub to perform the OAuth web server authentication flow. GitHub will ask you if you want to authorize the Composer application to access your account. Click the **Authorize** button.
3. If successful, GitHub will redirect you back to the REST server.

Now, navigate to the REST API explorer at http://localhost:3000/explorer/. Attempt to call one of the business network REST API operations again using the REST API explorer. This time, the calls should succeed.

## Authenticating to the REST server using an HTTP or REST client

When a user authenticates to the REST server, a unique access token is generated and assigned to the authenticated user. When the user authenticates using a web browser, the access token is stored in a cookie in the local storage of the users web browser. When the authenticated user makes a subsequent request, the access token is retrieved from the cookie, and the access token is validated instead of reauthenticating the user.

The access token can be used to authenticate any HTTP or REST client that wishes to call the REST server. This is required when the HTTP or REST client cannot perform the authentication flow required by the configured Passport strategy. For example, all OAuth2 web authentication flows require the use of a web browser to navigate to the authentication providers website.

In order to use the access token, the access token must first be retrieved using a web browser. When you authenticate to the REST server, the REST API explorer at http://localhost:3000/explorer/ will show the access token at the top of the page. By default the access token is hidden, but it can be displayed by clicking the `Show` button. The access token is a long alphanumeric string, for example: `e9M3CLDEEj8SDq0Bx1tkYAZucOTWbgdiWQGLnOxCe7K9GhTruqlet1h5jsw10YjJ`

Once the access token has been retrieved, the access token can be passed into any HTTP or REST request to authenticate the HTTP or REST client. There are two options for passing the access token - using either a query string parameter, or an HTTP header. For both of the following examples, replace the string `xxxxx` with the value of the access token.

Query string - add the `access_token` query string parameter to all HTTP or REST requests:

    curl -v http://localhost:3000/api/system/ping?access_token=xxxxx

HTTP header - add the `X-Access-Token` header to all HTTP or REST requests:

    curl -v -H 'X-Access-Token: xxxxx' http://localhost:3000/api/system/ping
=======
