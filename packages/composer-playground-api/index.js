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
const http = require('http');
const Logger = require('composer-common').Logger;
const NetworkCardStoreManager = require('composer-common').NetworkCardStoreManager;
const npmRoute = require('./routes/npm');
const socketIO = require('socket.io');
const Util = require('./lib/util');

const LOG = Logger.getLog('PlaygroundAPI');
/**
 * Create an Express.js application that hosts both the REST API for Composer Playground
 * and the Connector Server for supporting the proxy connector.
 * @param {number} port The port for the Express.js application.
 * @param {testMode} testMode Is the api started in test mode
 * @return {Object} The Express.js application.
 */
async function createServer (port, testMode) {
    const method = 'createServer';
    LOG.entry(method, port, testMode);

    const app = Util.createApp();

    npmRoute(app, testMode);

    const businessNetworkCardStore = NetworkCardStoreManager.getCardStore();
    const connectionProfileManager = new ConnectionProfileManager();

    // Create the Express server.
    const server = http.createServer(app);

    // Set up the connector server.
    const io = socketIO(server);
    io.on('connect', (socket) => {
        LOG.info(method, `Client with ID '${socket.id}' on host '${socket.request.connection.remoteAddress}' connected`);
        socket.on('disconnect', (reason) => {
            LOG.info(method, `Client with ID '${socket.id}' on host '${socket.request.connection.remoteAddress}' disconnected (${reason})`);
        });
        new ConnectorServer(businessNetworkCardStore, connectionProfileManager, socket);
    });

    port = await new Promise((resolve, reject) => {
        server.listen(port, (error) => {
            if (error) {
                return reject(error);
            }
            resolve(server.address().port);
        });
    });

    // Save the port back into the app. If the port was 0, it will now have
    // been set to a dynamically assigned port.
    app.set('port', port);
    LOG.info(method, `Playground API started on port ${port}`);
    if(testMode) {
        LOG.info(method, 'Playground API started in test mode');
    }

    LOG.exit(method, app);
    return app;
}

module.exports = createServer;
