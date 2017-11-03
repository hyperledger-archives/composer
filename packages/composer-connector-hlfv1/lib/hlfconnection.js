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
     * @param {string} identity The identity of the user.
     * @param {Client} client The client.
     * @return {User} A new user.
     */
    static createUser(identity, client) {
        let user = new User(identity);
        user.setCryptoSuite(client.getCryptoSuite());
        return user;
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
        this.client = client;
        this.channel = channel;
        this.ccEvents = [];
        this.eventHubs = [];
        this.caClient = caClient;
        this.initialized = false;
        this.commitTimeout = connectOptions['x-commitTimeout'] ? connectOptions['x-commitTimeout'] * 1000 : 300 * 1000;
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
     * process the event hub defs to create event hubs and connect
     * to them
     */
    _connectToEventHubs() {
        const method = '_connectToEventHubs';
        LOG.entry(method);

        //TODO: To do this properly will require a fix from the node sdk, should work ok for now if CCP has a single channel defined.
        //we want the eventhubs for all peers in a channel that have the eventSource role
        //This will change with channel based event messages, so have to leave it like this for now.
        //basically even though we could get all the event hubs for a channel, you would receive all events
        //from those peers regardless of business network.
        this.eventHubs = this.client.getEventHubsForOrg();
        this.eventHubs.forEach((eventHub) => {
            eventHub.connect();
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

        LOG.debug(method, 'register exit listener for connector');

        this.exitListener = () => {
            this.eventHubs.forEach((eventHub, index) => {
                if (eventHub.isconnected()) {
                    eventHub.disconnect();
                }

                // unregister any eventhub chaincode event registrations
                if (this.ccEvents[index]) {
                    this.eventHubs[index].unregisterChaincodeEvent(this.ccEvents[index]);
                }
            });
        };

        process.on('exit', this.exitListener);

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
            throw new Error('identity not specified');
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
     * Install a business network connection.
     *
     * @param {any} securityContext the security context
     * @param {string} businessNetworkIdentifier the business network name
     * @param {object} installOptions any relevant install options
     * @returns {Promise} a promise for install completion
     */
    install(securityContext, businessNetworkIdentifier, installOptions) {
        const method = 'install';
        LOG.entry(method, securityContext, businessNetworkIdentifier, installOptions);

        if (!businessNetworkIdentifier) {
            throw new Error('businessNetworkIdentifier not specified');
        }

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
                // Also provide a default poolSize of 8 if not specified in install options.
                const poolSize = installOptions && installOptions.poolSize ? installOptions.poolSize * 1 : 8;
                let targetFilePath = path.resolve(tempDirectoryPath, 'src', chaincodePath, 'constants.go');
                let targetFileContents = `
                package main
                // The version for this chaincode.
                const version = "${runtimePackageJSON.version}"
                const PoolSize = ${poolSize}
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
                    chaincodeId: businessNetworkIdentifier,
                    txId: txId,
                    channelNames: this.channel.getName() // this will drive getting all the Peers to install on
                };

                return this.client.installChaincode(request);
            })
            .then((results) => {
                LOG.debug(method, `Received ${results.length} results(s) from installing the chaincode`, results);
                if (installOptions && installOptions.ignoreCCInstalled) {
                    this._validateResponses(results[0], false, /chaincode .+ exists/);
                    LOG.debug(method, 'chaincode installed, or already installed');
                } else {
                    this._validateResponses(results[0], false);
                    LOG.debug(method, 'chaincode installed');
                }
            })
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                const newError = new Error('Error trying install composer runtime. ' + error);
                LOG.error(method, newError);
                throw newError;
            });
    }

    /**
     * initialize the channel if it hasn't been done
     *
     * @returns {Promise} a promise that the channel is initialized
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
     * Instantiate the chaincode.
     *
     * @param {any} securityContext the security context
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {string} startTransaction The serialized start transaction.
     * @param {Object} startOptions connector specific installation options
     * @returns {Promise} a promise for instantiation completion
     */
    start(securityContext, businessNetworkIdentifier, startTransaction, startOptions) {
        const method = 'start';
        LOG.entry(method, securityContext, businessNetworkIdentifier, startTransaction, startOptions);

        if (!businessNetworkIdentifier) {
            throw new Error('businessNetworkIdentifier not specified');
        } else if (!startTransaction) {
            throw new Error('startTransaction not specified');
        }

        let finalTxId;
        let eventPromises;

        // initialize the channel ready for instantiation
        LOG.debug(method, 'loading the channel configuration');
        return this._initializeChannel()
            .then(() => {
                // prepare and send the instantiate proposal
                finalTxId = this.client.newTransactionID();

                const request = {
                    chaincodePath: chaincodePath,
                    chaincodeVersion: runtimePackageJSON.version,
                    chaincodeId: businessNetworkIdentifier,
                    txId: finalTxId,
                    fcn: 'init',
                    args: [startTransaction]
                };

                if (startOptions) {
                    // endorsementPolicy overrides endorsementPolicyFile
                    try {
                        if (startOptions.endorsementPolicy) {
                            request['endorsement-policy'] =
                                (typeof startOptions.endorsementPolicy === 'string') ? JSON.parse(startOptions.endorsementPolicy) : startOptions.endorsementPolicy;
                        } else if (startOptions.endorsementPolicyFile) {
                            // we don't check for existence so that the error handler will report the file not found
                            request['endorsement-policy'] = JSON.parse(fs.readFileSync(startOptions.endorsementPolicyFile));
                        }
                    } catch (error) {
                        const newError = new Error('Error trying parse endorsement policy. ' + error);
                        LOG.error(method, newError);
                        throw newError;
                    }
                }
                LOG.debug(method, 'sending instantiate proposal', request);
                return this.channel.sendInstantiateProposal(request);
            })
            .then((results) => {
                // Validate the instantiate proposal results
                LOG.debug(method, `Received ${results.length} results(s) from instantiating the composer runtime chaincode`, results);
                let proposalResponses = results[0];
                this._validateResponses(proposalResponses, true);

                // Submit the endorsed transaction to the primary orderer.
                const proposal = results[1];
                const header = results[2];

                eventPromises = this._prepareForCommit(finalTxId);
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
                    this._cancelCommitListeners(finalTxId);
                    throw new Error(`Failed to send peer responses for transaction '${finalTxId}' to orderer. Response status '${response.status}'`);
                }
                return Promise.all(eventPromises);

            })
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                const newError = new Error('Error trying to instantiate composer runtime. ' + error);
                LOG.error(method, newError);
                throw newError;
            });
    }

    /**
     * Deploy all business network artifacts.
     * @param {HLFSecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {string} deployTransaction The serialized deploy transaction.
     * @param {Object} deployOptions connector specific deployment options
     * @param {string} deployOptions.logLevel the level of logging for the composer runtime
     * @param {any} deployOptions.endorsementPolicy the endorsement policy (either a JSON string or Object) as defined by fabric node sdk
     * @param {String} deployOptions.endorsementPolicyFile the endorsement policy json file containing the endorsement policy
     * @return {Promise} A promise that is resolved once the business network
     * artifacts have been deployed, or rejected with an error.
     */
    deploy(securityContext, businessNetworkIdentifier, deployTransaction, deployOptions) {
        const method = 'deploy';
        LOG.entry(method, securityContext, businessNetworkIdentifier, deployTransaction, deployOptions);

        // Check that a valid security context has been specified.
        HLFUtil.securityCheck(securityContext);

        // Validate all the arguments.
        if (!businessNetworkIdentifier) {
            throw new Error('businessNetworkIdentifier not specified');
        } else if (!deployTransaction) {
            throw new Error('deployTransaction not specified');
        }

        LOG.debug(method, 'installing composer runtime chaincode');
        return this.install(securityContext, businessNetworkIdentifier, {ignoreCCInstalled: true})
            .then(() => {
                // check to see if the chaincode is already instantiated
                return this.channel.queryInstantiatedChaincodes();
            })
            .then((queryResults) => {
                LOG.debug(method, 'Queried instantiated chaincodes', queryResults);
                let alreadyInstantiated = queryResults.chaincodes.some((chaincode) => {
                    return chaincode.path === 'composer' && chaincode.name === businessNetworkIdentifier;
                });
                if (alreadyInstantiated) {
                    LOG.debug(method, 'chaincode already instantiated');
                    return Promise.resolve();
                }
                return this.start(securityContext, businessNetworkIdentifier, deployTransaction, deployOptions);
            })
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                const newError = new Error('Error trying deploy. ' + error);
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
                    // the node-sdk doesn't provide any external utilities from parsing the responseContent.
                    // there are internal ones which may do what is needed or we would have to decode the
                    // protobufs ourselves but it should really be the node sdk doing this.
                    LOG.warn('Response from peer was not valid');
                }
                if (responseContent.response.status !== 200) {
                    throw new Error('Unexpected response of ' + responseContent.response.status + '. payload was :' +responseContent.response.payload);
                }
            }

        });

        // if it was a proposal and all the responses were good, check that they compare
        // but we can't reject it as we don't know if it would pass the endorsement policy
        // and if we did this would allow a malicious peer to stop transactions so we
        // issue a warning so that it get's logged, but we don't know which peer it was
        if (isProposal && !this.channel.compareProposalResponseResults(responses)) {
            LOG.warn('Peers do not agree, Read Write sets differ');
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
                const newError = new Error('Error trying undeploy. ' + error);
                LOG.error(method, newError);
                throw newError;
            });
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
    queryChainCode(securityContext, functionName, args) {
        const method = 'queryChainCode';
        LOG.entry(method, functionName, args);

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

        // determine all the queryChaincode Peers in our organisation which are on the channel
        const channelPeersForOrg = this.client.getPeersForOrgOnChannel(this.channel.getName());
        const queryPeers = channelPeersForOrg.filter(peer => peer.isInRole('chaincodeQuery'));
        if (!queryPeers || queryPeers.length === 0) {
            throw new Error('No peers have been defined that can be chaincode queried');
        }

        let txId = this.client.newTransactionID();

        // Submit the query request.
        const request = {
            chaincodeId: this.businessNetworkIdentifier,
            chaincodeVersion: runtimePackageJSON.version,
            txId: txId,
            fcn: functionName,
            args: args,
            targets: [queryPeers[0]]  //TODO: maybe round robin or have some sort of failover default of node sdk is to send to all chaincodeQuery Peers
        };
        return this.channel.queryByChaincode(request)
            .then((payloads) => {
                LOG.debug(method, `Received ${payloads.length} payloads(s) from querying the composer runtime chaincode`, payloads);
                if (!payloads.length) {
                    throw new Error('No payloads were returned from the query request:' + functionName);
                }
                const payload = payloads[0];
                if (payload instanceof Error) {
                    // will be handled by the catch block
                    throw payload;
                }
                LOG.exit(method, payload);
                return payload;
            })
            .catch((error) => {
                const newError = new Error('Error trying to query business network. ' + error);
                LOG.error(method, newError);
                throw newError;
            });

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

        let txId;
        if (options && options.transactionId){
            txId = options.transactionId;
        } else {
            txId = this.client.newTransactionID();
        }
        let eventPromises;

        // initialize the channel if it hasn't been initialized already otherwise verification will fail.
        LOG.debug(method, 'loading channel configuration');
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
                return this.channel.sendTransactionProposal(request);  // node sdk will target all peers on the channel that are endorsingPeer
            })
            .then((results) => {
                // Validate the endorsement results.
                LOG.debug(method, `Received ${results.length} results(s) from invoking the composer runtime chaincode`, results);
                const proposalResponses = results[0];
                this._validateResponses(proposalResponses, true);

                // Submit the endorsed transaction to the primary orderers.
                const proposal = results[1];
                const header = results[2];

                eventPromises = this._prepareForCommit(txId);
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
                    this._cancelCommitListeners(txId);
                    throw new Error(`Failed to commit transaction '${txId}' with response status '${response.status}'`);
                }
                return Promise.all(eventPromises);
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
            throw new Error('userID not specified');
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
                // Don't think this is needed anymore
                //registerRequest.attrs.push({
                //    name: 'hf.Registrar.DelegateRoles',
                //    value: 'client'
                //});
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
     * Prepare to wait for events from the peers associated with the provided transaction id.
     * @private
     * @param {string} txObj the transaction id to listen for events on
     * @returns {Promise[]} An array of promises which resolve when the transaction has been
     * committed for each of the peers.
     */
    _prepareForCommit(txObj) {
        const txId = txObj.getTransactionID().toString();
        const method = '_prepareForCommit';
        LOG.entry(method, txId);
        let eventPromises = [];
        this.eventHubs.forEach((eh) => {
            let txPromise = new Promise((resolve, reject) => {
                const handle = setTimeout(() => {
                    reject(new Error(`Failed to receive commit notification for transaction '${txId}' within the timeout period`));
                }, this.commitTimeout);
                eh.registerTxEvent(txId, (tx, code) => {
                    clearTimeout(handle);
                    eh.unregisterTxEvent(txId);
                    if (code !== 'VALID') {
                        reject(new Error(`Peer has rejected transaction '${txId}' with code ${code}`));
                    } else {
                        resolve();
                    }
                });
            });
            eventPromises.push(txPromise);
        });
        return eventPromises;
    }

    /**
     * Cancel listening for transaction committed events.
     *
     * @param {any} txObj the transaction id that the eventhub is registered to listen for
     */
    _cancelCommitListeners(txObj) {
        const txId = txObj.getTransactionID().toString();
        this.eventHubs.forEach((eh) => {
            eh.unregisterTxEvent(txId);
        });
    }


    /**
     * return the logged in user
     * @returns {User} the logged in user
     */
    _getLoggedInUser() {
        return this.user;
    }

    /**
     * Upgrade runtime to a newer version
     * @param {any} securityContext security context
     * @param {string} businessNetworkIdentifier The identifier of the business network to upgrade
     * @return {Promise} A promise that is resolved when the runtime has been upgraded,
     * or rejected with an error.
     * @memberof HLFConnection
     */
    upgrade(securityContext) {
        const method = 'upgrade';
        LOG.entry(method, securityContext);

        if (!this.businessNetworkIdentifier) {
            throw new Error('businessNetworkIdentifier not specified on connection');
        }

        let txId;
        let eventPromises;
        // check runtime versions to ensure only the micro version has changed, not minor or major.
        return this._checkRuntimeVersions(securityContext)
            .then((results) => {
                if (!results.isCompatible) {
                    throw new Error(`New runtime version (${connectorPackageJSON.version}) compared to current (${results.response.version}) has changed major or minor version and cannot be upgraded.`);
                }
                return this._initializeChannel();
            })
            .then(() => {
                txId = this.client.newTransactionID();

                // Submit the upgrade proposal
                const request = {
                    chaincodePath: chaincodePath,
                    chaincodeVersion: runtimePackageJSON.version,
                    chaincodeId: this.businessNetworkIdentifier,
                    txId: txId,
                    fcn: 'upgrade'
                };

                return this.channel.sendUpgradeProposal(request);
            })
            .then((results) => {
                // Validate the instantiate proposal results
                LOG.debug(method, `Received ${results.length} results(s) from upgrading the chaincode`, results);
                let proposalResponses = results[0];
                this._validateResponses(proposalResponses, true);

                // Submit the endorsed transaction to the primary orderer.
                const proposal = results[1];
                const header = results[2];

                eventPromises = this._prepareForCommit(txId);
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
                    this._cancelCommitListeners(txId);
                    throw new Error(`Failed to send peer responses for transaction '${txId}' to orderer. Response status '${response.status}'`);
                }
                return Promise.all(eventPromises);

            })
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                const newError = new Error(`Error trying upgrade composer runtime for business network ${this.businessNetworkIdentifier}. ` + error);
                LOG.error(method, newError);
                throw newError;
            });
    }

   /**
     * Get a transaction id from the fabric client
     * @param {any} securityContext security context
     * @return {Promise} A promise that is resolved with a transaction id
     */
    createTransactionId(){
        // Check that a valid security context has been specified.
        let id = this.client.newTransactionID();
        return Promise.resolve({id:id,idStr:id.getTransactionID()});
    }

}

module.exports = HLFConnection;
