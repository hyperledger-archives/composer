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

const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const ConnectorServer = require('composer-connector-server');
const fs = require('fs');
const FSConnectionProfileStore = require('composer-common').FSConnectionProfileStore;
const http = require('http');
const socketIO = require('socket.io');
const Logger = require('composer-common').Logger;
const Util = require('./lib/util');
const npmRoute = require('./routes/npm');

const LOG = Logger.getLog('PlaygroundAPI');

/**
 * Create an Express.js application that hosts both the REST API for Composer Playground
 * and the Connector Server for supporting the proxy connector.
 * @param {number} port The port for the Express.js application.
 * @return {Object} The Express.js application.
 */
function createServer (port) {
    const method = 'createServer';
    LOG.entry(method, port);

    const app = Util.createApp();

    npmRoute(app);

    const connectionProfileStore = new FSConnectionProfileStore(fs);
    const connectionProfileManager = new ConnectionProfileManager(connectionProfileStore);

    // Create the Express server.
    const server = http.createServer(app);

    // Set up the connector server.
    const io = socketIO(server);
    io.on('connect', (socket) => {
        LOG.info(method, `Client with ID '${socket.id}' on host '${socket.request.connection.remoteAddress}' connected`);
        new ConnectorServer(connectionProfileStore, connectionProfileManager, socket);
    });
    io.on('disconnect', (socket) => {
        LOG.info(method, `Client with ID '${socket.id}' on host '${socket.request.connection.remoteAddress}' disconnected`);
    });

    server.listen(port);
    LOG.info(method, `Playground API started on port ${port}`);

    LOG.exit(method, app);
    return app;
}

module.exports = createServer;
