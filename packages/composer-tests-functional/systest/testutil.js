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
const { ConnectionProfileManager, IdCard, NetworkCardStoreManager } = require('composer-common');
const commonPackageJson = require('composer-common/package.json');
const composerVersion = commonPackageJson.version;
const net = require('net');
const path = require('path');
const sleep = require('sleep-promise');

let client;
let currentCp;
let connectionProfileOrg1, connectionProfileOrg2, otherConnectionProfileOrg1, otherConnectionProfileOrg2;
let docker;
let forceDeploy = false;
let testRetries = 0;

let io;

// hold on to the card store instance that was created in setup for use in deploy
let cardStoreForDeploy;
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

    /** Simple log method to output to the console
     * Used to put a single console.log() here, so eslinting is easier.
     * And if this needs to written to a file at some point it is also eaiser
     */
    static log(){
        Array.from(arguments).forEach((s)=>{
            // eslint-disable-next-line no-console
            console.log(s);
        });
    }

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
        return process.env.npm_lifecycle_event === 'systest:embedded' || process.env.FVTEST === 'embedded';
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
        return process.env.FVTEST && process.env.FVTEST.match('^hlf.*');
    }

    /**
     * Check to see if running in Hyperledger Fabric mode.
     * @return {boolean} True if running in Hyperledger Fabric mode, false if not.
     */
    static isHyperledgerFabricV1() {
        return process.env.FVTEST && process.env.FVTEST.match('^hlfv1.*');
    }

    /**
     * Get an instance of the Docker API for interacting with Docker.
     * @return {Docker} An instance of the Docker API for interacting with Docker.
     */
    static getDocker() {
        const Docker = require('dockerode');
        if (!docker) {
            docker = new Docker();
        }
        return docker;
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
            TestUtil.log('COMPOSER_PORT_WAIT_SECS set, using: ', waitTime);
        }
        return new Promise(function (resolve, reject) {
            let testConnect = function (count) {
                let s = new net.Socket();
                s.on('error', function (error) {
                    if (count > waitTime) {
                        TestUtil.error('Port has not started, giving up waiting');
                        return reject(error);
                    } else {
                        TestUtil.log('Port has not started, waiting 1 second ...');
                        setTimeout(function () {
                            testConnect(count + 1);
                        }, 1000);
                    }
                });
                s.on('connect', function () {
                    TestUtil.log('Port has started');
                    s.end();
                    return resolve();
                });
                TestUtil.log('Testing if port ' + port + ' on host ' + hostname + ' has started ...');
                s.connect(port, hostname);
            };
            testConnect(0);
        });
    }

    /**
     * Wait for the peer on the specified hostnabusinessNetworkDefinitionme and port to start listening
     * on the specified port.
     * @return {Promise} - a promise that will be resolved when the peer has
     * started listening on the specified port.
     */
    static waitForPorts() {
        if (!TestUtil.isHyperledgerFabric()) {
            return Promise.resolve();
        }
        // startsWith not available in browser test environment
        if (process.env.FVTEST.match('^hlfv1')) {
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
    static setUp () {

        let adminConnection;
        forceDeploy = false;
        return TestUtil.waitForPorts()
            .then(() => {

                // Create all necessary configuration for the web runtime.
                if (TestUtil.isWeb()) {

                    ConnectionProfileManager.registerConnectionManager('web', require('composer-connector-web'));
                    const walletmodule = require('composer-wallet-inmemory');
                    let cardStore = NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory',walletmodule } );
                    adminConnection = new AdminConnection({cardStore});
                    cardStoreForDeploy = cardStore;
                } else if (TestUtil.isEmbedded()) {
                    let cardStore = NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory' } );
                    adminConnection = new AdminConnection({cardStore});
                    cardStoreForDeploy = cardStore;
                } else if (TestUtil.isProxy()) {
                    let cardStore = NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory' } );
                    adminConnection = new AdminConnection({cardStore});
                    cardStoreForDeploy = cardStore;


                    // A whole bunch of dynamic requires to trick browserify.
                    const ConnectorServer = dynamicRequire('composer-connector-server');
                    const EmbeddedConnectionManager = dynamicRequire('composer-connector-embedded');

                    const ProxyConnectionManager = dynamicRequire('composer-connector-proxy');
                    const socketIO = dynamicRequire('socket.io');

                    // We are using the embedded connector, but we configure it to route through the
                    // proxy connector and connector server.
                    ConnectionProfileManager.registerConnectionManager('embedded', ProxyConnectionManager);
                    const connectionProfileManager = new ConnectionProfileManager();

                    // Since we're a single process, we have to force the embedded connection manager into
                    // the connection profile manager that the connector server is using.
                    const connectionManager = new EmbeddedConnectionManager(connectionProfileManager);
                    connectionProfileManager.getConnectionManagerByType = () => {
                        return Promise.resolve(connectionManager);
                    };
                    io = socketIO(15699);
                    io.on('connect', (socket) => {
                        TestUtil.log(`Client with ID '${socket.id}' on host '${socket.request.connection.remoteAddress}' connected`);
                        new ConnectorServer(cardStore, connectionProfileManager, socket);
                        TestUtil.log('Connector Server created');
                    });
                    io.on('disconnect', (socket) => {
                        TestUtil.log(`Client with ID '${socket.id}' on host '${socket.request.connection.remoteAddress}' disconnected`);
                    });
                    TestUtil.log('Calling AdminConnection.createProfile() ...');
                    return;

                    // Create all necessary configuration for Hyperledger Fabric v1.0.
                } else if (TestUtil.isHyperledgerFabricV1()) {
                    let cardStore = NetworkCardStoreManager.getCardStore( );
                    adminConnection = new AdminConnection({cardStore});
                    cardStoreForDeploy = cardStore;

                    if (process.env.FVTEST.match('tls$')) {
                        TestUtil.log('setting up TLS Connection Profile for HLF V1');
                        // define ORG 1 CCP
                        connectionProfileOrg1 = {
                            'name': 'hlfv1org1',
                            'x-type': 'hlfv1',
                            'x-commitTimeout': 300,
                            'version': '1.0.0',
                            'client': {
                                'organization': 'Org1',
                                'connection': {
                                    'timeout': {
                                        'peer': {
                                            'endorser': '300',
                                            'eventHub': '300',
                                            'eventReg': '300'
                                        },
                                        'orderer': '300'
                                    }
                                }
                            },
                            'channels': {
                                'composerchannel': {
                                    'orderers': [
                                        'orderer.example.com'
                                    ],
                                    'peers': {
                                        'peer0.org1.example.com': {},
                                        'peer0.org2.example.com': {}
                                    }
                                }
                            },
                            'organizations': {
                                'Org1': {
                                    'mspid': 'Org1MSP',
                                    'peers': [
                                        'peer0.org1.example.com'
                                    ],
                                    'certificateAuthorities': [
                                        'ca.org1.example.com'
                                    ]
                                },
                                'Org2': {
                                    'mspid': 'Org2MSP',
                                    'peers': [
                                        'peer0.org2.example.com'
                                    ],
                                    'certificateAuthorities': [
                                        'ca.org2.example.com'
                                    ]
                                }
                            },
                            'orderers': {
                                'orderer.example.com': {
                                    'url': 'grpcs://localhost:7050',
                                    'grpcOptions': {
                                        'ssl-target-name-override': 'orderer.example.com'
                                    },
                                    'tlsCACerts': {
                                        'path': './hlfv1/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt'
                                    }
                                }
                            },
                            'peers': {
                                'peer0.org1.example.com': {
                                    'url': 'grpcs://localhost:7051',
                                    'eventUrl': 'grpcs://localhost:7053',
                                    'grpcOptions': {
                                        'ssl-target-name-override': 'peer0.org1.example.com',
                                    },
                                    'tlsCACerts': {
                                        'path': './hlfv1/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt'
                                    }
                                },
                                'peer0.org2.example.com': {
                                    'url': 'grpcs://localhost:8051',
                                    'eventUrl': 'grpcs://localhost:8053',
                                    'grpcOptions': {
                                        'ssl-target-name-override': 'peer0.org2.example.com',
                                    },
                                    'tlsCACerts': {
                                        'path': './hlfv1/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt'
                                    }
                                }
                            },
                            'certificateAuthorities': {
                                'ca.org1.example.com': {
                                    'url': 'https://localhost:7054',
                                    'httpOptions': {
                                        'verify' : false
                                    },
                                    'caName': 'ca.org1.example.com'
                                },
                                'ca.org2.example.com': {
                                    'url': 'https://localhost:8054',
                                    'httpOptions': {
                                        'verify' : false
                                    },
                                    'caName': 'ca.org2.example.com'
                                }
                            }
                        };
                        otherConnectionProfileOrg1 = {
                            'name': 'hlfv1org1',
                            'x-type': 'hlfv1',
                            'x-commitTimeout': 300,
                            'version': '1.0.0',
                            'client': {
                                'organization': 'Org1',
                                'connection': {
                                    'timeout': {
                                        'peer': {
                                            'endorser': '300',
                                            'eventHub': '300',
                                            'eventReg': '300'
                                        },
                                        'orderer': '300'
                                    }
                                }
                            },
                            'channels': {
                                'othercomposerchannel': {
                                    'orderers': [
                                        'orderer.example.com'
                                    ],
                                    'peers': {
                                        'peer0.org1.example.com': {},
                                        'peer0.org2.example.com': {}
                                    }
                                }
                            },
                            'organizations': {
                                'Org1': {
                                    'mspid': 'Org1MSP',
                                    'peers': [
                                        'peer0.org1.example.com'
                                    ],
                                    'certificateAuthorities': [
                                        'ca.org1.example.com'
                                    ]
                                },
                                'Org2': {
                                    'mspid': 'Org2MSP',
                                    'peers': [
                                        'peer0.org2.example.com'
                                    ],
                                    'certificateAuthorities': [
                                        'ca.org2.example.com'
                                    ]
                                }
                            },
                            'orderers': {
                                'orderer.example.com': {
                                    'url': 'grpcs://localhost:7050',
                                    'grpcOptions': {
                                        'ssl-target-name-override': 'orderer.example.com'
                                    },
                                    'tlsCACerts': {
                                        'path': './hlfv1/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt'
                                    }
                                }
                            },
                            'peers': {
                                'peer0.org1.example.com': {
                                    'url': 'grpcs://localhost:7051',
                                    'eventUrl': 'grpcs://localhost:7053',
                                    'grpcOptions': {
                                        'ssl-target-name-override': 'peer0.org1.example.com',
                                    },
                                    'tlsCACerts': {
                                        'path': './hlfv1/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt'
                                    }
                                },
                                'peer0.org2.example.com': {
                                    'url': 'grpcs://localhost:8051',
                                    'eventUrl': 'grpcs://localhost:8053',
                                    'grpcOptions': {
                                        'ssl-target-name-override': 'peer0.org2.example.com',
                                    },
                                    'tlsCACerts': {
                                        'path': './hlfv1/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt'
                                    }
                                }
                            },
                            'certificateAuthorities': {
                                'ca.org1.example.com': {
                                    'url': 'https://localhost:7054',
                                    'httpOptions': {
                                        'verify': false
                                    },
                                    'caName': 'ca.org1.example.com'
                                },
                                'ca.org2.example.com' : {
                                    'url': 'https://localhost:8054',
                                    'httpOptions': {
                                        'verify': false
                                    },
                                    'caName': 'ca.org2.example.com'
                                }
                            }
                        };
                        // Define Org2 CCP
                        connectionProfileOrg2 = {};
                        Object.assign(connectionProfileOrg2, connectionProfileOrg1);
                        connectionProfileOrg2.name = 'hlfv1org2';
                        connectionProfileOrg2.client = {
                            'organization': 'Org2',
                            'connection': {
                                'timeout': {
                                    'peer': {
                                        'endorser': '300',
                                        'eventHub': '300',
                                        'eventReg': '300'
                                    },
                                    'orderer': '300'
                                }
                            }
                        };
                        otherConnectionProfileOrg2 = {};
                        Object.assign(otherConnectionProfileOrg2, otherConnectionProfileOrg1);
                        otherConnectionProfileOrg2.name = 'hlfv1org2';
                        otherConnectionProfileOrg2.client = {
                            'organization': 'Org2',
                            'connection': {
                                'timeout': {
                                    'peer': {
                                        'endorser': '300',
                                        'eventHub': '300',
                                        'eventReg': '300'
                                    },
                                    'orderer': '300'
                                }
                            }
                        };

                    } else {
                        TestUtil.log('setting up Non-TLS Connection Profile for HLF V1');
                        // define ORG 1 CCP NON-TLS
                        connectionProfileOrg1 = {
                            'name': 'hlfv1org1',
                            'x-type': 'hlfv1',
                            'x-commitTimeout': 300,
                            'version': '1.0.0',
                            'client': {
                                'organization': 'Org1',
                                'connection': {
                                    'timeout': {
                                        'peer': {
                                            'endorser': '300',
                                            'eventHub': '300',
                                            'eventReg': '300'
                                        },
                                        'orderer': '300'
                                    }
                                }
                            },
                            'channels': {
                                'composerchannel': {
                                    'orderers': [
                                        'orderer.example.com'
                                    ],
                                    'peers': {
                                        'peer0.org1.example.com': {},
                                        'peer0.org2.example.com': {}
                                    }
                                }
                            },
                            'organizations': {
                                'Org1': {
                                    'mspid': 'Org1MSP',
                                    'peers': [
                                        'peer0.org1.example.com'
                                    ],
                                    'certificateAuthorities': [
                                        'ca.org1.example.com'
                                    ]
                                },
                                'Org2': {
                                    'mspid': 'Org2MSP',
                                    'peers': [
                                        'peer0.org2.example.com'
                                    ],
                                    'certificateAuthorities': [
                                        'ca.org2.example.com'
                                    ]
                                }
                            },
                            'orderers': {
                                'orderer.example.com': {
                                    'url': 'grpc://localhost:7050'
                                }
                            },
                            'peers': {
                                'peer0.org1.example.com': {
                                    'url': 'grpc://localhost:7051',
                                    'eventUrl': 'grpc://localhost:7053'
                                },
                                'peer0.org2.example.com': {
                                    'url': 'grpc://localhost:8051',
                                    'eventUrl': 'grpc://localhost:8053'
                                }
                            },
                            'certificateAuthorities': {
                                'ca.org1.example.com': {
                                    'url': 'http://localhost:7054',
                                    'caName': 'ca.org1.example.com'
                                },
                                'ca.org2.example.com': {
                                    'url': 'http://localhost:8054',
                                    'caName': 'ca.org2.example.com'
                                }
                            }
                        };
                        otherConnectionProfileOrg1 = {
                            'name': 'hlfv1org1',
                            'x-type': 'hlfv1',
                            'x-commitTimeout': 300,
                            'version': '1.0.0',
                            'client': {
                                'organization': 'Org1',
                                'connection': {
                                    'timeout': {
                                        'peer': {
                                            'endorser': '300',
                                            'eventHub': '300',
                                            'eventReg': '300'
                                        },
                                        'orderer': '300'
                                    }
                                }
                            },
                            'channels': {
                                'othercomposerchannel': {
                                    'orderers': [
                                        'orderer.example.com'
                                    ],
                                    'peers': {
                                        'peer0.org1.example.com': {},
                                        'peer0.org2.example.com': {}
                                    }
                                }
                            },
                            'organizations': {
                                'Org1': {
                                    'mspid': 'Org1MSP',
                                    'peers': [
                                        'peer0.org1.example.com'
                                    ],
                                    'certificateAuthorities': [
                                        'ca.org1.example.com'
                                    ]
                                },
                                'Org2': {
                                    'mspid': 'Org2MSP',
                                    'peers': [
                                        'peer0.org2.example.com'
                                    ],
                                    'certificateAuthorities': [
                                        'ca.org2.example.com'
                                    ]
                                }
                            },
                            'orderers': {
                                'orderer.example.com': {
                                    'url': 'grpc://localhost:7050'
                                }
                            },
                            'peers': {
                                'peer0.org1.example.com': {
                                    'url': 'grpc://localhost:7051',
                                    'eventUrl': 'grpc://localhost:7053'
                                },
                                'peer0.org2.example.com': {
                                    'url': 'grpc://localhost:8051',
                                    'eventUrl': 'grpc://localhost:8053'
                                }
                            },
                            'certificateAuthorities': {
                                'ca.org1.example.com': {
                                    'url': 'http://localhost:7054',
                                    'caName': 'ca.org1.example.com'
                                },
                                'ca.org2.example.com': {
                                    'url': 'http://localhost:8054',
                                    'caName': 'ca.org2.example.com'
                                }
                            }
                        };

                        // Define Org2 CCP
                        connectionProfileOrg2 = {};
                        Object.assign(connectionProfileOrg2, connectionProfileOrg1);
                        connectionProfileOrg2.name = 'hlfv1org2';
                        connectionProfileOrg2.client = {
                            'organization': 'Org2',
                            'connection': {
                                'timeout': {
                                    'peer': {
                                        'endorser': '300',
                                        'eventHub': '300',
                                        'eventReg': '300'
                                    },
                                    'orderer': '300'
                                }
                            }
                        };
                        otherConnectionProfileOrg2 = {};
                        Object.assign(otherConnectionProfileOrg2, otherConnectionProfileOrg1);
                        otherConnectionProfileOrg2.name = 'hlfv1org2';
                        otherConnectionProfileOrg2.client = {
                            'organization': 'Org2',
                            'connection': {
                                'timeout': {
                                    'peer': {
                                        'endorser': '300',
                                        'eventHub': '300',
                                        'eventReg': '300'
                                    },
                                    'orderer': '300'
                                }
                            }
                        };

                    }


                    currentCp = connectionProfileOrg1;

                    let fs = dynamicRequire('fs');
                    TestUtil.log('Creating peer admin cards, and import them to the card store');
                    const admins = [
                        { org: 'org1', keyFile: 'key.pem' },
                        { org: 'org2', keyFile: 'key.pem' }
                    ];
                    return admins.reduce((promise, admin) => {
                        const org = admin.org;
                        const keyFile = admin.keyFile;

                        return promise.then(() => {
                            let keyPath = path.join(__dirname, `../hlfv1/crypto-config/peerOrganizations/${org}.example.com/users/Admin@${org}.example.com/msp/keystore/${keyFile}`);
                            let certPath = path.join(__dirname, `../hlfv1/crypto-config/peerOrganizations/${org}.example.com/users/Admin@${org}.example.com/msp/signcerts/Admin@${org}.example.com-cert.pem`);
                            let signerCert = fs.readFileSync(certPath).toString();
                            let key = fs.readFileSync(keyPath).toString();

                            let metadata = {
                                version: 1,
                                userName: 'PeerAdmin',
                                roles: ['PeerAdmin', 'ChannelAdmin']
                            };
                            // form up a IDCard
                            let card, otherCard;
                            if (org === 'org1') {
                                card = new IdCard(metadata, connectionProfileOrg1);
                                otherCard = new IdCard(metadata, otherConnectionProfileOrg1);
                            }
                            else {
                                card = new IdCard(metadata, connectionProfileOrg2);
                                otherCard = new IdCard(metadata, otherConnectionProfileOrg2);
                            }
                            card.setCredentials({certificate: signerCert, privateKey: key});
                            otherCard.setCredentials({certificate: signerCert, privateKey: key});
                            return adminConnection.importCard(`composer-systests-${org}-PeerAdmin`, card)
                                .then(() => {
                                    return adminConnection.importCard(`othercomposer-systests-${org}-PeerAdmin`, otherCard);
                                })
                                .then(() => {
                                    TestUtil.log('Imported cards to the card store');
                                });

                        });
                    }, Promise.resolve());

                } else {
                    throw new Error('I do not know what kind of tests you want me to run!');
                }

            });

    }

    /**
     * Disconnect the BusinessNetworkConnection object.
     */
    static async tearDown() {
        forceDeploy = false;
        if (io) {
            await new Promise((resolve, reject) => { io.close(resolve); });
        }
    }

    /**
     * Get a configured and connected instance of BusinessNetworkConnection.
     * @param {Object} cardStore  to use to create this connection
     * @param {string} network - the identifier of the network to connect to.
     * @param {string} [enrollmentID] - the optional enrollment ID to use.
     * @param {string} [enrollmentSecret] - the optional enrollment secret to use.
     * @return {Promise} - a promise that will be resolved with a configured and
     * connected instance of {@link BusinessNetworkConnection}.
     */
    static getClient(cardStore, network, enrollmentID, enrollmentSecret) {
        network = network || 'common-network';
        let cardName = 'admincard';
        let thisClient;
        return Promise.resolve()
            .then(() => {
                if (enrollmentID) {
                    let metadata = {
                        userName : enrollmentID,
                        version : 1,
                        enrollmentSecret: enrollmentSecret,
                        businessNetwork : network
                    };
                    let ccpToUse = currentCp;
                    if (process.env.FVTEST && process.env.FVTEST.match('hsm$')) {
                        TestUtil.log(`defining a new card for ${enrollmentID} to use HSM`);
                        ccpToUse = JSON.parse(JSON.stringify(currentCp));
                        ccpToUse.client['x-hsm'] = {
                            'library': '/usr/local/lib/softhsm/libsofthsm2.so',
                            'slot': 0,
                            'pin': 98765432
                        };
                    }

                    let idCard = new IdCard(metadata, ccpToUse);
                    let adminConnection = new AdminConnection({cardStore});
                    return adminConnection.connect('admincard')
                        .then(() => {
                            return adminConnection.importCard(enrollmentID + 'card', idCard);
                        })
                        .then(() => {
                            thisClient = new BusinessNetworkConnection({cardStore});
                            process.on('exit', () => {
                                thisClient.disconnect();
                            });
                        })
                        .then(() => {
                            // return thisClient.connect(enrollmentID+'card');
                            cardName = enrollmentID + 'card';
                            return adminConnection.disconnect();
                        });

                } else if (client) {
                    thisClient = client;
                    return client.disconnect();
                } else {
                    thisClient = client = new BusinessNetworkConnection({cardStore});
                    return;
                }
            })
            .then(() => {
                if (TestUtil.isHyperledgerFabricV1() && !forceDeploy) {
                    TestUtil.log('Connecting with ' + cardName);
                    return thisClient.connect(cardName);
                } else if (TestUtil.isHyperledgerFabricV1() && forceDeploy) {
                    throw new Error('force deploy is being called and that will not work now');
                } else {
                    TestUtil.log('Connecting with ' + cardName);
                    return thisClient.connect(cardName);
                }
            })
            .then(() => {
                return thisClient;
            });
    }

    /**
     * Inject the available dependencies.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition the bnd to be deployed
     */
    static injectDependencies(businessNetworkDefinition) {
        let packageJSON = businessNetworkDefinition.getMetadata().getPackageJson();
        packageJSON.dependencies = {
            'composer-common' : `../composer-common/composer-common-${composerVersion}.tgz`,
            'composer-runtime-hlfv1' : `../composer-runtime-hlfv1/composer-runtime-hlfv1-${composerVersion}.tgz`,
            'composer-runtime' : `../composer-runtime/composer-runtime-${composerVersion}.tgz`
        };
    }

    /**
     * Deploy the specified business network definition.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition - the business network definition to deploy.
     * @param {string} cardName - the name of the card to create when deploying
     * @param {boolean} otherChannel - if the non default channel should be used to deploy to
     * @param {boolean} [forceDeploy_] - force use of the deploy API instead of install and start.
     * @param {int} retryCount, current retry number
     * @return {Promise} - a promise that will be resolved when complete.
     */
    static deploy(businessNetworkDefinition, cardName, otherChannel, forceDeploy_, retryCount) {
        // do not believe there is any code left doing forceDeploy_
        if (forceDeploy_) {
            throw new Error('this should not be deploying');
        }

        retryCount = retryCount || 0;
        cardName = cardName || 'admincard';
        let adminConnection = new AdminConnection({cardStore:cardStoreForDeploy});
        forceDeploy = forceDeploy_;

        const bootstrapTransactions = [
            {
                $class: 'org.hyperledger.composer.system.AddParticipant',
                resources: [
                    {
                        $class: 'org.hyperledger.composer.system.NetworkAdmin',
                        participantId: 'admin'
                    }
                ],
                targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin'
            },
            {
                $class: 'org.hyperledger.composer.system.IssueIdentity',
                participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                identityName: 'admin'
            }
        ];
        if (TestUtil.isHyperledgerFabricV1() && !forceDeploy) {

            TestUtil.log(`Deploying business network ${businessNetworkDefinition.getName()} using install & start ...`);
            return Promise.resolve()
                .then(() => {
                    // Connect and install the runtime onto the peers for org1.
                    TestUtil.log('Connecting to org1');
                    if(otherChannel) {
                        return adminConnection.connect('othercomposer-systests-org1-PeerAdmin');
                    } else {
                        return adminConnection.connect('composer-systests-org1-PeerAdmin');
                    }
                })
                .then(() => {
                    console.log('Installing network to org1');
                    TestUtil.injectDependencies(businessNetworkDefinition);
                    return adminConnection.install(businessNetworkDefinition);
                })
                .then(() => {
                    delete businessNetworkDefinition.getMetadata().getPackageJson().dependencies;
                    return adminConnection.disconnect();
                })
                .then(() => {
                    // Connect and install the runtime onto the peers for org2.
                    TestUtil.log('Connecting to org2');
                    if(otherChannel) {
                        return adminConnection.connect('othercomposer-systests-org2-PeerAdmin');
                    } else {
                        return adminConnection.connect('composer-systests-org2-PeerAdmin');
                    }
                })
                .then(() => {
                    console.log('Installing network to org2');
                    TestUtil.injectDependencies(businessNetworkDefinition);
                    return adminConnection.install(businessNetworkDefinition);
                })
                .then(() => {
                    delete businessNetworkDefinition.getMetadata().getPackageJson().dependencies;
                    return adminConnection.disconnect();
                })
                .then(() => {
                    // Connect and start the network on the peers for org1 and org2.
                    TestUtil.log('Connecting to start the network');
                    if(otherChannel) {
                        return adminConnection.connect('othercomposer-systests-org1-PeerAdmin');
                    } else {
                        return adminConnection.connect('composer-systests-org1-PeerAdmin');
                    }
                })
                .then(() => {
                    console.log('Starting the network');
                    return adminConnection.start(
                        businessNetworkDefinition.getName(),
                        businessNetworkDefinition.getVersion(),
                        {
                            bootstrapTransactions,
                            endorsementPolicy: {
                                identities: [
                                    {
                                        role: {
                                            name: 'member',
                                            mspId: 'Org1MSP'
                                        }
                                    },
                                    {
                                        role: {
                                            name: 'member',
                                            mspId: 'Org2MSP'
                                        }
                                    }
                                ],
                                policy: {
                                    '2-of': [
                                        {
                                            'signed-by': 0
                                        },
                                        {
                                            'signed-by': 1
                                        }
                                    ]
                                }
                            }
                        });
                })
                .then(() => {
                    if(otherChannel) {
                        currentCp = otherConnectionProfileOrg1;
                    } else {
                        currentCp = connectionProfileOrg1;
                    }
                    TestUtil.log('Creating the network admin id card');
                    let ccpToUse = currentCp;
                    if (process.env.FVTEST.match('hsm$')) {
                        TestUtil.log('defining network admin id card to use HSM');
                        ccpToUse = JSON.parse(JSON.stringify(currentCp));
                        ccpToUse.client['x-hsm'] = {
                            'library': '/usr/local/lib/softhsm/libsofthsm2.so',
                            'slot': 0,
                            'pin': 98765432
                        };
                    }

                    let adminidCard = new IdCard({
                        userName: 'admin',
                        enrollmentSecret: 'adminpw',
                        businessNetwork: businessNetworkDefinition.getName()
                    }, ccpToUse);
                    return adminConnection.importCard(cardName, adminidCard);
                })
                .then(() => {
                    return adminConnection.disconnect();
                }).then(() => {
                    return cardStoreForDeploy;
                })
                .catch((err) => {
                    if (retryCount >= this.retries) {
                        throw(err);
                    } else {
                        this.deploy(businessNetworkDefinition, cardName, otherChannel, forceDeploy, retryCount++);
                    }
                });
        } else if (TestUtil.isHyperledgerFabricV1() && forceDeploy) {
            throw new Error('force deploy has been specified, this impl is not here anymore');
            // Connect and deploy the network on the peers for org1.
        } else if (!forceDeploy) {
            let metadata = {version: 1, userName: 'admin', secret: 'adminpw', roles: ['PeerAdmin', 'ChannelAdmin']};
            const deployCardName = 'deployer-card';
            let connectionprofile;

            if (TestUtil.isEmbedded() || TestUtil.isProxy()) {
                connectionprofile = {'x-type' : 'embedded', name: 'defaultProfile'};
            } else if (TestUtil.isWeb()) {
                connectionprofile = {'x-type' : 'web', name: 'defaultProfile'};
            } else {
                throw new Error('Unknown connector type');
            }
            currentCp = connectionprofile;
            let idCard_PeerAdmin = new IdCard(metadata, connectionprofile);

            TestUtil.log(`Deploying business network ${businessNetworkDefinition.getName()} using install & start ...`);
            return adminConnection.importCard(deployCardName, idCard_PeerAdmin)
                .then(() => {
                    // Connect, install the runtime and start the network.
                    return adminConnection.connect(deployCardName);
                })
                .then(() => {
                    TestUtil.injectDependencies(businessNetworkDefinition);
                    return adminConnection.install(businessNetworkDefinition);
                })
                .then(() => {
                    delete businessNetworkDefinition.getMetadata().getPackageJson().dependencies;
                    return adminConnection.start(businessNetworkDefinition.getName(),
                        businessNetworkDefinition.getVersion(),
                        {bootstrapTransactions});
                })
                .then(() => {
                    let adminidCard = new IdCard({
                        userName: 'admin',
                        enrollmentSecret: 'adminpw',
                        businessNetwork: businessNetworkDefinition.getName()
                    }, connectionprofile);
                    return adminConnection.importCard('admincard', adminidCard);
                })
                .then(() => {
                    return adminConnection.disconnect();
                }).then(() => {
                    return cardStoreForDeploy;
                })
                .catch((err) => {
                    if (retryCount >= this.retries) {
                        throw(err);
                    } else {
                        this.deploy(businessNetworkDefinition, cardName, otherChannel, forceDeploy, retryCount++);
                    }
                });
        } else if (forceDeploy) {
            throw new Error('should not be using ForceDeploy');
        } else {
            throw new Error('I do not know what kind of deploy you want me to run!');
        }
    }

    /**
     * Undeploy the specified business network definition.
     * @param {BusinessNetworkDefiniton} businessNetworkDefinition - the business network definition.
     * @return {Promise} - a promise that will be resolved when complete.
     */
    static undeploy(businessNetworkDefinition) {
        if (!TestUtil.isHyperledgerFabricV1()) {
            client = null;
            return Promise.resolve();
        }
        const docker = TestUtil.getDocker();
        return docker.listContainers()
            .then((containers) => {
                const matchingContainers = containers.filter((container) => {
                    return container.Image.match(/^dev-/);
                }).map((container) => {
                    return docker.getContainer(container.Id);
                });
                return matchingContainers.reduce((promise, matchingContainer) => {
                    return promise.then(() => {
                        TestUtil.log(`Stopping Docker container ${matchingContainer.id} ...`);
                        return matchingContainer.stop();
                    });
                }, Promise.resolve());
            });
    }

    /**
     * Reset the business network to its initial state.
     * @param {object} cardStore to use to connect and reset
     * @param {String} identifier, business network identifier to reset
     * @param {int} retryCount, current retry number
     * @param {string} cardName, the card name to use to reset the network
     * @return {Promise} - a promise that will be resolved when complete.
     */
    static resetBusinessNetwork(cardStore, identifier, retryCount, cardName) {
        if (!client) {
            return Promise.resolve();
        }

        cardName = cardName || 'admincard';

        if (TestUtil.isHyperledgerFabricV1() && !forceDeploy) {
            const adminConnection = new AdminConnection();
            return adminConnection.connect(cardName)
                .then(() => {
                    return adminConnection.reset(identifier);
                })
                .then(() => {
                    return adminConnection.disconnect();
                })
                .catch((err) => {
                    if (retryCount >= this.retries) {
                        throw(err);
                    } else {
                        this.resetBusinessNetwork(cardStore, identifier, retryCount++, cardName);
                    }
                });
        } else if (TestUtil.isHyperledgerFabricV1() && forceDeploy) {
            //const adminConnection = new AdminConnection({cardStore});
            throw new Error('force deploy is being requested and that impl is not available');
        } else {
            const adminConnection = new AdminConnection({cardStore});
            return adminConnection.connect('admincard')
                .then(() => {
                    return adminConnection.reset(identifier);
                })
                .then(() => {
                    return adminConnection.disconnect();
                });
        }

    }


    /** Return an integer for use as a number of retries
     *  @return {int} - an integer
     */
    static retries() {
        return testRetries;
    }

    /**
     * Get the current connection profile.
     * @return {Object} The current connection profile.
     */
    static getCurrentConnectionProfile() {
        return currentCp;
    }

}

module.exports = TestUtil;
