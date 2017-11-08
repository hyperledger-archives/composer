---
layout: default
title: Publishing events from the REST server
category: start
section: integrating
index-order: 702
sidebar: sidebars/accordion-toc0.md
excerpt: The REST server can be [**configured to subscribe to business events**](./publishing-events.html) that are emitted from a deployed business network, and publish those business events out to client applications.
---

# Publishing events from the REST server

---

The REST server can be configured to subscribe to business events that are emitted from a deployed business network, and publish those business events out to client applications. Currently, the REST server supports publishing business events out to client applications over WebSockets. Client applications can use a WebSocket client to subscribe to the business events that are published by the REST server. There are WebSocket clients available for all major programming languages and application types - for example, client side web user interfaces, backend server processes, mobile applications, and integration tools.

## Enabling WebSockets

You can enable WebSockets using the `-w` argument to the command line:

    composer-rest-server -c alice1@my-network -w

Alternatively, you can enable WebSockets by using the `COMPOSER_WEBSOCKETS` environment variable:

    export COMPOSER_WEBSOCKETS=true
    composer-rest-server -c alice1@my-network

When you have successfully enabled WebSockets, you will be able to connect a WebSocket client to the base URL displayed in the output of the REST server:

    Web server listening at: http://localhost:3000
    Browse your REST API at http://localhost:3000/explorer

In this example, the base URL to use is `http://localhost:3000`. You must convert this into a WebSocket URL by changing the protocol from `http` to `ws`. In this example, the WebSocket URL to use is `ws://localhost:3000`.

## Testing that WebSockets has been enabled

You can test that WebSockets has been enabled by using a WebSocket client to subscribe to events. The open source command line application `wscat` can be used for this purpose.

To install `wscat`, you can use `npm`. You may need to run this command with sudo, or as root, if you do not have the correct permissions to globally install `npm` modules:

    npm install -g wscat

You can then use `wscat` to connect to and subscribe to business events published by the REST server. Any business events received will be printed to the console:

    $ wscat -c ws://localhost:3000
    connected (press CTRL+C to quit)
    < {"$class":"org.acme.sample.SampleEvent","asset":"resource:org.acme.sample.SampleAsset#assetId:1","oldValue":"","newValue":"hello world","eventId":"a80d220b-09db-4812-b04b-d5d03b663671#0","timestamp":"2017-08-23T12:47:17.685Z"}
    >
