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
const MemoryCardStore = require('composer-common').MemoryCardStore;
const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const Docker = require('dockerode');
// const homedir = require('homedir');
// const mkdirp = require('mkdirp');
const net = require('net');
const path = require('path');
const sleep = require('sleep-promise');
const IdCard = require('composer-common').IdCard;
let client;
let currentCp;
let docker = new Docker();
let forceDeploy = false;
let testRetries = 4;
let cardStore;


const util = require('util');

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
    static setUp() {
        cardStore = new MemoryCardStore();
        let adminConnection = new AdminConnection({cardStore});
        forceDeploy = false;
        return TestUtil.waitForPorts()
            .then(() => {

                // Create all necessary configuration for the web runtime.
                if (TestUtil.isWeb()) {
                    // const BrowserFS = require('browserfs');
                    // BrowserFS.initialize(new BrowserFS.FileSystem.LocalStorage());
                    ConnectionProfileManager.registerConnectionManager('web', require('composer-connector-web'));
                    // console.log('Calling AdminConnection.createProfile() ...');
                    console.log('Used to call  AdminConnection.createProfile() ...');

                // Create all necessary configuration for the embedded runtime.
                } else if (TestUtil.isEmbedded()) {
                    console.log('Used to call  AdminConnection.createProfile() ...');
                    // return adminConnection.createProfile('composer-systests', {
                    //     type: 'embedded'
                    // });

                // Create all necessary configuration for the embedded runtime hosted via the connector server.
                } else if (TestUtil.isProxy()) {
                    // A whole bunch of dynamic requires to trick browserify.
                    const ConnectorServer = dynamicRequire('composer-connector-server');
                    const EmbeddedConnectionManager = dynamicRequire('composer-connector-embedded');
                    // const FSConnectionProfileStore = dynamicRequire('composer-common').FSConnectionProfileStore;
                    const BrowserFS = dynamicRequire('browserfs/dist/node/index');
                    const bfs_fs = BrowserFS.BFSRequire('fs');
                    BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());

                    const FileSystemCardStore = dynamicRequire('composer-common').FileSystemCardStore;
                    cardStore = new FileSystemCardStore({fs:bfs_fs});

                    const ProxyConnectionManager = dynamicRequire('composer-connector-proxy');
                    const socketIO = dynamicRequire('socket.io');
                    // We are using the embedded connector, but we configure it to route through the
                    // proxy connector and connector server.
                    // const connectionProfileStore = new FSConnectionProfileStore(fs);
                    ConnectionProfileManager.registerConnectionManager('embedded', ProxyConnectionManager);
                    const connectionProfileManager = new ConnectionProfileManager();
                    // Since we're a single process, we have to force the embedded connection manager into
                    // the connection profile manager that the connector server is using.
                    const connectionManager = new EmbeddedConnectionManager(connectionProfileManager);
                    connectionProfileManager.getConnectionManagerByType = () => {
                        return Promise.resolve(connectionManager);
                    };
                    const io = socketIO(15699);
                    io.on('connect', (socket) => {
                        console.log(`Client with ID '${socket.id}' on host '${socket.request.connection.remoteAddress}' connected`);
                        new ConnectorServer(cardStore, connectionProfileManager, socket);
                        console.log('Connector Server created');
                    });
                    io.on('disconnect', (socket) => {
                        console.log(`Client with ID '${socket.id}' on host '${socket.request.connection.remoteAddress}' disconnected`);
                    });
                    console.log('Calling AdminConnection.createProfile() ...');
                    return ;

                // Create all necessary configuration for Hyperledger Fabric v1.0.
                } else if (TestUtil.isHyperledgerFabricV1()) {
                    const FileSystemCardStore = dynamicRequire('composer-common').FileSystemCardStore;
                    cardStore = new FileSystemCardStore();
                    adminConnection = new AdminConnection({cardStore});
                    // const keyValStoreOrg1 = path.resolve(homedir(), '.composer-credentials', 'composer-systests-org1');
                    // mkdirp.sync(keyValStoreOrg1);
                    // const keyValStoreOrg2 = path.resolve(homedir(), '.composer-credentials', 'composer-systests-org2');
                    // mkdirp.sync(keyValStoreOrg2);
                    let connectionProfileOrg1, connectionProfileOrg2;
                    let connectionProfileOrg1Solo, connectionProfileOrg2Solo;

                    if (process.env.FVTEST.match('tls$')) {
                        console.log('setting up TLS Connection Profile for HLF V1');
                        connectionProfileOrg1 = {
                            type: 'hlfv1',
                            name: 'hlfv1org1',
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
                                },
                                {
                                    requestURL: 'grpcs://localhost:8051',
                                    hostnameOverride: 'peer0.org2.example.com',
                                    cert: './hlfv1/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt'
                                }
                            ],

                            channel: 'composerchannel',
                            mspID: 'Org1MSP',
                            timeout: '300'
                        };
                        connectionProfileOrg2 = {
                            type: 'hlfv1',
                            name: 'hlfv1org2',
                            orderers: [
                                {
                                    url: 'grpcs://localhost:7050',
                                    hostnameOverride: 'orderer.example.com',
                                    cert: './hlfv1/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt'
                                }
                            ],
                            ca: {
                                url: 'https://localhost:8054',
                                name: 'ca.org2.example.com'
                            },
                            peers: [
                                {
                                    requestURL: 'grpcs://localhost:8051',
                                    eventURL: 'grpcs://localhost:8053',
                                    hostnameOverride: 'peer0.org2.example.com',
                                    cert: './hlfv1/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt'
                                },
                                {
                                    requestURL: 'grpcs://localhost:7051',
                                    hostnameOverride: 'peer0.org1.example.com',
                                    cert: './hlfv1/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt'
                                }
                            ],

                            channel: 'composerchannel',
                            mspID: 'Org2MSP',
                            timeout: '300'
                        };
                        connectionProfileOrg1Solo = {
                            type: 'hlfv1',
                            name: 'hlfv1org1',
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

                            channel: 'composerchannel',
                            mspID: 'Org1MSP',
                            timeout: '300'
                        };
                        connectionProfileOrg2Solo = {
                            type: 'hlfv1',
                            name: 'hlfv1org2',
                            orderers: [
                                {
                                    url: 'grpcs://localhost:7050',
                                    hostnameOverride: 'orderer.example.com',
                                    cert: './hlfv1/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt'
                                }
                            ],
                            ca: {
                                url: 'https://localhost:8054',
                                name: 'ca.org2.example.com'
                            },
                            peers: [
                                {
                                    requestURL: 'grpcs://localhost:8051',
                                    eventURL: 'grpcs://localhost:8053',
                                    hostnameOverride: 'peer0.org2.example.com',
                                    cert: './hlfv1/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt'
                                }
                            ],

                            channel: 'composerchannel',
                            mspID: 'Org2MSP',
                            timeout: '300'
                        };
                    } else {
                        console.log('setting up Non-TLS Connection Profile for HLF V1');
                        connectionProfileOrg1 = {
                            type: 'hlfv1',
                            name: 'hlfv1org1',
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
                                },
                                {
                                    requestURL: 'grpc://localhost:8051'
                                }
                            ],
                            channel: 'composerchannel',
                            mspID: 'Org1MSP',
                            timeout: '300',

                        };
                        connectionProfileOrg2 = {
                            type: 'hlfv1',
                            name: 'hlfv1org2',
                            orderers: [
                                'grpc://localhost:7050'
                            ],
                            ca: {
                                url: 'http://localhost:8054',
                                name: 'ca.org2.example.com'
                            },
                            peers: [
                                {
                                    requestURL: 'grpc://localhost:8051',
                                    eventURL: 'grpc://localhost:8053'
                                },
                                {
                                    requestURL: 'grpc://localhost:7051',
                                }
                            ],
                            channel: 'composerchannel',
                            mspID: 'Org2MSP',
                            timeout: '300',

                        };
                        connectionProfileOrg1Solo = {
                            type: 'hlfv1',
                            name: 'hlfv1org1',
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

                        };
                        connectionProfileOrg2Solo = {
                            type: 'hlfv1',
                            name: 'hlfv1org2',
                            orderers: [
                                'grpc://localhost:7050'
                            ],
                            ca: {
                                url: 'http://localhost:8054',
                                name: 'ca.org2.example.com'
                            },
                            peers: [
                                {
                                    requestURL: 'grpc://localhost:8051',
                                    eventURL: 'grpc://localhost:8053'
                                }
                            ],
                            channel: 'composerchannel',
                            mspID: 'Org2MSP',
                            timeout: '300',

                        };
                    }


                    //
                    currentCp = connectionProfileOrg1;
                    if (process.env.COMPOSER_TIMEOUT_SECS) {
                        connectionProfileOrg1.timeout = parseInt(process.env.COMPOSER_TIMEOUT_SECS);
                        connectionProfileOrg2.timeout = parseInt(process.env.COMPOSER_TIMEOUT_SECS);
                        console.log('COMPOSER_TIMEOUT_SECS set, using: ', connectionProfileOrg1.timeout, connectionProfileOrg2.timeout);
                    }

                    let fs = dynamicRequire('fs');
                    console.log('Creating peer admin cards, and import them to the card store');
                    const admins = [
                        { org: 'org1', keyFile: 'key.pem' },
                        { org: 'org2', keyFile: 'key.pem' }
                    ];
                    return admins.reduce((promise, admin) => {
                        const org = admin.org;
                        const keyFile = admin.keyFile;

                        let cardsolo;
                        return promise.then(() => {
                            let keyPath = path.join(__dirname, `../hlfv1/crypto-config/peerOrganizations/${org}.example.com/users/Admin@${org}.example.com/msp/keystore/${keyFile}`);
                            let certPath = path.join(__dirname, `../hlfv1/crypto-config/peerOrganizations/${org}.example.com/users/Admin@${org}.example.com/msp/signcerts/Admin@${org}.example.com-cert.pem`);
                            let signerCert = fs.readFileSync(certPath).toString();
                            let key = fs.readFileSync(keyPath).toString();

                            let metadata = { version:1,
                                userName: 'PeerAdmin',
                                roles: ['PeerAdmin', 'ChannelAdmin'] };
                            // form up a IDCard
                            let card;
                            if (org==='org1'){
                                card = new IdCard(metadata,connectionProfileOrg1);
                                cardsolo = new IdCard(metadata,connectionProfileOrg1Solo);
                            }    else {
                                card = new IdCard(metadata,connectionProfileOrg2);
                                cardsolo = new IdCard(metadata,connectionProfileOrg2Solo);
                            }
                            card.setCredentials({certificate:signerCert,privateKey:key});
                            cardsolo.setCredentials({certificate:signerCert,privateKey:key});
                            return adminConnection.importCard(`composer-systests-${org}-PeerAdmin`, card)
                            .then(()=>{
                                return adminConnection.importCard(`composer-systests-${org}-solo-PeerAdmin`, cardsolo);
                            }).then(()=>{
                                console.log(util.inspect(cardStore));
                                console.log('Imported cards to the card store');
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
     * @return {Promise} - a promise that wil be resolved with a configured and
     * connected instance of BusinessNetworkConnection.
     */
    static tearDown() {
        forceDeploy = false;
        return Promise.resolve();
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
    static getClient(cardStore,network, enrollmentID, enrollmentSecret) {
        network = network || 'common-network';
        let cardName = 'admincard';
        let thisClient;
        return Promise.resolve()
        .then(() => {
            if (enrollmentID) {
                let metadata= {
                    userName : enrollmentID,
                    version : 1,
                    enrollmentSecret: enrollmentSecret,
                    businessNetwork : network
                };

                let idCard = new IdCard(metadata,currentCp);
                let adminConnection = new AdminConnection({cardStore});
                return adminConnection.connect('admincard')
                .then( ()=>{
                    return adminConnection.importCard(enrollmentID+'card',idCard);
                })
                .then( ()=>{
                    thisClient = new BusinessNetworkConnection({cardStore});
                    process.on('exit', () => {
                        thisClient.disconnect();
                    });
                })
                .then(()=>{
                    // return thisClient.connect(enrollmentID+'card');
                    cardName = enrollmentID+'card';
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
            enrollmentID = enrollmentID || 'admin';
            let password = TestUtil.isHyperledgerFabricV1() ? 'adminpw' : 'Xurw3yU9zI0l';
            enrollmentSecret = enrollmentSecret || password;
            // console.log(`Calling Client.connect('composer-systest', '${network}', '${enrollmentID}', '${enrollmentSecret}') ...`);
            if (TestUtil.isHyperledgerFabricV1() && !forceDeploy) {
                return thisClient.connect(cardName);
                // return thisClient.connect('composer-systests-org1', network, enrollmentID, enrollmentSecret);
            } else if (TestUtil.isHyperledgerFabricV1() && forceDeploy) {
                return thisClient.connect('composer-systests-org1-solo', network, enrollmentID, enrollmentSecret);
            } else {
                console.log('Connecting with '+cardName);
                return thisClient.connect(cardName);
            }
        })
        .then(() => {
            return thisClient;
        });
    }

    /**
     * Deploy the specified business network definition.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition - the business network definition to deploy.
     * @param {boolean} [forceDeploy_] - force use of the deploy API instead of install and start.
     * @return {Promise} - a promise that will be resolved when complete.
     */
    static deploy(businessNetworkDefinition, forceDeploy_) {
        // do not believe there is any code left doing forceDeploy_
        if (forceDeploy_){ throw new Error('this should not be deploying');}

        if (!cardStore) {
            cardStore = new MemoryCardStore();
        }
        const adminConnection = new AdminConnection({cardStore});
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
            console.log(`Deploying business network ${businessNetworkDefinition.getName()} using install & start ...`);
            return Promise.resolve()
                .then(() => {
                    // Connect and install the runtime onto the peers for org1.
                    console.log('Connecting to org1');
                    return adminConnection.connect('composer-systests-org1-solo-PeerAdmin');
                })
                .then(() => {
                    console.log('Connecting to install');
                    return adminConnection.install(businessNetworkDefinition.getName());
                })
                .then(() => {
                    return adminConnection.disconnect();
                })
                .then(() => {
                    // Connect and install the runtime onto the peers for org2.
                    console.log('Connecting to org2');
                    return adminConnection.connect('composer-systests-org2-solo-PeerAdmin');
                })
                .then(() => {
                    console.log('Connecting to install org2');
                    return adminConnection.install(businessNetworkDefinition.getName());
                })
                .then(() => {
                    return adminConnection.disconnect();
                })
                .then(() => {
                    // Connect and start the network on the peers for org1 and org2.
                    console.log('Connecting to start the network');
                    return adminConnection.connect('composer-systests-org1-PeerAdmin');
                })
                .then(() => {
                    console.log('Starting the network');
                    return adminConnection.start(businessNetworkDefinition, {
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
                .then(()=>{
                    console.log('Creating the network admin id card');
                    let adminidCard = new IdCard({ userName: 'admin', enrollmentSecret: 'adminpw', businessNetwork: businessNetworkDefinition.getName() },currentCp);
                    return adminConnection.importCard('admincard', adminidCard);
                })
                .then(() => {
                    return adminConnection.disconnect();
                }).then(()=>{
                    return cardStore;
                });
        } else if (TestUtil.isHyperledgerFabricV1() && forceDeploy) {
            console.log(`Deploying business network ${businessNetworkDefinition.getName()} using deploy ...`);
            // Connect and deploy the network on the peers for org1.
            return adminConnection.connectWithDetails('composer-systests-org1-solo', 'PeerAdmin', 'NOTNEEDED')
                .then(() => {
                    return adminConnection.deploy(businessNetworkDefinition, { bootstrapTransactions });
                })
                .then(() => {
                    return adminConnection.disconnect();
                });
        } else if (!forceDeploy) {
            let metadata = { version:1, userName: 'admin', secret: 'adminpw', roles: ['PeerAdmin', 'ChannelAdmin'] };
            const deployCardName = 'deployer-card';
            // currentCp = {type : 'embedded',name:'defaultProfile'};
            let connectionprofile;

            if (TestUtil.isEmbedded() || TestUtil.isProxy()){
                connectionprofile =  {type : 'embedded', name:'defaultProfile'};
            } else if (TestUtil.isWeb()){
                connectionprofile =  {type : 'web', name:'defaultProfile'};
            } else {
                throw new Error('Unknown connector type');
            }
            currentCp = connectionprofile;
            let idCard_PeerAdmin = new IdCard(metadata,connectionprofile);

            console.log(`Deploying business network ${businessNetworkDefinition.getName()} using install & start ...`);
            return adminConnection.importCard(deployCardName, idCard_PeerAdmin)
                .then(()=>{
                // Connect, install the runtime and start the network.
                    return adminConnection.connect(deployCardName);
                })
                .then(() => {
                    return adminConnection.install(businessNetworkDefinition.getName());
                })
                .then(() => {
                    console.log('deploying new '+businessNetworkDefinition.getName());
                    return adminConnection.start(businessNetworkDefinition, { bootstrapTransactions });
                })
                .then(()=>{

                    let adminidCard = new IdCard({ userName: 'admin', enrollmentSecret: 'adminpw', businessNetwork: businessNetworkDefinition.getName() },connectionprofile);
                    return adminConnection.importCard('admincard', adminidCard);
                })
                .then(() => {
                    return adminConnection.disconnect();
                }).then(()=>{
                    return cardStore;
                });
        } else if (forceDeploy) {
            console.log(`Deploying business network ${businessNetworkDefinition.getName()} using deploy ...`);
            // Connect and deploy the network.
            return adminConnection.connectWithDetails('composer-systests', 'admin', 'Xurw3yU9zI0l')
                .then(() => {
                    return adminConnection.deploy(businessNetworkDefinition, { bootstrapTransactions });
                })
                .then(() => {
                    return adminConnection.disconnect();
                });
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
            client=null;
            return Promise.resolve();
        }
        return docker.listContainers()
            .then((containers) => {
                const matchingContainers = containers.filter((container) => {
                    return container.Image.match(/^dev-/);
                }).map((container) => {
                    return docker.getContainer(container.Id);
                });
                return matchingContainers.reduce((promise, matchingContainer) => {
                    return promise.then(() => {
                        console.log(`Stopping Docker container ${matchingContainer.id} ...`);
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
     * @return {Promise} - a promise that will be resolved when complete.
     */
    static resetBusinessNetwork(cardStore,identifier, retryCount) {
        if (!client) {
            return Promise.resolve();
        }

        if (TestUtil.isHyperledgerFabricV1() && !forceDeploy){
            const adminConnection = new AdminConnection({cardStore});
            return adminConnection.connect('admincard')
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
                    this.resetBusinessNetwork(identifier, retryCount++);
                }
            });
        } else if(TestUtil.isHyperledgerFabricV1() && forceDeploy){
            const adminConnection = new AdminConnection({cardStore});
            return adminConnection.connectWithDetails('composer-systests-org1-solo', 'admin', 'NOTNEEDED', identifier)
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
                    this.resetBusinessNetwork(identifier, retryCount++);
                }
            });
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

}

module.exports = TestUtil;
