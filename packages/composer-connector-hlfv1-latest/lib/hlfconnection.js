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
const Hfc = require('fabric-client');
const User = require('fabric-client/lib/User.js');
const utils = require('fabric-client/lib/utils.js');
const HLFConnectionManager = require('./HLFConnectionManager');

const LOG = Logger.getLog('HLFConnection');

const connectorPackageJSON = require('../package.json');
const runtimeModulePath = path.dirname(require.resolve('composer-runtime-hlfv1-latest'));
const runtimePackageJSON = require('composer-runtime-hlfv1-latest/package.json');

/**
 * Class representing a connection to a business network running on Hyperledger
 * Fabric, using the hfc module.
 * @protected
 */
class HLFConnection extends Connection {

    /**
     * try to generate a valid Ccid
     *
     * @static
     * @param {string} input the name used to define the CCid
     * @returns {string} a valid ccid
     *
     * @memberOf HLFConnection
     */
    static generateCcid(input) {
        return input.replace(/\./g, '-').replace(/[|&;$%@"<>()+,]/g, '');
    }

    /**
     * Create a new user.
     * @param {string} enrollmentID The enrollment ID.
     * @param {Client} client The client.
     * @return {User} A new user.
     */
    static createUser(enrollmentID, client) {
        return new User(enrollmentID, client);
    }

    /**
     * Constructor.
     * @param {ConnectionManager} connectionManager The owning connection manager.
     * @param {string} connectionProfile The name of the connection profile associated with this connection
     * @param {string} businessNetworkIdentifier The identifier of the business network for this connection,
     * or null if this connection if an admin connection
     * @param {object} connectOptions The connection options in use by this connection.
     * @param {Client} client A configured and connected {@link Client} object.
     * @param {Chain} chain A configured and connected {@link Chain} object.
     * @param {array} eventHubDefs An array of event hub definitions
     * @param {FabricCAClientImpl} caClient A configured and connected {@link FabricCAClientImpl} object.
     */
    constructor(connectionManager, connectionProfile, businessNetworkIdentifier, connectOptions, client, chain, eventHubDefs, caClient) {
        super(connectionManager, connectionProfile, businessNetworkIdentifier);
        const method = 'constructor';
        LOG.entry(method, connectionManager, connectionProfile, businessNetworkIdentifier, connectOptions, client, chain, eventHubDefs, caClient);

        // Validate all the arguments.
        if (!connectOptions) {
            throw new Error('connectOptions not specified');
        } else if (!client) {
            throw new Error('client not specified');
        } else if (!chain) {
            throw new Error('chain not specified');
        } else if (!eventHubDefs || !Array.isArray(eventHubDefs)) {
            throw new Error('eventHubDefs not specified or not an array');
        } else if (!caClient) {
            throw new Error('caClient not specified');
        }

        // Save all the arguments away for later.
        this.connectOptions = connectOptions;
        this.client = client;
        this.chain = chain;
        this.eventHubDefs = eventHubDefs;
        this.eventHubs = [];
        this.caClient = caClient;

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
                this.eventHubs.forEach((eventHub) => {
                    if (eventHub.isconnected()) {
                        eventHub.disconnect();
                    }
                });
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
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
                return this.chain.initialize();
            })
            .then(() => {
                LOG.exit(method, user);
                return user;
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
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
                this.eventHubDefs.forEach((eventHubDef) => {
                    const eventHub = HLFConnectionManager.createEventHub(this.client);
                    eventHub.setPeerAddr(eventHubDef.eventURL, eventHubDef.tlsOpts);
                    eventHub.connect();
                    this.eventHubs.push(eventHub);
                });

                process.on('exit', () => {
                    this.eventHubs.forEach((eventHub) => {
                        if (eventHub.isconnected()) {
                            eventHub.disconnect();
                        }
                    });
                });
                LOG.exit(method, result);
                return result;

            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
    }

    /**
     * Deploy all business network artifacts.
     * @param {HFCSecurityContext} securityContext The participant's security context.
     * @param {boolean} [force] Force the deployment of the business network artifacts.
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

        // The chaincode path is the portion of the GOPATH after 'src'.
        const chaincodePath = 'composer';

        // Because hfc needs to write a Dockerfile to the chaincode directory, we
        // must copy the chaincode to a temporary directory. We need to do this
        // to handle the case where Composer is installed into the global directory
        // (npm install -g) and is therefore owned by the root user.
        let tempDirectoryPath;
        let finalTxId;
        let nonce = utils.getNonce();
        let businessNetworkArchive;

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

                // If the connection options specify a certificate, write that to the file
                // system for the chaincode to use to communicate with the peer.
                if (this.connectOptions.certificate) {
                    let targetFilePath = path.resolve(tempDirectoryPath, 'src', chaincodePath, 'certificate.pem');
                    return this.fs.outputFile(targetFilePath, this.connectOptions.certificate);
                }

            })
            .then(() => {
                let txId = Hfc.buildTransactionID(nonce, this._getLoggedInUser());

                // This is evil! I shouldn't need to set GOPATH in a node.js program.
                process.env.GOPATH = tempDirectoryPath;

                // Submit the install proposal to the endorsers.
                const request = {
                    chaincodePath: chaincodePath,
                    chaincodeVersion: connectorPackageJSON.version,
                    chaincodeId: HLFConnection.generateCcid(businessNetwork.getName()),
                    //chainId: this.connectOptions.channel,
                    txId: txId,
                    nonce: nonce,
                    targets: this.chain.getPeers()
                };
                return this.client.installChaincode(request);
            })
            .then((results) => {
                LOG.debug(method, `Received ${results.length} results(s) from installing the chaincode`, results);

                // TODO: We should validate all responses, but ignore certain errors such as
                // package already exists.
//                [ { Error: Error installing chaincode code systest-participants:0.5.11(chaincode /var/hyperledger/production/chaincodes/systest-participants.0.5.11 exists)
//      at /home/vagrant/src/fabric-composer/packages/composer-connector-hlfv1/node_modules/grpc/src/node/src/client.js:434:17 code: 2, metadata: Metadata { _internal_repr: {} } },
//  { Error: Error installing chaincode code systest-participants:0.5.11(chaincode /var/hyperledger/production/chaincodes/systest-participants.0.5.11 exists)
//      at /home/vagrant/src/fabric-composer/packages/composer-connector-hlfv1/node_modules/grpc/src/node/src/client.js:434:17 code: 2, metadata: Metadata { _internal_repr: {} } } ]




                //this._validateResponses(results[0]);
                // initialize the chain ready for instantiation
                return this.chain.initialize();
            })
            .then(() => {
                // serialise the business network
                return businessNetwork.toArchive();
            })
            .then((bna) => {
                businessNetworkArchive = bna;
                nonce = utils.getNonce();
                // prepare and send the instantiate proposal
                finalTxId = Hfc.buildTransactionID(nonce, this._getLoggedInUser());
                const request = {
                    chaincodePath: chaincodePath,
                    chaincodeVersion: connectorPackageJSON.version,
                    chaincodeId: HLFConnection.generateCcid(businessNetwork.getName()),
                    chainId: this.connectOptions.channel,
                    txId: finalTxId,
                    nonce: nonce,
                    fcn: 'init',
                    args: [businessNetworkArchive.toString('base64')]
                };
                return this.chain.sendInstantiateProposal(request);
            })
            .then((results) => {
                // TODO: we should validate and verify all the results
                LOG.debug(method, `Received ${results.length} results(s) from deploying the chaincode`, results);
                let proposalResponses = results[0];
                this._validateResponses(proposalResponses);

                // Submit the endorsed transaction to the primary orderer.
                const proposal = results[1];
                const header = results[2];
                return this.chain.sendTransaction({
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
                return this._waitForEvents(finalTxId, this.connectOptions.deployWaitTime);

            })
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
            });
    }

    /**
     * Check for proposal response errors.
     * @private
     * @param {any} proposalResponses the proposal responses
     */
    _validateResponses(proposalResponses) {
        if (!proposalResponses.length) {
            throw new Error('No results were returned from the request');
        }

        proposalResponses.forEach((proposalResponse) => {
            if (proposalResponse instanceof Error) {
                throw proposalResponse;
            } else if (proposalResponse.response.status === 200) {
                return true;
            }
            throw new Error(proposalResponse.response.payload);
        });
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

        // Send an undeploy request which will disable the chaincode.
        // TODO: replace this with a proper undeploy of the chaincode once the functionality
        // is available, as that will shutdown and terminate the chaincode completely.
        return this.invokeChainCode(securityContext, 'undeploy', [businessNetworkIdentifier])
            .then(() => {
                LOG.exit(method);
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
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
                LOG.error(method, error);
                throw error;
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
                LOG.error(method, error);
                throw error;
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

        let nonce = utils.getNonce();
        let txId = Hfc.buildTransactionID(nonce, this._getLoggedInUser());

        // Submit the query request.
        const request = {
            chaincodeId: HLFConnection.generateCcid(this.businessNetworkIdentifier),
            chainId: this.connectOptions.channel,
            chaincodeVersion: connectorPackageJSON.version,
            txId: txId,
            nonce: nonce,
            fcn: functionName,
            args: args,
            attrs: ['userID']
        };
        return this.chain.queryByChaincode(request)
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
                LOG.error(method, error);
                throw error;
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

        let nonce = utils.getNonce();
        let txId = Hfc.buildTransactionID(nonce, this._getLoggedInUser());
        // Submit the transaction to the endorsers.
        const request = {
            chaincodeId: HLFConnection.generateCcid(this.businessNetworkIdentifier),
            chainId: this.connectOptions.channel,
            chaincodeVersion: connectorPackageJSON.version,
            txId: txId,
            nonce: nonce,
            fcn: functionName,
            args: args,
            attrs: ['userID']
        };
        return this.chain.sendTransactionProposal(request)
            .then((results) => {

                // Validate the endorsement results.
                LOG.debug(method, `Received ${results.length} results(s) from invoking the chaincode`, results);
                const proposalResponses = results[0];
                this._validateResponses(proposalResponses);

                // Submit the endorsed transaction to the primary orderer.
                const proposal = results[1];
                const header = results[2];

                return this.chain.sendTransaction({
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
                return this._waitForEvents(txId, this.connectOptions.invokeWaitTime);
            })
            .catch((error) => {
                LOG.error(method, error);
                throw error;
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

            // TODO: Not sure delegateRoles is used anymore
            if (options.issuer) {
                // Everyone we create can register clients.
                registerRequest.attrs.push({
                    name: 'hf.RegisterRoles',
                    value: 'client'
                });
                // Everyone we create can register clients that can register clients.
                registerRequest.attrs.push({
                    name: 'hf.RegisterDelegateRoles',
                    value: 'client'
                });
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
                    LOG.error(method, 'Register request failed', error);
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

        // We do not want to persist the list of business networks client side if possible.
        return Promise.reject(new Error('unimplemented function called'));

    }

    /**
     * wait for events from the peers associated with the provided transaction id.
     * @param {string} txId the transaction id to listen for events on
     * @param {number} waitTime the time to wait in seconds for an event response
     * @returns {Promise} A promise which resolves when all the events are received or rejected
     * if an event is not received within the given timeout period
     * @memberOf HLFConnection
     */
    _waitForEvents(txId, waitTime) {
        let eventPromises = [];
        this.eventHubs.forEach((eh) => {
            let txPromise = new Promise((resolve, reject) => {
                const handle = setTimeout(() => {
                    reject(new Error(`Failed to receive commit notification for transaction '${txId}' within the timeout period`));
                }, waitTime * 1000);
                eh.registerTxEvent(txId.toString(), (tx, code) => {
                    clearTimeout(handle);
                    eh.unregisterTxEvent(txId);
                    if (code !== 'VALID') {
                        reject(new Error(`Peer has rejected transaction '${txId}'`));
                    } else {
                        resolve();
                    }
                });
            });

            eventPromises.push(txPromise);
        });
        return Promise.all(eventPromises);
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
