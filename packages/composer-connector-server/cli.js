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

process.env.SUPPRESS_NO_CONFIG_WARNING = true;

const argv = require('yargs')
    .option('p', {
        alias : 'port',
        demand : false,
        default : process.env.PORT || 15699,
        type : 'number',
        describe : 'The port to start the connector server on'
    })
    .argv;

const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const NetworkCardStoreManager = require('composer-common').NetworkCardStoreManager;
const ConnectorServer = require('.');

const io = require('socket.io')(argv.port);

// setup the logger for CLIs, Console output only with 'composer[info]:*' setting
const Logger = require('composer-common').Logger;
Logger.setCLIDefaults();
const LOG = Logger.getLog('ConnectorServer');

const method = 'main';
const cardStore = NetworkCardStoreManager.getCardStore();

const connectionProfileManager = new ConnectionProfileManager();

LOG.info('main', `Connector server started on port ${argv.port}`);
io.on('connect', (socket) => {
    LOG.info(method, `Client with ID '${socket.id}' on host '${socket.request.connection.remoteAddress}' connected`);
    new ConnectorServer(cardStore, connectionProfileManager, socket);
});
io.on('disconnect', (socket) => {
    LOG.info(method, `Client with ID '${socket.id}' on host '${socket.request.connection.remoteAddress}' disconnected`);
});
