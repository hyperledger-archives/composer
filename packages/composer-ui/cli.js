#!/usr/bin/env node
/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

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
const isDocker = require('is-docker');
const Logger = require('composer-common').Logger;
const opener = require('opener');
const path = require('path');
const util = require('util');

if (process.env.COMPOSER_CONFIG) {
  const config = JSON.parse(process.env.COMPOSER_CONFIG);
  app.get('/config.json', (req, res, next) => {
    res.json(config);
  });
}

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

if (!isDocker()) {
    opener(`http://localhost:${argv.port}`);
}
