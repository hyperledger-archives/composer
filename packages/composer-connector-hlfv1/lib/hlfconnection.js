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
const Logger = require('composer-common').Logger;
const path = require('path');
const semver = require('semver');
const temp = require('temp').track();
const thenifyAll = require('thenify-all');
const User = require('fabric-client/lib/User.js');
const EventHub = require('fabric-client/lib/EventHub');

const LOG = Logger.getLog('HLFConnection');

const connectorPackageJSON = require('../package.json');
const runtimeModulePath = path.dirname(require.resolve('composer-runtime-hlfv1'));
const runtimePackageJSON = require('composer-runtime-hlfv1/package.json');

// The chaincode path is the portion of the GOPATH after 'src'.
const chaincodePath = 'composer';


/**
 * Class representing a connection to a business network running on Hyperledger
 * Fabric, using the hfc module.
 * @protected
 */
class HLFConnection extends Connection {

    /**
     * Create a new user.
     * @param {string} enrollmentID The enrollment ID.
     * @param {Client} client The client.
     * @return {User} A new user.
     */
    static createUser(enrollmentID, client) {
        let user = new User(enrollmentID);
        user.setCryptoSuite(client.getCryptoSuite());
        return user;
    }

  /**
     * Create a new event hub.
     *
     * @param {hfc} clientContext client context
     * @return {EventHub} A new event hub.
     */
    static createEventHub(clientContext) {
        return new EventHub(clientContext);
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
     * @param {array} eventHubDefs An array of event hub definitions
     * @param {FabricCAClientImpl} caClient A configured and connected {@link FabricCAClientImpl} object.
     */
    constructor(connectionManager, connectionProfile, businessNetworkIdentifier, connectOptions, client, channel, eventHubDefs, caClient) {
        super(connectionManager, connectionProfile, businessNetworkIdentifier);
        const method = 'constructor';
        LOG.entry(method, connectionManager, connectionProfile, businessNetworkIdentifier, connectOptions, client, channel, eventHubDefs, caClient);

        // Validate all the arguments.
        if (!connectOptions) {
            throw new Error('connectOptions not specified');
        } else if (!client) {
            throw new Error('client not specified');
        } else if (!channel) {
            throw new Error('channel not specified');
        } else if (!eventHubDefs || !Array.isArray(eventHubDefs)) {
            throw new Error('eventHubDefs not specified or not an array');
        } else if (!caClient) {
            throw new Error('caClient not specified');
        }

        // Save all the arguments away for later.
        this.connectOptions = connectOptions;
        this.client = client;
        this.channel = channel;
        this.eventHubDefs = eventHubDefs;
        this.eventHubs = [];
        this.ccEvents = [];
        this.caClient = caClient;
        this.initialized = false;

        // We create promisified versions of these APIs.
        this.fs = thenifyAll(fs);
        this.temp = thenifyAll(temp);
        LOG.exit(method);
    }

    /**
     * Get the connection options for this connection.
     * @return {object} The connection options for this connection.
     */
    getConnectionOptions() {
        return this.connectOptions;
    }

    /**
     * Terminate the connection to the business network.
     * @return {Promise} A promise that is resolved once the connection has been
     * terminated, or rejected with an error.
     */
    disconnect() {
        const method = 'disconnect';
        LOG.entry(method);

        // Disconnect from the business network.
        return Promise.resolve()
            .then(() => {
                this.eventHubs.forEach((eventHub, index) => {
                    if (eventHub.isconnected()) {
                        eventHub.disconnect();
                    }

                    // unregister any eventhub chaincode event registrations
                    if (this.ccEvents[index]) {
                        this.eventHubs[index].unregisterChaincodeEvent(this.ccEvents[index]);
                    }

                });
                LOG.exit(method);
            })
            .catch((error) => {
                const newError = new Error('error trying disconnect. ' + error);
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
        const method = 'registerAndEnroll';
        LOG.entry(method, enrollmentID);

        // Validate all the arguments.
        if (!enrollmentID) {
            throw new Error('enrollmentID not specified');
        } else if (!enrollmentSecret) {
            throw new Error('enrollmentSecret not specified');
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
                return user.setEnrollment(enrollment.key, enrollment.certificate, this.connectOptions.mspID);
            })
            .then(() => {

                // Set the user object that the client will use.
                LOG.debug(method, 'Persisting user context into key value store');
                return this.client.setUserContext(user);

            })
            .then(() => {
                return this._initializeChannel();
            })
            .then(() => {
                LOG.exit(method, user);
                return user;
            })
            .catch((error) => {
                const newError = new Error('error trying to enroll user. ' + error);
                LOG.error(method, newError);
                throw newError;
            });
    }

    /**
     * process the event hub defs to create event hubs and connect
     * to them
     */
    _connectToEventHubs() {
        const method = '_connectToEventHubs';
        LOG.entry(method);
        this.eventHubDefs.forEach((eventHubDef) => {
            const eventHub = HLFConnection.createEventHub(this.client);  //TODO: Change this.
            eventHub.setPeerAddr(eventHubDef.eventURL, eventHubDef.opts);
            eventHub.connect();
            this.eventHubs.push(eventHub);
        });

        if (this.businessNetworkIdentifier) {

            // register a chaincode event listener on the first peer only.
            let ccid = this.businessNetworkIdentifier;
            LOG.debug(method, 'registerChaincodeEvent', ccid, 'composer');
            let ccEvent  = this.eventHubs[0].registerChaincodeEvent(ccid, 'composer', (event) => {
                let evt = event.payload.toString('utf8');
                evt = JSON.parse(evt);
                this.emit('events', evt);
            });
            this.ccEvents[0] = ccEvent;
        }

        process.on('exit', () => {
            this.eventHubs.forEach((eventHub, index) => {
                if (eventHub.isconnected()) {
                    eventHub.disconnect();
                }

                // unregister any eventhub chaincode event registrations
                if (this.ccEvents[index]) {
                    this.eventHubs[index].unregisterChaincodeEvent(this.ccEvents[index]);
                }
            });
        });

        LOG.exit(method);
    }

    /**
     * Login as a participant on the business network.
     * @param {string} enrollmentID The enrollment ID of the participant.
     * @param {string} enrollmentSecret The enrollment secret of the participant.
     * @return {Promise} A promise that is resolved with a {@link SecurityContext}
     * object representing the logged in participant, or rejected with a login error.
     */
    login(enrollmentID, enrollmentSecret) {
        const method = 'login';
        LOG.entry(method, enrollmentID);

        // Validate all the arguments.
        if (!enrollmentID) {
            throw new Error('enrollmentID not specified');
        } else if (!enrollmentSecret) {
            throw new Error('enrollmentSecret not specified');
        }

        // Get the user context (certificate) from the state store.
        return this.client.getUserContext(enrollmentID, true)
            .then((user) => {

                // If the user exists and is enrolled, we use the data from the state store.
                // Otherwise we need to enroll against the CA to download the certificate.
                if (user && user.isEnrolled()) {
                    LOG.debug(method, 'User loaded from persistence and has already enrolled');
                    return user;
                } else {
                    LOG.debug(method, 'User not enrolled, submitting enrollment request');
                    return this.enroll(enrollmentID, enrollmentSecret);
                }
            })
            .then((user) => {

                // Now we can create a security context.
                LOG.debug(method, 'Creating new security context');
                let result = new HLFSecurityContext(this);
                result.setUser(enrollmentID);
                this.user = user;

                // now we can connect to the eventhubs
                this._connectToEventHubs();
                LOG.exit(method, result);
                return result;

            })
            .catch((error) => {
                const newError = new Error('error trying login and get user Context. ' + error);
                LOG.error(method, error);
                throw newError;
            });
    }

    /**
     * internal method to perform chaincode install
     *
     * @param {any} securityContext the security context
     * @param {any} businessNetwork the business network
     * @private
     * @returns {Promise} a promise for install completion
     *
     * @memberOf HLFConnection
     */
    _install(securityContext, businessNetwork) {
        const method = '_install';
        LOG.entry(method, securityContext, businessNetwork);

        // Because hfc needs to write a Dockerfile to the chaincode directory, we
        // must copy the chaincode to a temporary directory. We need to do this
        // to handle the case where Composer is installed into the global directory
        // (npm install -g) and is therefore owned by the root user.
        let tempDirectoryPath;
        return this.temp.mkdir('composer')
            .then((tempDirectoryPath_) => {

                // Copy the chaincode from source directory to temporary directory.
                tempDirectoryPath = tempDirectoryPath_;
                let sourceDirectoryPath = path.resolve(runtimeModulePath);
                let targetDirectoryPath = path.resolve(tempDirectoryPath, 'src', chaincodePath);
                return this.fs.copy(sourceDirectoryPath, targetDirectoryPath, { filter: (path) => { return !/composer-runtime-hlfv1.*node_modules/.test(path); }});

            })
            .then(() => {
                // Update the chaincode source to have the runtime version in it.
                let targetFilePath = path.resolve(tempDirectoryPath, 'src', chaincodePath, 'version.go');
                let targetFileContents = `
                package main
                // The version for this chaincode.
                const version = "${runtimePackageJSON.version}"
                `;
                return this.fs.outputFile(targetFilePath, targetFileContents);

            })
            .then(() => {
                let txId = this.client.newTransactionID();
                // This is evil! I shouldn't need to set GOPATH in a node.js program.
                process.env.GOPATH = tempDirectoryPath;

                // Submit the install request to the peer
                const request = {
                    chaincodePath: chaincodePath,
                    chaincodeVersion: runtimePackageJSON.version,
                    chaincodeId: businessNetwork.getName(),
                    txId: txId,
                    targets: this.channel.getPeers()
                };

                return this.client.installChaincode(request);
            })
            .then((results) => {
                LOG.debug(method, `Received ${results.length} results(s) from installing the chaincode`, results);

                // Validate the proposal results, ignore chaincode exists messages
                this._validateResponses(results[0], false, /chaincode .+ exists/);

                LOG.debug(method, 'chaincode installed, or already installed');
            })
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                const newError = new Error('error trying install chaincode. ' + error);
                LOG.error(method, newError);
                throw newError;
            });
    }

    /**
     * initialize the channel if it hasn't been done
     *
     * @returns {Promise} a promise that the channel is initialized
     *
     * @memberOf HLFConnection
     */
    _initializeChannel() {
        if (!this.initialized) {
            return this.channel.initialize()
                .then(() => {
                    this.initialized = true;
                });
        }
        return Promise.resolve();
    }

    /**
     * instantiate the chaincode
     *
     *
     * @param {any} securityContext the security context
     * @param {any} businessNetwork the business network
     * @private
     * @returns {Promise} a promise for instantiation completion
     *
     * @memberOf HLFConnection
     */
    _instantiate(securityContext, businessNetwork) {
        const method = '_instantiate';
        LOG.entry(method, securityContext, businessNetwork);

        let businessNetworkArchive;
        let finalTxId;

        // initialize the channel ready for instantiation
        return this._initializeChannel()
            .then(() => {
                // serialise the business network
                return businessNetwork.toArchive();
            })
            .then((bna) => {
                businessNetworkArchive = bna;
                // prepare and send the instantiate proposal
                finalTxId = this.client.newTransactionID();

                const request = {
                    chaincodePath: chaincodePath,
                    chaincodeVersion: runtimePackageJSON.version,
                    chaincodeId: businessNetwork.getName(),
                    txId: finalTxId,
                    fcn: 'init',
                    args: [businessNetworkArchive.toString('base64')]
                };
                return this.channel.sendInstantiateProposal(request);
            })
            .then((results) => {
                // Validate the instantiate proposal results
                LOG.debug(method, `Received ${results.length} results(s) from deploying the chaincode`, results);
                let proposalResponses = results[0];
                this._validateResponses(proposalResponses, true);

                // Submit the endorsed transaction to the primary orderer.
                const proposal = results[1];
                const header = results[2];
                return this.channel.sendTransaction({
                    proposalResponses: proposalResponses,
                    proposal: proposal,
                    header: header
                });

            })
            .then((response) => {

                // If the transaction was successful, wait for it to be committed.
                LOG.debug(method, 'Received response from orderer', response);
                if (response.status !== 'SUCCESS') {
                    throw new Error(`Failed to commit transaction '${finalTxId}' with response status '${response.status}'`);
                }
                return this._waitForEvents(finalTxId, this.connectOptions.timeout);

            })
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                const newError = new Error('error trying instantiate chaincode. ' + error);
                LOG.error(method, newError);
                throw newError;
            });
    }

    /**
     * Deploy all business network artifacts.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @param {boolean} [force] Force the deployment of the business network artifacts. Not used by this connector.
     * @param {BusinessNetwork} businessNetwork The BusinessNetwork to deploy
     * @return {Promise} A promise that is resolved once the business network
     * artifacts have been deployed, or rejected with an error.
     */
    deploy(securityContext, force, businessNetwork) {
        const method = 'deploy';
        LOG.entry(method, securityContext, force, businessNetwork);

        // Check that a valid security context has been specified.
        HLFUtil.securityCheck(securityContext);

        // Validate all the arguments.
        if (!businessNetwork) {
            throw new Error('businessNetwork not specified');
        }

        return this._install(securityContext, businessNetwork)
            .then(() => {
                // check to see if the chaincode is already instantiated
                return this.channel.queryInstantiatedChaincodes();
            })
            .then((queryResults) => {
                LOG.debug(method, 'Queried instantiated chaincodes', queryResults);
                let alreadyInstantiated = queryResults.chaincodes.some((chaincode) => {
                    return chaincode.path === 'composer' && chaincode.name === businessNetwork.getName();
                });
                if (alreadyInstantiated) {
                    LOG.debug(method, 'chaincode already instantiated');
                    return Promise.resolve();
                }
                return this._instantiate(securityContext, businessNetwork);
            })
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                const newError = new Error('error trying deploy. ' + error);
                LOG.error(method, error);
                throw newError;
            });

    }

    /**
     * Check for proposal response errors.
     * @private
     * @param {any} responses the responses from the install, instantiate or invoke
     * @param {boolean} isProposal true is the responses are from a proposal
     * @param {regexp} pattern optional regular expression for message which isn't an error
     * @throws if not valid
     */
    _validateResponses(responses, isProposal, pattern) {
        const method = '_validateResponses';
        LOG.entry(method, responses, pattern, isProposal);

        if (!responses.length) {
            throw new Error('No results were returned from the request');
        }

        responses.forEach((responseContent) => {
            if (responseContent instanceof Error) {
                // check to see if we should ignore the error, this also means we cannot verify the proposal
                // or check the proposals across peers
                if (!pattern || !pattern.test(responseContent.message)) {
                    throw responseContent;
                }
            } else {

                // not an error, if it is from a proposal, verify the response
                if (isProposal && !this.channel.verifyProposalResponse(responseContent)) {
                    throw new Error('Response from peer was not valid');
                }
                if (responseContent.response.status !== 200) {
                    throw new Error('Unexpected response of ' + responseContent.response.status + '. payload was :' +responseContent.response.payload);
                }
            }

        });

        // if it was a proposal and all the responses were good, check that they compare
        if (isProposal && !this.channel.compareProposalResponseResults(responses)) {
            throw new Error('Peers do not agree, RW sets differ');
        }
        LOG.exit(method);
    }

    /**
     * Undeploy a business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the business network to remove
     * @return {Promise} A promise that is resolved once the business network
     * artifacts have been undeployed, or rejected with an error.
     */
    undeploy(securityContext, businessNetworkIdentifier) {
        const method = 'undeploy';
        LOG.entry(method, securityContext, businessNetworkIdentifier);

        // Check that a valid security context has been specified.
        HLFUtil.securityCheck(securityContext);

        // Validate all the arguments.
        if (!businessNetworkIdentifier) {
            throw new Error('businessNetworkIdentifier not specified');
        }
        if (businessNetworkIdentifier !== this.businessNetworkIdentifier) {
            throw new Error('businessNetworkIdentifier does not match the business network identifier for this connection');
        }

        // Send an undeploy request which will disable the chaincode.
        return this.invokeChainCode(securityContext, 'undeployBusinessNetwork', [])
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                const newError = new Error('error trying undeploy. ' + error);
                LOG.error(method, newError);
                throw newError;
            });
    }

    /**
     * Updates an existing deployed business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition The BusinessNetworkDefinition to deploy
     * @return {Promise} A promise that is resolved once the business network
     * artifacts have been updated, or rejected with an error.
     */
    update(securityContext, businessNetworkDefinition) {
        const method = 'update';
        LOG.entry(method, securityContext, businessNetworkDefinition);

        // Check that a valid security context has been specified.
        HLFUtil.securityCheck(securityContext);

        // Validate all the arguments.
        if (!businessNetworkDefinition) {
            throw new Error('businessNetworkDefinition not specified');
        }

        // Serialize the business network.
        return businessNetworkDefinition.toArchive()
            .then((businessNetworkArchive) => {

                // Send an update request to the chaincode.
                return this.invokeChainCode(securityContext, 'updateBusinessNetwork', [businessNetworkArchive.toString('base64')]);

            })
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                const newError = new Error('error trying to update business network. ' + error);
                LOG.error(method, newError);
                throw newError;
            });
    }

    /**
     * Test ("ping") the connection to the business network.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved once the connection to the
     * business network has been tested, or rejected with an error.
     */
    ping(securityContext) {
        const method = 'ping';
        LOG.entry(method, securityContext);

        // Check that a valid security context has been specified.
        HLFUtil.securityCheck(securityContext);

        // Submit a call to the ping function in the chaincode.
        return this.queryChainCode(securityContext, 'ping', [])
            .then((buffer) => {

                // Parse the response.
                const response = JSON.parse(buffer.toString());

                // Is the runtime using a prerelease version?
                const runtimeVersion = response.version;
                const prerelease = (semver.prerelease(runtimeVersion) !== null);

                // If the runtime is using a prerelease version, then we must exactly match that version.
                // If the runtime is using a normal version, then our client version should be greater than or equal.
                const range = (prerelease ? runtimeVersion : `^${runtimeVersion}`);
                if (!semver.satisfies(connectorPackageJSON.version, range)) {
                    LOG.error('ping', 'Version mismatch', connectorPackageJSON.version, runtimeVersion, range);
                    throw new Error(`Deployed chain-code (${response.version}) is incompatible with client (${connectorPackageJSON.version})`);
                } else {
                    LOG.info('ping', 'Successful ping', connectorPackageJSON.version, runtimeVersion, range);
                }
                LOG.exit(method, response);
                return response;

            })
            .catch((error) => {
                const newError = new Error('error trying to ping. ' + error);
                LOG.error(method, newError);
                throw newError;
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
    queryChainCode(securityContext, functionName, args) {
        const method = 'queryChainCode';
        LOG.entry(method, securityContext, functionName, args);

        // Check that a valid security context has been specified.
        HLFUtil.securityCheck(securityContext);

        // Validate all the arguments.
        if (!functionName) {
            throw new Error('functionName not specified');
        } else if (!Array.isArray(args)) {
            throw new Error('args not specified');
        }
        args.forEach((arg) => {
            if (typeof arg !== 'string') {
                throw new Error('invalid arg specified: ' + arg);
            }
        });

        let txId = this.client.newTransactionID();


        // Submit the query request.
        const request = {
            chaincodeId: this.businessNetworkIdentifier,
            chaincodeVersion: runtimePackageJSON.version,
            txId: txId,
            fcn: functionName,
            args: args
        };
        return this.channel.queryByChaincode(request)
            .then((payloads) => {
                LOG.debug(method, `Received ${payloads.length} payloads(s) from querying the chaincode`, payloads);
                if (!payloads.length) {
                    throw new Error('No payloads were returned from the query request:' + functionName);
                }
                const payload = payloads[0];
                if (payload instanceof Error) {
                    // will be handled by the catch block
                    throw payload;
                }
                LOG.exit(payload);
                return payload;
            })
            .catch((error) => {
                const newError = new Error('error trying to query chaincode. ' + error);
                LOG.error(method, newError);
                throw newError;
            });

    }

    /**
     * Invoke a "invoke" chaincode function with the specified name and arguments.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that is resolved once the chaincode function
     * has been invoked, or rejected with an error.
     */
    invokeChainCode(securityContext, functionName, args) {
        const method = 'invokeChainCode';
        LOG.entry(method, securityContext, functionName, args);

        // Check that a valid security context has been specified.
        HLFUtil.securityCheck(securityContext);

        // Validate all the arguments.
        if (!functionName) {
            throw new Error('functionName not specified');
        } else if (!Array.isArray(args)) {
            throw new Error('args not specified');
        }
        args.forEach((arg) => {
            if (typeof arg !== 'string') {
                throw new Error('invalid arg specified: ' + arg);
            }
        });

        let txId = this.client.newTransactionID();

        // initialize the channel if it hasn't been initialized already otherwise verification will fail.
        return this._initializeChannel()
            .then(() => {


                // Submit the transaction to the endorsers.
                const request = {
                    chaincodeId: this.businessNetworkIdentifier,
                    chaincodeVersion: runtimePackageJSON.version,
                    txId: txId,
                    fcn: functionName,
                    args: args
                };
                return this.channel.sendTransactionProposal(request);
            })
            .then((results) => {
                // Validate the endorsement results.
                LOG.debug(method, `Received ${results.length} results(s) from invoking the chaincode`, results);
                const proposalResponses = results[0];
                this._validateResponses(proposalResponses, true);

                // Submit the endorsed transaction to the primary orderers.
                const proposal = results[1];
                const header = results[2];

                return this.channel.sendTransaction({
                    proposalResponses: proposalResponses,
                    proposal: proposal,
                    header: header
                });
            })
            .then((response) => {
                // If the transaction was successful, wait for it to be committed.
                // TODO: Should only listen for the events if SUCCESS is returned
                LOG.debug(method, 'Received response from orderer', response);

                if (response.status !== 'SUCCESS') {
                    throw new Error(`Failed to commit transaction '${txId}' with response status '${response.status}'`);
                }
                return this._waitForEvents(txId, this.connectOptions.timeout);
            })
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                const newError = new Error('error trying invoke chaincode. ' + error);
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
            throw new Error('userID not specified');
        }
        options = options || {};

        //TODO: org1 is one of the default affiliations in fabric-ca-server
        return new Promise((resolve, reject) => {
            let registerRequest = {
                enrollmentID: userID,
                affiliation: options.affiliation || 'org1',  // or eg. org1.department1
                attrs: [],
                maxEnrollments: options.maxEnrollments || 0,
                role: options.role || 'client'
            };

            if (options.issuer) {
                // Everyone we create can register clients.
                registerRequest.attrs.push({
                    name: 'hf.Registrar.Roles',
                    value: 'client'
                });
                // Everyone we create can register clients that can register clients.
                // Don't think this is needed anymore
                //registerRequest.attrs.push({
                //    name: 'hf.Registrar.DelegateRoles',
                //    value: 'client'
                //});
            }
            for (let attribute in options.attributes) {
                LOG.debug(method, 'Adding attribute to request', attribute);
                registerRequest.attrs.push({
                    name: attribute,
                    value: options.attributes[attribute]
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
                    return reject(error);
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
                const newError = new Error('error trying to list instantiated chaincodes. ' + error);
                LOG.error(method, newError);
                throw newError;
            });

    }

  /**
     * wait for events from the peers associated with the provided transaction id.
     * @param {string} txObj the transaction id to listen for events on
     * @param {number} waitTime the time to wait in seconds for an event response
     * @returns {Promise} A promise which resolves when all the events are received or rejected
     * if an event is not received within the given timeout period
     * @memberOf HLFConnection
     */
    _waitForEvents(txObj, waitTime) {
        const txId = txObj.getTransactionID().toString();
        const method = '_waitForEvents';
        LOG.entry(method, txId, waitTime);
        let eventPromises = [];
        this.eventHubs.forEach((eh) => {
            let txPromise = new Promise((resolve, reject) => {
                const handle = setTimeout(() => {
                    reject(new Error(`Failed to receive commit notification for transaction '${txId}' within the timeout period`));
                }, waitTime * 1000);
                eh.registerTxEvent(txId, (tx, code) => {
                    clearTimeout(handle);
                    eh.unregisterTxEvent(txId);
                    if (code !== 'VALID') {
                        reject(new Error(`Peer has rejected transaction '${txId}' with cdoe ${code}`));
                    } else {
                        resolve();
                    }
                });
            });
            eventPromises.push(txPromise);
        });
        return Promise.all(eventPromises)
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * return the logged in user
     * @returns {User} the logged in user
     */
    _getLoggedInUser() {
        return this.user;
    }

}

module.exports = HLFConnection;
