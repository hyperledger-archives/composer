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

const Connection = require('composer-common').Connection;
const fs = require('fs-extra');
const HLFSecurityContext = require('./hlfsecuritycontext');
const HLFUtil = require('./hlfutil');
const HLFTxEventHandler = require('./hlftxeventhandler');
const HLFQueryHandler = require('./hlfqueryhandler');
const Logger = require('composer-common').Logger;
const path = require('path');
const temp = require('temp').track();
const semver = require('semver');
const thenifyAll = require('thenify-all');

const User = require('fabric-client/lib/User.js');
const TransactionID = require('fabric-client/lib/TransactionID');
const FABRIC_CONSTANTS = require('fabric-client/lib/Constants');

const QueryCompiler = require('composer-runtime').QueryCompiler;

const LOG = Logger.getLog('HLFConnection');

const connectorPackageJSON = require('../package.json');
const runtimeHlfPackageJson = require('composer-runtime-hlfv1/package.json');
const composerVersion = runtimeHlfPackageJson.version;

const installDependencies = {
    'composer-common' : composerVersion,
    'composer-runtime-hlfv1' : composerVersion
};

/**
 * Class representing a connection to a business network running on Hyperledger
 * Fabric, using the hfc module.
 * @protected
 */
class HLFConnection extends Connection {

    /**
     * Create a new user.
     * @param {string} identity The identity of the user.
     * @param {Client} client The client.
     * @return {User} A new user.
     * @private
     */
    static createUser(identity, client) {
        let user = new User(identity);
        user.setCryptoSuite(client.getCryptoSuite());
        return user;
    }

    /**
     * create a new Query Handler.
     * @param {HLFConnection} connection The connection to be used by the query handler.
     * @return {HLFQueryManager} A new query manager.
     */
    static createQueryHandler(connection) {
        return new HLFQueryHandler(connection);
    }

    /**
     * Create a new Event Handler to listen for txId and chaincode events.
     * @param {array} eventHubs An array of event hubs.
     * @param {string} txId The transaction id string to listen for.
     * @param {number} commitTimeout the commit timeout.
     * @returns {HLFTxEventHandler} the event handler to use.
     * @private
     */
    static createTxEventHandler(eventHubs, txId, commitTimeout) {
        return new HLFTxEventHandler(eventHubs, txId, commitTimeout);
    }

    /**
     * Constructor.
     * @param {ConnectionManager} connectionManager The owning connection manager.
     * @param {string} connectionProfile The name of the connection profile associated with this connection
     * @param {string} businessNetworkIdentifier The identifier of the business network for this connection,
     * or null if this connection if an admin connection
     * @param {object} connectOptions The connection options in use by this connection.
     * @param {Client} client A configured and connected {@link Client} object.
     * @param {Chain} channel A configured and connected {@link Chain} object.
     * @param {FabricCAClientImpl} caClient A configured and connected {@link FabricCAClientImpl} object.
     */
    constructor(connectionManager, connectionProfile, businessNetworkIdentifier, connectOptions, client, channel, caClient) {
        super(connectionManager, connectionProfile, businessNetworkIdentifier);
        const method = 'constructor';
        LOG.entry(method, connectionManager, connectionProfile, businessNetworkIdentifier, connectOptions, client, channel, caClient);

        // Validate all the arguments.
        if (!connectOptions) {
            throw new Error('connectOptions not specified');
        } else if (!client) {
            throw new Error('client not specified');
        } else if (!channel) {
            throw new Error('channel not specified');
        } else if (!caClient) {
            throw new Error('caClient not specified');
        }

        // Save all the arguments away for later.
        this.connectOptions = connectOptions;
        this.client = client;
        this.channel = channel;
        this.eventHubs = [];
        this.ccEvent;
        this.caClient = caClient;
        this.initialized = false;
        this.commitTimeout = connectOptions['x-commitTimeout'] ? connectOptions['x-commitTimeout'] * 1000 : 300 * 1000;
        this.queryHandler = HLFConnection.createQueryHandler(this);
        LOG.debug(method, `commit timeout set to ${this.commitTimeout}`);

        // We create promisified versions of these APIs.
        this.fs = thenifyAll(fs);
        this.temp = thenifyAll(temp);
        LOG.exit(method);
    }

    /**
     * Terminate the connection to the business network.
     * @return {Promise} A promise that is resolved once the connection has been
     * terminated, or rejected with an error.
     */
    disconnect() {
        const method = 'disconnect';
        LOG.entry(method);

        if (this.exitListener) {
            process.removeListener('exit', this.exitListener);
            delete this.exitListener;
        }

        // Disconnect from the business network.
        return Promise.resolve()
            .then(() => {
                if (this.ccEvent) {
                    // unregister the eventhub chaincode event registration as disconnect will
                    // fire the onError callback.
                    this.ccEvent.eventHub.unregisterChaincodeEvent(this.ccEvent.handle);
                }

                this.eventHubs.forEach((eventHub) => {
                    if (eventHub.isconnected()) {
                        eventHub.disconnect();
                    }
                });
                LOG.exit(method);
            })
            .catch((error) => {
                const newError = new Error('Error trying disconnect. ' + error);
                LOG.error(method, newError);
                throw newError;
            });
    }

    /**
     * Enroll a user against the configured Fabric CA instance.
     * @param {string} enrollmentID The enrollment ID of the participant.
     * @param {string} enrollmentSecret The enrollment secret of the participant.
     * @return {Promise} A promise that is resolved with a {@link User}
     * object representing the enrolled participant, or rejected with an error.
     */
    enroll(enrollmentID, enrollmentSecret) {
        const method = 'enroll';
        LOG.entry(method, enrollmentID);

        // Validate all the arguments.
        if (!enrollmentID) {
            return Promise.reject(new Error('enrollmentID not specified'));
        } else if (!enrollmentSecret) {
            return Promise.reject(new Error('enrollmentSecret not specified'));
        }

        // Submit the enrollment request to Fabric CA.
        LOG.debug(method, 'Submitting enrollment request');
        let options = { enrollmentID: enrollmentID, enrollmentSecret: enrollmentSecret };
        let user;
        return this.caClient.enroll(options)
            .then((enrollment) => {
                // Store the certificate data in a new user object.
                LOG.debug(method, 'Successfully enrolled, creating user object');
                user = HLFConnection.createUser(enrollmentID, this.client);
                return user.setEnrollment(enrollment.key, enrollment.certificate, this.client.getMspid());
            })
            .then(() => {

                // Set the user object that the client will use.
                LOG.debug(method, 'Persisting user context into key value store');
                return this.client.setUserContext(user);

            })
            .then(() => {
                LOG.debug(method, 'loading channel configuration');
                return this._initializeChannel();
            })
            .then(() => {
                LOG.exit(method, user);
                return user;
            })
            .catch((error) => {
                const newError = new Error('Error trying to enroll user or load channel configuration. ' + error);
                LOG.error(method, newError);
                throw newError;
            });
    }

    /**
     * check the status of the event hubs and attempt to reconnect any event hubs.
     */
    _checkEventhubs() {
        const method = '_checkEventHubs';
        LOG.entry(method);

        this.eventHubs.forEach((eh) => {
            eh.checkConnection(true);
        });

        LOG.exit(method);
    }

    /**
     * check the status of the Chaincode Listener and if it isn't registered then try to register one.
     */
    _checkCCListener() {
        const method = '_checkCCListener';
        LOG.entry(method);

        if (!this.ccEvent) {
            // find a connected event hub and register with it.
            for (const eh of this.eventHubs) {
                if (eh.isconnected()) {
                    this._registerForChaincodeEvents(eh);
                    LOG.exit(method);
                    return;
                }
            }
            LOG.warn(method, `could not find any connected event hubs out of ${this.eventHubs.length} defined hubs to listen on for chaincode events`);
        }
        LOG.exit(method);
    }

    /**
     * register a listener for chaincode events
     * @param {ChannelEventHub} eventHub the event hub to listen for events on.
     * @private
     */
    _registerForChaincodeEvents(eventHub) {
        const method = '_registerForChaincodeEvents';
        LOG.entry(method);

        if (this.businessNetworkIdentifier) {
            LOG.debug(method, `registering for chaincode events on ${eventHub.getPeerAddr()}`);
            this.ccEvent = {eventHub: eventHub};
            this.ccEvent.handle = eventHub.registerChaincodeEvent(this.businessNetworkIdentifier, 'composer',
                (event, blockNum, txID, status) => {
                    if (status && status === 'VALID') {
                        let evt = event.payload.toString('utf8');
                        evt = JSON.parse(evt);
                        this.emit('events', evt);
                    }
                },
                (err) => {
                    this.ccEvent = undefined;
                    LOG.warn(method, `Eventhub for CC Events disconnected with error ${err.message}`);
                    this._checkCCListener();
                }
            );
        }
        LOG.exit(method);

    }

    /**
     * Create and connect to channel event hubs for each peer that is an event source.
     * @private
     */
    _connectToEventHubs() {
        const method = '_connectToEventHubs';
        LOG.entry(method);

        this.eventHubs = [];
        this.channel.getPeers().forEach((peer) => {
            if (peer.isInRole(FABRIC_CONSTANTS.NetworkConfig.EVENT_SOURCE_ROLE)) {
                let eventHub = this.channel.newChannelEventHub(peer);
                this.eventHubs.push(eventHub);
                eventHub.connect(true); // request full blocks, not filtered blocks.
            }
        });

        if (this.eventHubs.length > 0) {
            LOG.debug(method, 'register exit listener for connector');
            this.exitListener = () => {
                if (this.ccEvent) {
                    // unregister the chaincode event registration as disconnect will fire it's error handler
                    this.ccEvent.eventHub.unregisterChaincodeEvent(this.ccEvent.handle);
                }
                this.eventHubs.forEach((eventHub, index) => {
                    if (eventHub.isconnected()) {
                        eventHub.disconnect();
                    }
                });
            };

            process.on('exit', this.exitListener);
        }

        LOG.exit(method);
    }

    /**
     * Login as a participant on the business network.
     * @param {string} identity The identity which represents the required crypto material.
     * @param {string} enrollmentSecret The enrollment secret of the participant if required to obtain the
     * crypto material from a Certificate Authority.
     * @return {Promise} A promise that is resolved with a {@link SecurityContext}
     * object representing the logged in participant, or rejected with a login error.
     */
    login(identity, enrollmentSecret) {
        const method = 'login';
        LOG.entry(method, identity);

        // Validate all the arguments.
        if (!identity) {
            return Promise.reject(new Error('identity not specified'));
        }

        // Get the user context (certificate) from the state store.
        return this.client.getUserContext(identity, true)
            .then((user) => {

                // If the user exists and is enrolled, we use the data from the state store.
                // Otherwise we need to enroll against the CA to download the certificate.
                if (user && user.isEnrolled()) {
                    LOG.debug(method, 'User loaded from persistence and has already enrolled');
                    return user;
                } else {
                    LOG.debug(method, 'User not enrolled, submitting enrollment request');
                    return this.enroll(identity, enrollmentSecret);
                }
            })
            .then((user) => {

                // Now we can create a security context.
                LOG.debug(method, 'Creating new security context');
                let result = new HLFSecurityContext(this);
                result.setUser(identity);
                this.user = user;

                // now we can connect to the eventhubs
                this._connectToEventHubs();
                LOG.exit(method, result);
                return result;

            })
            .catch((error) => {
                const newError = new Error('Error trying login and get user Context. ' + error);
                LOG.error(method, error);
                throw newError;
            });
    }

    /**
     * Install the business network chaincode.
     *
     * @param {any} securityContext the security context
     * @param {string} businessNetworkDefinition the business network name
     * @param {object} installOptions any relevant install options
     * @param {object} installOptions.npmrcFile location of npmrc file to include in package
     * @returns {Promise} a promise which resolves to true if chaincode was installed, false otherwise (if ignoring installed errors)
     * @throws {Error} if chaincode was not installed and told not to ignore this scenario
     */
    async install(securityContext, businessNetworkDefinition, installOptions) {
        const method = 'install';
        LOG.entry(method, securityContext, businessNetworkDefinition, installOptions);

        if (!businessNetworkDefinition) {
            throw new Error('businessNetworkDefinition not specified');
        }

        // Update the package.json for install to Fabric
        const bnaPackage = businessNetworkDefinition.getMetadata().getPackageJson();
        bnaPackage.dependencies = this._createPackageDependencies(bnaPackage.dependencies);
        const scripts = bnaPackage.scripts || {};
        scripts.start = 'start-network';
        bnaPackage.scripts = scripts;

        const installDir = await this.temp.mkdir('businessnetwork');

        // Copy any tgz dependencies to the install directory and update the package.json
        for (let entry in bnaPackage.dependencies) {
            let dep = bnaPackage.dependencies[entry];
            if (dep.endsWith('.tgz')) {
                const fromPath = path.resolve(dep);
                const basename = path.basename(fromPath);
                const toPath = path.resolve(installDir, basename);
                await this.fs.copy(fromPath, toPath);
                bnaPackage.dependencies[entry] = './' + basename;
            }
        }

        // Write out the content of the business network definition and updated package.json
        await businessNetworkDefinition.toDirectory(installDir);
        const packagePath = path.join(installDir, 'package.json');
        const packageContent = JSON.stringify(bnaPackage);
        fs.writeFileSync(packagePath, packageContent);

        // write the query indexes to statedb/couchdb/indexes
        const queryManager = businessNetworkDefinition.getQueryManager();
        const queryCompiler = new QueryCompiler();
        const queries = queryCompiler.compile(queryManager);
        let indexDir = path.join(installDir, 'statedb');
        fs.mkdirSync(indexDir);
        indexDir = path.join(indexDir, 'couchdb');
        fs.mkdirSync(indexDir);
        indexDir = path.join(indexDir, 'indexes');
        fs.mkdirSync(indexDir);

        queries.compiledQueries.forEach(query => {
            const json = JSON.parse(query.index);
            const designDoc = json.ddoc + '.json';
            const indexFile = path.resolve(indexDir, designDoc);
            fs.writeFileSync(indexFile, query.index);
        });

        // copy over a .npmrc file, should be part of the business network definition.
        if (installOptions && installOptions.npmrcFile) {
            try {
                await this.fs.copy(installOptions.npmrcFile, path.join(installDir, '.npmrc'));
            } catch(error) {
                const newError = new Error(`Failed to copy specified npmrc file ${installOptions.npmrcFile} during install. ${error}`);
                LOG.error(method, newError);
                throw newError;
            }
        }

        let txId = this.client.newTransactionID();

        const request = {
            chaincodeType: 'node',
            chaincodePath: installDir,
            metadataPath: installDir,
            chaincodeVersion: businessNetworkDefinition.getVersion(),
            chaincodeId: businessNetworkDefinition.getName(),
            txId: txId,
            targets: this.getChannelPeersInOrg([FABRIC_CONSTANTS.NetworkConfig.ENDORSING_PEER_ROLE, FABRIC_CONSTANTS.NetworkConfig.CHAINCODE_QUERY_ROLE])
        };
        LOG.debug(method, 'Install chaincode request', request);
        // the following should have been used for request but the node sdk is broken
        // channelNames: this.channel.getName() // this will drive getting all the Peers to install on


        try {
            const results = await this.client.installChaincode(request);
            LOG.debug(method, `Received ${results.length} result(s) from installing the chaincode`, results);
            const CCAlreadyInstalledPattern = /chaincode .+ exists/;
            const {ignoredErrors, validResponses, invalidResponseMsgs} = this._validatePeerResponses(results[0], false, CCAlreadyInstalledPattern);

            // is the composer runtime already installed on all the peers ?
            const calledFromDeploy = installOptions && installOptions.calledFromDeploy;
            if (ignoredErrors === results[0].length && !calledFromDeploy) {
                const errorMsg = 'The business network is already installed on all the peers';
                throw new Error(errorMsg);
            }

            // if we failed to install the runtime on all the peers that don't have a runtime installed, throw an error
            if ((validResponses.length + ignoredErrors) !== results[0].length) {
                const allRespMsgs = invalidResponseMsgs.join('\n');
                const errorMsg = `The business network failed to install on 1 or more peers: ${allRespMsgs}`;
                throw new Error(errorMsg);
            }
            LOG.debug(method, `Business network installed on ${validResponses.length} out of ${results[0].length} peers`);

            // return a boolean to indicate if any composer runtime was installed.
            const chaincodeInstalled = validResponses.length !== 0;
            LOG.exit(method, chaincodeInstalled);
            return chaincodeInstalled;
        } catch(error) {
            const newError = new Error(`Error trying install business network. ${error}`);
            LOG.error(method, newError);
            throw newError;
        }
    }

    /**
     * Create valid package dependencies for installation to Fabric, based on existing package dependencies.
     * @param {Object} dependencies package.json dependencies.
     * @return {Object} Updated dependencies.
     * @private
     */
    _createPackageDependencies(dependencies) {
        const result = dependencies || { };

        if (!this._hasAllRequiredDependencies(result)) {
            Object.assign(result, installDependencies);
        }

        return result;
    }

    /**
     * Check if the required Composer package dependencies exist.
     * @param {Object} dependencies package.json dependencies.
     * @return {Boolean} true if the required dependencies exist; otherwise false.
     * @private
     */
    _hasAllRequiredDependencies(dependencies) {
        for (let property in installDependencies) {
            if (!dependencies[property]) {
                return false;
            }
        }

        return true;
    }

    /**
     * initialize the channel if it hasn't been done
     *
     * @returns {Promise} a promise that the channel is initialized
     * @private
     */
    _initializeChannel() {
        const method = '_initializeChannel';
        LOG.entry(method);
        if (!this.initialized) {
            return this.channel.initialize()
                .then(() => {
                    LOG.exit(method);
                    this.initialized = true;
                });
        }
        LOG.exit(method);
        return Promise.resolve();
    }

    /**
     * Add endorsement policy if specified to a start or upgrade request.
     *
     * @param {object} options the start or upgrade options that may contain endorsement policy information
     * @param {object} request the request to modify.
     * @private
     */
    _addEndorsementPolicy(options, request) {
        const method = '_addEndorsementPolicy';
        LOG.entry(method, options, request);

        if (!options) {
            LOG.exit(method, request);
            return;
        }

        try {
            // endorsementPolicy overrides endorsementPolicyFile
            if (options.endorsementPolicy) {
                request['endorsement-policy'] =
                    (typeof options.endorsementPolicy === 'string') ? JSON.parse(options.endorsementPolicy) : options.endorsementPolicy;
            } else if (options.endorsementPolicyFile) {
                // we don't check for existence so that the error handler will report the file not found
                request['endorsement-policy'] = JSON.parse(fs.readFileSync(options.endorsementPolicyFile));
            }
            LOG.exit(method, request);
        } catch (error) {
            const newError = new Error('Error trying parse endorsement policy. ' + error);
            LOG.error(method, newError);
            throw newError;
        }
    }

    /**
     * Instantiate the chaincode.
     *
     * @param {any} securityContext the security context
     * @param {string} businessNetworkName The identifier of the Business network that will be started in this installed runtime
     * @param {String} businessNetworkVersion The semantic version of the business network
     * @param {string} startTransaction The serialized start transaction.
     * @param {Object} [startOptions] connector specific installation options
     * @async
     */
    async start(securityContext, businessNetworkName, businessNetworkVersion, startTransaction, startOptions) {
        const method = 'start';
        LOG.entry(method, securityContext, businessNetworkName, startTransaction, startOptions);

        if (!businessNetworkName) {
            throw new Error('Business network name not specified');
        }
        if (!businessNetworkVersion) {
            throw new Error('Business network version not specified');
        }
        if (!startTransaction) {
            throw new Error('Start transaction not specified');
        }

        try {
            LOG.debug(method, 'loading the channel configuration');
            await this._initializeChannel();
            // check the event hubs and reconnect if possible. Do it here as the connection attempts are asynchronous
            this._checkEventhubs();

            const transactionId = this.client.newTransactionID();
            const proposal = {
                chaincodeType: 'node',
                chaincodeId: businessNetworkName,
                chaincodeVersion: businessNetworkVersion,
                txId: transactionId,
                fcn: 'start',
                args: [startTransaction]
            };
            this._addEndorsementPolicy(startOptions, proposal);

            LOG.debug(method, 'sending instantiate proposal', proposal);
            const proposalResponse = await this.channel.sendInstantiateProposal(proposal);
            await this._sendTransactionForProposal(proposalResponse, transactionId);
        } catch(error) {
            const newError = new Error('Error trying to start business network. ' + error);
            LOG.error(method, error);
            throw newError;
        }
    }

    /**
     * Process the endorsing peer results and submit the transaction
     * @param {Array} proposalResponse - results of the transaction proposal
     * @param {TransactionID} transactionId transaction ID object used in the proposal
     * @async
     * @private
     */
    async _sendTransactionForProposal(proposalResponse, transactionId) {
        const method = '_sendTransactionForProposal';
        LOG.entry(method, proposalResponse);

        // Validate the instantiate proposal results
        LOG.debug(method, `Received ${proposalResponse.length} results(s) from instantiating the composer runtime chaincode`, proposalResponse);
        let peerResponses = proposalResponse[0];
        let {validResponses} = this._validatePeerResponses(peerResponses, true);

        // Submit the endorsed transaction to the primary orderer.
        const proposal = proposalResponse[1];
        const eventHandler = HLFConnection.createTxEventHandler(this.eventHubs, transactionId.getTransactionID(), this.commitTimeout);
        eventHandler.startListening();
        const response = await this.channel.sendTransaction({
            proposalResponses: validResponses,
            proposal: proposal
        });

        // If the transaction was successful, wait for it to be committed.
        LOG.debug(method, 'Received response from orderer', response);
        if (response.status !== 'SUCCESS') {
            eventHandler.cancelListening();
            throw new Error(`Failed to send peer responses for transaction '${transactionId.getTransactionID()}' to orderer. Response status '${response.status}'`);
        }
        await eventHandler.waitForEvents();
        LOG.exit(method);
    }

    /**
     * Check for proposal response errors.
     * @private
     * @param {any} responses the responses from the install, instantiate or invoke
     * @param {boolean} isProposal true is the responses are from a proposal
     * @param {regexp} pattern optional regular expression for message which isn't an error
     * @return {Object} number of ignored errors and valid responses
     * @throws if there are no valid responses at all.
     * @private
     */
    _validatePeerResponses(responses, isProposal, pattern) {
        const method = '_validatePeerResponses';
        LOG.entry(method, responses, pattern, isProposal);

        if (!responses.length) {
            throw new Error('No results were returned from the request');
        }

        let validResponses = [];
        let invalidResponseMsgs = [];
        let ignoredErrors = 0;

        responses.forEach((responseContent) => {
            if (responseContent instanceof Error) {
                // check to see if we should ignore the error
                if (pattern && pattern.test(responseContent.message)) {
                    ignoredErrors++;
                } else {
                    const warning = `Response from attempted peer comms was an error: ${responseContent}`;
                    LOG.warn(warning);
                    invalidResponseMsgs.push(warning);
                }
            } else {

                // not an error, if it is from a proposal, verify the response
                if (isProposal && !this.channel.verifyProposalResponse(responseContent)) {
                    // the node-sdk doesn't provide any external utilities from parsing the responseContent.
                    // there are internal ones which may do what is needed or we would have to decode the
                    // protobufs ourselves but it should really be the node sdk doing this.
                    const warning = `Proposal response from peer failed verification. ${responseContent.response}`;
                    LOG.warn(warning);
                    invalidResponseMsgs.push(warning);
                } else if (responseContent.response.status !== 200) {
                    const warning = `Unexpected response of ${responseContent.response.status}. Payload was: ${responseContent.response.payload}`;
                    LOG.warn(warning);
                    invalidResponseMsgs.push(warning);
                } else {
                    validResponses.push(responseContent);
                }

            }
        });
        if (validResponses.length === 0 && ignoredErrors < responses.length) {
            const errorMessages = [ 'No valid responses from any peers.' ];
            invalidResponseMsgs.forEach(invalidResponse => errorMessages.push(invalidResponse));
            throw new Error(errorMessages.join('\n'));
        }

        // if it was a proposal and some of the responses were good, check that they compare
        // but we can't reject it as we don't know if it would still pass the endorsement policy
        // and if we did this would allow a malicious peer to stop transactions so we
        // issue a warning so that it get's logged, but we don't know which peer(s) it was
        if (isProposal && !this.channel.compareProposalResponseResults(validResponses)) {
            const warning = 'Peers do not agree, Read Write sets differ';
            LOG.warn(warning);
            invalidResponseMsgs.push(warning);
        }
        LOG.exit(method, ignoredErrors);
        return {ignoredErrors, validResponses, invalidResponseMsgs};
    }

    /**
     * Test ("ping") the connection to the business network.
     * @param {HLFSecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved once the connection to the
     * business network has been tested, or rejected with an error.
     */
    ping(securityContext) {
        const method = 'ping';
        LOG.entry(method, securityContext);

        // Check that a valid security context has been specified.
        HLFUtil.securityCheck(securityContext);

        // Check our client version should be greater than or equal but only a micro version change.
        return this._checkRuntimeVersions(securityContext)
            .then((results) => {
                if (!results.isCompatible) {
                    throw new Error(`Composer runtime (${results.response.version}) is not compatible with client (${connectorPackageJSON.version})`);
                }
                LOG.exit(method, results.response);
                return results.response;

            })
            .catch((error) => {
                const newError = new Error('Error trying to ping. ' + error);
                LOG.error(method, newError);
                throw newError;
            });
    }

    /**
     * perform a ping and check runtime versions haven't changed major/minor version numbers.
     * Changes to micro version numbers are acceptable.
     *
     * @param {HLFSecurityContext} securityContext The participant's security context.
     * @returns {Promise} which resolves to an array containing whether runtimes are compatible and the ping response,
     * or is rejected with an error.
     * @private
     */
    _checkRuntimeVersions(securityContext) {
        const method = '_checkRuntimeVersions';
        LOG.entry(method, securityContext);

        return this.queryChainCode(securityContext, 'ping', [])
            .then((buffer) => {

                // Parse the response.
                const response = JSON.parse(buffer.toString());
                const runtimeVersion = response.version;

                // Check our client version should be greater than or equal but only a micro version change.
                const range =  `^${runtimeVersion}`;
                const result = {isCompatible: semver.satisfies(connectorPackageJSON.version, range), response: response};
                LOG.exit(method, result);
                return result;
            });

    }

    /**
     * Invoke a "query" chaincode function with the specified name and arguments.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that is resolved with the data returned by the
     * chaincode function once it has been invoked, or rejected with an error.
     */
    async queryChainCode(securityContext, functionName, args) {
        const method = 'queryChainCode';
        LOG.entry(method, securityContext, functionName, args);

        if (!this.businessNetworkIdentifier) {
            return Promise.reject(new Error('No business network has been specified for this connection'));
        }

        // Check that a valid security context has been specified.
        HLFUtil.securityCheck(securityContext);

        // Validate all the arguments.
        if (!functionName) {
            return Promise.reject(new Error('functionName not specified'));
        } else if (!Array.isArray(args)) {
            return Promise.reject(new Error('args not specified'));
        }
        try {
            args.forEach((arg) => {
                if (typeof arg !== 'string') {
                    throw new Error('invalid arg specified: ' + arg);
                }
            });
        } catch(error) {
            return Promise.reject(error);
        }

        let txId = this.client.newTransactionID();
        return this.queryHandler.queryChaincode(txId, functionName, args);
    }

    /**
     * Invoke a "invoke" chaincode function with the specified name and arguments.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @param {Object} options options to pass to invoking chaincode
     * @param {Object} options.transactionId Transaction Id to use.
     * @return {Promise} A promise that is resolved once the chaincode function
     * has been invoked, or rejected with an error.
     */
    invokeChainCode(securityContext, functionName, args, options) {
        const method = 'invokeChainCode';
        LOG.entry(method, securityContext, functionName, args, options);

        if (!this.businessNetworkIdentifier) {
            return Promise.reject(new Error('No business network has been specified for this connection'));
        }

        // Check that a valid security context has been specified.
        HLFUtil.securityCheck(securityContext);

        // Validate all the arguments.
        if (!functionName) {
            return Promise.reject(new Error('functionName not specified'));
        } else if (!Array.isArray(args)) {
            return Promise.reject(new Error('args not specified'));
        }

        try {
            args.forEach((arg) => {
                if (typeof arg !== 'string') {
                    throw new Error('invalid arg specified: ' + arg);
                }
            });
        } catch(error) {
            return Promise.reject(error);
        }

        let txId;
        if (options && options.transactionId) {

            // see if we have a proper transactionID object or perhaps its the data of a transactionId
            if (options.transactionId instanceof TransactionID) {
                txId = options.transactionId;
            } else {
                txId = this.client.newTransactionID();
                Object.assign(txId, options.transactionId);
            }
        } else {
            txId = this.client.newTransactionID();
        }
        let eventHandler;

        // initialize the channel if it hasn't been initialized already otherwise verification will fail.
        LOG.debug(method, 'loading channel configuration');
        return this._initializeChannel()
            .then(() => {

                // check the event hubs and reconnect if possible. Do it here as the connection attempts are asynchronous
                this._checkEventhubs();

                // Submit the transaction to the endorsers.
                const request = {
                    chaincodeId: this.businessNetworkIdentifier,
                    chaincodeVersion: runtimeHlfPackageJson.version,
                    txId: txId,
                    fcn: functionName,
                    args: args
                };
                return this.channel.sendTransactionProposal(request); // node sdk will target all peers on the channel that are endorsingPeer
            })
            .then((results) => {
                // Validate the endorsement results.
                LOG.debug(method, `Received ${results.length} result(s) from invoking the composer runtime chaincode`, results);
                const proposalResponses = results[0];
                let {validResponses} = this._validatePeerResponses(proposalResponses, true);

                // Submit the endorsed transaction to the primary orderers.
                const proposal = results[1];
                const header = results[2];

                // check that we have a Chaincode listener setup and ready.
                this._checkCCListener();
                eventHandler = HLFConnection.createTxEventHandler(this.eventHubs, txId.getTransactionID(), this.commitTimeout);
                eventHandler.startListening();
                return this.channel.sendTransaction({
                    proposalResponses: validResponses,
                    proposal: proposal,
                    header: header
                });
            })
            .then((response) => {
                // If the transaction was successful, wait for it to be committed.
                LOG.debug(method, 'Received response from orderer', response);

                if (response.status !== 'SUCCESS') {
                    eventHandler.cancelListening();
                    throw new Error(`Failed to send peer responses for transaction '${txId.getTransactionID()}' to orderer. Response status '${response.status}'`);
                }
                return eventHandler.waitForEvents();
            })
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                const newError = new Error('Error trying invoke business network. ' + error);
                LOG.error(method, newError);
                throw newError;
            });
    }

    /**
     * Create a new identity for the specified user ID.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} userID The user ID.
     * @param {object} [options] Options for the new identity.
     * @param {boolean} [options.issuer] Whether or not the new identity should have
     * permissions to create additional new identities. False by default.
     * @param {string} [options.affiliation] Specify the affiliation for the new
     * identity. Defaults to 'org1'.
     * @param {string} [options.maxEnrollments] Specify the maximum number of enrollments. Defaults to 0.
     * @param {string} [options.role] Specify the role of the new identity. Defaults to 'client'.
     * @param {object} [options.attributes] Specify other attributes for the identity
     * @return {Promise} A promise that is resolved with a generated user
     * secret once the new identity has been created, or rejected with an error.
     */
    createIdentity(securityContext, userID, options) {
        const method = 'createIdentity';
        LOG.entry(method, securityContext, userID, options);

        // Check that a valid security context has been specified.
        HLFUtil.securityCheck(securityContext);
        if (!userID) {
            return Promise.reject(new Error('userID not specified'));
        }
        options = options || {};

        return new Promise((resolve, reject) => {
            let registerRequest = {
                enrollmentID: userID,
                affiliation: options.affiliation || 'org1',  // or eg. org1.department1
                attrs: [],
                maxEnrollments: options.maxEnrollments || 1,
                role: options.role || 'client'
            };

            if (options.issuer) {
                // Everyone we create can register clients.
                registerRequest.attrs.push({
                    name: 'hf.Registrar.Roles',
                    value: 'client'
                });

                // Everyone we create can register clients that can register clients.
                registerRequest.attrs.push({
                    name: 'hf.Registrar.Attributes',
                    value: 'hf.Registrar.Roles, hf.Registrar.Attributes'
                });
            }

            let idAttributes = options.attributes;
            if (typeof idAttributes === 'string') {
                try {
                    idAttributes = JSON.parse(idAttributes);
                } catch(error) {
                    const newError = new Error('attributes provided are not valid JSON. ' + error);
                    LOG.error(method, newError);
                    throw newError;
                }
            }

            for (let attribute in idAttributes) {
                LOG.debug(method, 'Adding attribute to request', attribute);
                registerRequest.attrs.push({
                    name: attribute,
                    value: idAttributes[attribute]
                });
            }

            this.caClient.register(registerRequest, this._getLoggedInUser())
                .then((userSecret) => {
                    LOG.exit(method, 'Register request succeeded');
                    resolve({
                        userID: userID,
                        userSecret: userSecret
                    });
                })
                .catch((error) => {
                    LOG.error(method, 'Register request failed trying to create identity', error);
                    reject(error);
                });
        });
    }

    /**
     * List all of the deployed business networks. The connection must
     * be connected for this method to succeed.
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that will be resolved with an array of
     * business network identifiers, or rejected with an error.
     */
    list(securityContext) {
        const method = 'list';
        LOG.entry(method, securityContext);

        // Check that a valid security context has been specified.
        HLFUtil.securityCheck(securityContext);

        // Query all instantiated chaincodes.
        return this.channel.queryInstantiatedChaincodes()
            .then((queryResults) => {
                LOG.debug(method, 'Queried instantiated chaincodes', queryResults);
                const result = queryResults.chaincodes.filter((chaincode) => {
                    return chaincode.path === 'composer';
                }).map((chaincode) => {
                    return chaincode.name;
                });
                LOG.exit(method, result);
                return result;
            })
            .catch((error) => {
                const newError = new Error('Error trying to list available business networks. ' + error);
                LOG.error(method, newError);
                throw newError;
            });

    }

    /**
     * return the logged in user
     * @returns {User} the logged in user
     * @private
     */
    _getLoggedInUser() {
        return this.user;
    }

    /**
     * Upgrade the chaincode.
     *
     * @param {any} securityContext the security context
     * @param {string} businessNetworkName The identifier of the Business network that will be started in this installed runtime
     * @param {String} businessNetworkVersion The semantic version of the business network
     * @param {Object} [upgradeOptions] connector specific installation options
     * @async
     */
    async upgrade(securityContext, businessNetworkName, businessNetworkVersion, upgradeOptions) {
        const method = 'upgrade';
        LOG.entry(method, securityContext, businessNetworkName, upgradeOptions);

        if (!businessNetworkName) {
            throw new Error('Business network name not specified');
        }
        if (!businessNetworkVersion) {
            throw new Error('Business network version not specified');
        }

        try {
            LOG.debug(method, 'loading the channel configuration');
            await this._initializeChannel();
            // check the event hubs and reconnect if possible. Do it here as the connection attempts are asynchronous
            this._checkEventhubs();

            const transactionId = this.client.newTransactionID();
            const proposal = {
                chaincodeType: 'node',
                chaincodeId: businessNetworkName,
                chaincodeVersion: businessNetworkVersion,
                txId: transactionId,
                fcn: 'upgrade'
            };
            this._addEndorsementPolicy(upgradeOptions, proposal);

            LOG.debug(method, 'sending upgrade proposal', proposal);
            const proposalResults = await this.channel.sendUpgradeProposal(proposal);
            await this._sendTransactionForProposal(proposalResults, transactionId);
        } catch(error) {
            const newError = new Error('Error trying to upgrade business network. ' + error);
            LOG.error(method, error);
            throw newError;
        }
    }

   /**
     * Get a transaction id from the fabric client
     * @param {any} securityContext security context
     * @return {Promise} A promise that is resolved with a transaction id
     */
    createTransactionId() {
        const method = 'createTransactionId';
        LOG.entry(method);
        let id = this.client.newTransactionID();
        LOG.exit(method, id.getTransactionID());
        return Promise.resolve({
            id:id,
            idStr:id.getTransactionID()
        });
    }


    /**
     * return the Channel peers that are in the organisation which matches the requested roles
     * @param {Array} peerRoles the peer roles that the returned list of peers need to satisfy
     * @returns {Array} the list of any peers that satisfy all the criteria.
     */
    getChannelPeersInOrg(peerRoles) {
        let peers = this.client.getPeersForOrgOnChannel(this.channel.getName());
        return peers.filter((cPeer) => {
            return peerRoles.every((peerRole) => {
                return cPeer.isInRole(peerRole);
            });
        });
    }
}

module.exports = HLFConnection;
