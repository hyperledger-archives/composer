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
     * Check to see if running in Hyperledger Fabric mode.
     * @return {boolean} True if running in Hyperledger Fabric mode, false if not.
     */
    static isHyperledgerFabric() {
        return !TestUtil.isWeb() && !TestUtil.isEmbedded();
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
        if (process.env.CONCERTO_PORT_WAIT_SECS) {
            waitTime = parseInt(process.env.CONCERTO_PORT_WAIT_SECS);
            console.log('CONCERTO_PORT_WAIT_SECS set, using: ', waitTime);
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
        if (process.env.SYSTEST.startsWith('hlfv1')) {
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
                } else {
                    // hlf need to decide if v1 or 0.6
                    let keyValStore = path.resolve(homedir(), '.concerto-credentials', 'concerto-systests');
                    mkdirp.sync(keyValStore);

                    if (process.env.SYSTEST.startsWith('hlfv1')) {
                        adminOptions = {
                            type: 'hlfv1',
                            orderers: [
                                'grpc://localhost:7050'
                            ],
                            ca: 'http://localhost:7054',
                            peers: [
                                'grpc://localhost:7051',
                                'grpc://localhost:7056'
                            ],
                            events: [
                                'grpc://localhost:7053',
                                'grpc://localhost:7058'
                            ],
                            channel: 'mychannel',
                            mspid: 'Org1MSP',
                            deployWaitTime: '300',
                            invokeWaitTime: '100',
                            keyValStore: keyValStore
                        };
                    } else {
                        adminOptions = {
                            type: 'hlf',
                            keyValStore: keyValStore,
                            membershipServicesURL: 'grpc://localhost:7054',
                            peerURL: 'grpc://localhost:7051',
                            eventHubURL: 'grpc://localhost:7053'
                        };
                    }
                }
                if (process.env.CONCERTO_DEPLOY_WAIT_SECS) {
                    adminOptions.deployWaitTime = parseInt(process.env.CONCERTO_DEPLOY_WAIT_SECS);
                    console.log('CONCERTO_DEPLOY_WAIT_SECS set, using: ', adminOptions.deployWaitTime);
                }
                if (process.env.CONCERTO_INVOKE_WAIT_SECS) {
                    adminOptions.invokeWaitTime = parseInt(process.env.CONCERTO_INVOKE_WAIT_SECS);
                    console.log('CONCERTO_INVOKE_WAIT_SECS set, using: ', adminOptions.invokeWaitTime);
                }
                console.log('Calling AdminConnection.createProfile() ...');
                return adminConnection.createProfile('concerto-systests', adminOptions);
            })
            .then(function () {
                console.log('Called AdminConnection.createProfile()');
                console.log('Calling AdminConnection.connect() ...');
                let password = process.env.SYSTEST.startsWith('hlfv1') ? 'adminpw' : 'Xurw3yU9zI0l';
                return adminConnection.connect('concerto-systests', 'admin', password);
            })
            .then(function () {
                console.log('Called AdminConnection.connect()');
                console.log('');
                return Promise.resolve();
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
        console.log('Calling BusinessNetworkConnection.disconnect() ...');
        return adminConnection.disconnect()
            .then(function () {
                console.log('Called BusinessNetworkConnection.disconnect()');
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
            let password = process.env.SYSTEST.startsWith('hlfv1') ? 'adminpw' : 'Xurw3yU9zI0l';
            enrollmentSecret = enrollmentSecret || password;
            console.log(`Calling Client.connect('concerto-systest', '${network}', '${enrollmentID}', '${enrollmentSecret}') ...`);
            return thisClient.connect('concerto-systests', network, enrollmentID, enrollmentSecret);
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
