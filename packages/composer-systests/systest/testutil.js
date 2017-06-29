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

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const homedir = require('homedir');
const mkdirp = require('mkdirp');
const net = require('net');
const path = require('path');
const sleep = require('sleep-promise');
const Util = require('composer-common').Util;

let adminConnection;
let client;

/**
 * Trick browserify by making the ID parameter to require dynamic.
 * @param {string} id The module ID.
 * @return {*} The module.
 */
function dynamicRequire(id) {
    return require(id);
}

/**
 * A class containing test utilities for use in BusinessNetworkConnection system tests.
 *
 * @private
 */
class TestUtil {


    /**
     * Check to see if running under a web browser.
     * @return {boolean} True if running under Karma, false if not.
     */
    static isWeb() {
        return global.window && global.window.__karma__;
    }

    /**
     * Check to see if running in embedded mode.
     * @return {boolean} True if running in embedded mode, false if not.
     */
    static isEmbedded() {
        return process.env.npm_lifecycle_event === 'systest:embedded';
    }

    /**
     * Check to see if running in proxy mode.
     * @return {boolean} True if running in proxy mode, false if not.
     */
    static isProxy() {
        return process.env.npm_lifecycle_event === 'systest:proxy';
    }

    /**
     * Check to see if running in Hyperledger Fabric mode.
     * @return {boolean} True if running in Hyperledger Fabric mode, false if not.
     */
    static isHyperledgerFabric() {
        return process.env.SYSTEST && process.env.SYSTEST.match('^hlf.*');
    }

    /**
     * Check to see if running in Hyperledger Fabric mode.
     * @return {boolean} True if running in Hyperledger Fabric mode, false if not.
     */
    static isHyperledgerFabricV06() {
        return process.env.SYSTEST && process.env.SYSTEST.match('^hlf$');
    }

    /**
     * Check to see if running in Hyperledger Fabric mode.
     * @return {boolean} True if running in Hyperledger Fabric mode, false if not.
     */
    static isHyperledgerFabricV1() {
        return process.env.SYSTEST && process.env.SYSTEST.match('^hlfv1.*');
    }

    /**
     * Wait for the specified hostname to start listening on the specified port.
     * @param {string} hostname - the hostname.
     * @param {integer} port - the port.
     * @return {Promise} - a promise that will be resolved when the specified
     * hostname to start listening on the specified port.
     */
    static waitForPort(hostname, port) {
        let waitTime = 30;
        if (process.env.COMPOSER_PORT_WAIT_SECS) {
            waitTime = parseInt(process.env.COMPOSER_PORT_WAIT_SECS);
            console.log('COMPOSER_PORT_WAIT_SECS set, using: ', waitTime);
        }
        return new Promise(function (resolve, reject) {
            let testConnect = function (count) {
                let s = new net.Socket();
                s.on('error', function (error) {
                    if (count > waitTime) {
                        console.error('Port has not started, giving up waiting');
                        return reject(error);
                    } else {
                        console.log('Port has not started, waiting 1 second ...');
                        setTimeout(function () {
                            testConnect(count + 1);
                        }, 1000);
                    }
                });
                s.on('connect', function () {
                    console.log('Port has started');
                    s.end();
                    return resolve();
                });
                console.log('Testing if port ' + port + ' on host ' + hostname + ' has started ...');
                s.connect(port, hostname);
            };
            testConnect(0);
        });
    }

    /**
     * Wait for the peer on the specified hostname and port to start listening
     * on the specified port.
     * @return {Promise} - a promise that will be resolved when the peer has
     * started listening on the specified port.
     */
    static waitForPorts() {
        if (!TestUtil.isHyperledgerFabric()) {
            return Promise.resolve();
        }
        // startsWith not available in browser test environment
        if (process.env.SYSTEST.match('^hlfv1')) {
            return Promise.resolve();
        }
        return TestUtil.waitForPort('localhost', 7050)
            .then(() => {
                return TestUtil.waitForPort('localhost', 7051);
            })
            .then(() => {
                return TestUtil.waitForPort('localhost', 7052);
            })
            .then(() => {
                return TestUtil.waitForPort('localhost', 7053);
            })
            .then(() => {
                return TestUtil.waitForPort('localhost', 7054);
            })
            .then(() => {
                return sleep(5000);
            });
    }

    /**
     * Create a new BusinessNetworkConnection object, connect, and deploy the chain-code.
     * @return {Promise} - a promise that wil be resolved with a configured and
     * connected instance of BusinessNetworkConnection.
     */
    static setUp() {
        return TestUtil.waitForPorts()
            .then(function () {
                adminConnection = new AdminConnection();
                let adminOptions;
                if (TestUtil.isWeb()) {
                    const BrowserFS = require('browserfs');
                    BrowserFS.initialize(new BrowserFS.FileSystem.LocalStorage());
                    ConnectionProfileManager.registerConnectionManager('web', require('composer-connector-web'));
                    adminOptions = {
                        type: 'web'
                    };
                } else if (TestUtil.isEmbedded()) {
                    adminOptions = {
                        type: 'embedded'
                    };
                } else if (TestUtil.isProxy()) {
                    // A whole bunch of dynamic requires to trick browserify.
                    const ConnectorServer = dynamicRequire('composer-connector-server');
                    const EmbeddedConnectionManager = dynamicRequire('composer-connector-embedded');
                    const FSConnectionProfileStore = dynamicRequire('composer-common').FSConnectionProfileStore;
                    const fs = dynamicRequire('fs');
                    const ProxyConnectionManager = dynamicRequire('composer-connector-proxy');
                    const socketIO = dynamicRequire('socket.io');
                    // We are using the embedded connector, but we configure it to route through the
                    // proxy connector and connector server.
                    adminOptions = {
                        type: 'embedded'
                    };
                    const connectionProfileStore = new FSConnectionProfileStore(fs);
                    ConnectionProfileManager.registerConnectionManager('embedded', ProxyConnectionManager);
                    const connectionProfileManager = new ConnectionProfileManager(connectionProfileStore);
                    // Since we're a single process, we have to force the embedded connection manager into
                    // the connection profile manager that the connector server is using.
                    const connectionManager = new EmbeddedConnectionManager(connectionProfileManager);
                    connectionProfileManager.getConnectionManager = () => {
                        return connectionManager;
                    };
                    const io = socketIO(15699);
                    io.on('connect', (socket) => {
                        console.log(`Client with ID '${socket.id}' on host '${socket.request.connection.remoteAddress}' connected`);
                        new ConnectorServer(connectionProfileStore, connectionProfileManager, socket);
                    });
                    io.on('disconnect', (socket) => {
                        console.log(`Client with ID '${socket.id}' on host '${socket.request.connection.remoteAddress}' disconnected`);
                    });
                } else if (TestUtil.isHyperledgerFabric()) {
                    // hlf need to decide if v1 or 0.6
                    let keyValStore = path.resolve(homedir(), '.composer-credentials', 'composer-systests');
                    mkdirp.sync(keyValStore);
                    if (TestUtil.isHyperledgerFabricV1()) {
                        if (process.env.SYSTEST.match('tls$')) {
                            console.log('setting up TLS Connection Profile for HLF V1');
                            adminOptions = {
                                type: 'hlfv1',
                                orderers: [
                                    {
                                        url: 'grpcs://localhost:7050',
                                        hostnameOverride: 'orderer.example.com',
                                        cert: './hlfv1/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt'
                                    }
                                ],
                                ca: {
                                    url: 'https://localhost:7054',
                                    name: 'ca.org1.example.com'
                                },
                                peers: [
                                    {
                                        requestURL: 'grpcs://localhost:7051',
                                        eventURL: 'grpcs://localhost:7053',
                                        hostnameOverride: 'peer0.org1.example.com',
                                        cert: './hlfv1/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt'
                                    }
                                ],
                                keyValStore: keyValStore,
                                channel: 'composerchannel',
                                mspID: 'Org1MSP',
                                timeout: '300'
                            };
                        } else {
                            console.log('setting up Non-TLS Connection Profile for HLF V1');
                            adminOptions = {
                                type: 'hlfv1',
                                orderers: [
                                    'grpc://localhost:7050'
                                ],
                                ca: {
                                    url: 'http://localhost:7054',
                                    name: 'ca.org1.example.com'
                                },
                                peers: [
                                    {
                                        requestURL: 'grpc://localhost:7051',
                                        eventURL: 'grpc://localhost:7053'
                                    }
                                ],
                                channel: 'composerchannel',
                                mspID: 'Org1MSP',
                                timeout: '300',
                                keyValStore: keyValStore
                            };
                        }
                    } else {
                        adminOptions = {
                            type: 'hlf',
                            keyValStore: keyValStore,
                            membershipServicesURL: 'grpc://localhost:7054',
                            peerURL: 'grpc://localhost:7051',
                            eventHubURL: 'grpc://localhost:7053'
                        };
                    }
                } else {
                    throw new Error('I do not know what kind of tests you want me to run!');
                }
                if (process.env.COMPOSER_DEPLOY_WAIT_SECS) {
                    adminOptions.deployWaitTime = parseInt(process.env.COMPOSER_DEPLOY_WAIT_SECS);
                    console.log('COMPOSER_DEPLOY_WAIT_SECS set, using: ', adminOptions.deployWaitTime);
                }
                if (process.env.COMPOSER_INVOKE_WAIT_SECS) {
                    adminOptions.invokeWaitTime = parseInt(process.env.COMPOSER_INVOKE_WAIT_SECS);
                    console.log('COMPOSER_INVOKE_WAIT_SECS set, using: ', adminOptions.invokeWaitTime);
                }
                if (process.env.COMPOSER_TIMEOUT_SECS) {
                    adminOptions.timeout = parseInt(process.env.COMPOSER_TIMEOUT_SECS);
                    console.log('COMPOSER_TIMEOUT_SECS set, using: ', adminOptions.timeout);
                }

                console.log('Calling AdminConnection.createProfile() ...');
                return adminConnection.createProfile('composer-systests', adminOptions);
            })
            .then(function () {
                console.log('Called AdminConnection.createProfile()');
                if (TestUtil.isHyperledgerFabricV1()) {
                    let fs = dynamicRequire('fs');
                    let org = 'org1';
                    let keyPath = path.join(__dirname, '../hlfv1/crypto-config/peerOrganizations/' + org + '.example.com/users/Admin@' + org + '.example.com/msp/keystore/114aab0e76bf0c78308f89efc4b8c9423e31568da0c340ca187a9b17aa9a4457_sk');
                    let certPath = path.join(__dirname, '../hlfv1/crypto-config/peerOrganizations/' + org + '.example.com/users/Admin@' + org + '.example.com/msp/signcerts/Admin@org1.example.com-cert.pem');
                    let signerCert = fs.readFileSync(certPath).toString();
                    let key = fs.readFileSync(keyPath).toString();
                    console.log('Calling AdminConnection.importIdentity() ...');
                    return adminConnection.importIdentity('composer-systests', 'Org1PeerAdmin', signerCert, key);
                }
            })
            .then(function () {
                console.log('Called AdminConnection.importIdentity() ...');
                console.log('Calling AdminConnection.connect() ...');
                let user = TestUtil.isHyperledgerFabricV1() ? 'Org1PeerAdmin' : 'admin';
                let password = TestUtil.isHyperledgerFabricV1() ? 'NOTNEEDED' : 'Xurw3yU9zI0l';
                return adminConnection.connect('composer-systests', user, password);
            })
            .then(function () {
                console.log('Called AdminConnection.connect()');
                console.log('');
            });
    }

    /**
     * Disconnect the BusinessNetworkConnection object.
     * @return {Promise} - a promise that wil be resolved with a configured and
     * connected instance of BusinessNetworkConnection.
     */
    static tearDown() {
        if (!adminConnection) {
            throw new Error('Must call setUp successfully before calling tearDown');
        }
        console.log('Calling adminConnection.disconnect() ...');
        return adminConnection.disconnect()
            .then(function () {
                console.log('Called adminConnection.disconnect()');
            });
    }

    /**
     * Get a configured and connected instance of AdminConnection.
     * @return {AdminConnection} - a configured and connected instance of AdminConnection.
     */
    static getAdmin() {
        if (!adminConnection) {
            throw new Error('Must call setUp successfully before calling getAdmin');
        }
        return adminConnection;
    }

    /**
     * Get a configured and connected instance of BusinessNetworkConnection.
     * @param {string} network - the identifier of the network to connect to.
     * @param {string} [enrollmentID] - the optional enrollment ID to use.
     * @param {string} [enrollmentSecret] - the optional enrollment secret to use.
     * @return {Promise} - a promise that will be resolved with a configured and
     * connected instance of {@link BusinessNetworkConnection}.
     */
    static getClient(network, enrollmentID, enrollmentSecret) {
        let thisClient;
        return Promise.resolve()
        .then(() => {
            if (enrollmentID) {
                thisClient = new BusinessNetworkConnection();
                process.on('exit', () => {
                    thisClient.disconnect();
                });
            } else if (client) {
                thisClient = client;
                return client.disconnect();
            } else {
                thisClient = client = new BusinessNetworkConnection();
                return;
            }
        })
        .then(() => {
            enrollmentID = enrollmentID || 'admin';
            let password = TestUtil.isHyperledgerFabric() && process.env.SYSTEST.match('^hlfv1') ? 'adminpw' : 'Xurw3yU9zI0l';
            enrollmentSecret = enrollmentSecret || password;
            console.log(`Calling Client.connect('composer-systest', '${network}', '${enrollmentID}', '${enrollmentSecret}') ...`);
            return thisClient.connect('composer-systests', network, enrollmentID, enrollmentSecret);
        })
        .then(() => {
            return thisClient;
        });
    }

    /**
     * Reset the business network to its initial state.
     * @return {Promise} - a promise that will be resolved when complete.
     */
    static resetBusinessNetwork() {
        if (!client) {
            return Promise.resolve();
        }
        // TODO: hack hack hack, this should be in the admin API.
        let securityContext = client.securityContext;
        if (!securityContext) {
            return Promise.resolve();
        }
        return Util.invokeChainCode(client.securityContext, 'resetBusinessNetwork', []);
    }

}

module.exports = TestUtil;
