#!/usr/bin/env node
/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

process.env.SUPPRESS_NO_CONFIG_WARNING = true;

const argv = require('yargs')
    .option('p', {
        alias: 'port',
        demand: false,
        default: 8080,
        type: 'number',
        describe: 'The port to start composer on'
    })
    .argv;

const express = require('express');
const app = express();
const server = require('http').Server(app);
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const ConnectorServer = require('composer-connector-server');
const fs = require('fs');
const FSConnectionProfileStore = require('composer-common').FSConnectionProfileStore;
const io = require('socket.io')(server);
const Logger = require('composer-common').Logger;
const opener = require('opener');
const path = require('path');
const util = require('util');

app.use(express.static(path.resolve(__dirname, 'dist')));
server.listen(argv.port);

Logger.setFunctionalLogger({
    log: (level, method, msg, args) => {
        args = args || [];
        let formattedArguments = args.map((arg) => {
            if (arg === Object(arg)) {
                // It's an object, array, or function, so serialize it as JSON.
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return arg;
                }
            } else {
                return arg;
            }
        }).join(', ');
        switch (level) {
        case 'debug':
            return console.log(util.format('%s %s %s', method, msg, formattedArguments));
        case 'warn':
            return console.warn(util.format('%s %s %s', method, msg, formattedArguments));
        case 'info':
            return console.info(util.format('%s %s %s', method, msg, formattedArguments));
        case 'verbose':
            return console.log(util.format('%s %s %s', method, msg, formattedArguments));
        case 'error':
            return console.error(util.format('%s %s %s', method, msg, formattedArguments));
        }
    }
});

const LOG = Logger.getLog('Composer');

const method = 'main';

const connectionProfileStore = new FSConnectionProfileStore(fs);
const connectionProfileManager = new ConnectionProfileManager(connectionProfileStore);

LOG.info('main', `Composer started on port ${argv.port}`);
io.on('connect', (socket) => {
    LOG.info(method, `Client with ID '${socket.id}' on host '${socket.request.connection.remoteAddress}' connected`);
    new ConnectorServer(connectionProfileStore, connectionProfileManager, socket);
});
io.on('disconnect', (socket) => {
    LOG.info(method, `Client with ID '${socket.id}' on host '${socket.request.connection.remoteAddress}' disconnected`);
});

opener(`http://localhost:${argv.port}`);
