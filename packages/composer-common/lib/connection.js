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

const ConnectionManager = require('./connectionmanager');
const EventEmitter = require('events');

const Util = require('./util.js');
const BusinessNetworkDefinition = require('./businessnetworkdefinition.js');
const uuid = require('uuid');

/**
 * Base class representing a connection to a business network.
 * @private
 * @abstract
 * @class
 * @memberof module:composer-common
 */
class Connection extends EventEmitter {

    /**
     * Constructor.
     * @param {ConnectionManager} connectionManager The owning connection manager.
     * @param {string} connectionProfile The name of the connection profile associated with this connection
     * @param {string} businessNetworkIdentifier The identifier of the business network for this connection, or null if an admin connection
     */
    constructor(connectionManager, connectionProfile, businessNetworkIdentifier) {
        super();
        if (!(connectionManager instanceof ConnectionManager)) {
            throw new Error('connectionManager not specified');
        } else if (!connectionProfile) {
            throw new Error('connectionProfile not specified');
        }
        this.connectionManager = connectionManager;
        this.connectionProfile = connectionProfile;
        this.businessNetworkIdentifier = businessNetworkIdentifier;
    }

    /**
     * Get the connection manager that owns this connection.
     * @return {ConnectionManager} The owning connection manager.
     */
    getConnectionManager() {
        return this.connectionManager;
    }

    /**
     * Returns a string that can be used to identify this connection.
     * @return {string} the identifier of this connection
     */
    getIdentifier() {
        if(this.businessNetworkIdentifier) {
            return this.businessNetworkIdentifier + '@' + this.connectionProfile;
        }
        else {
            return this.connectionProfile;
        }
    }

    /**
     * Terminate the connection to the business network.
     * @abstract
     * @return {Promise} A promise that is resolved once the connection has been
     * terminated, or rejected with an error.
     */
    disconnect() {
        return new Promise((resolve, reject) => {
            this._disconnect((error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback disconnectCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Terminate the connection to the business network.
     * @abstract
     * @param {disconnectCallback} callback The callback function to call when complete.
     */
    _disconnect(callback) {
        throw new Error('abstract function called');
    }

    /**
     * Login as a participant on the business network.
     * @abstract
     * @param {string} enrollmentID The enrollment ID of the participant.
     * @param {string} enrollmentSecret The enrollment secret of the participant.
     * @return {Promise} A promise that is resolved with a {@link SecurityContext}
     * object representing the logged in participant, or rejected with a login error.
     */
    login(enrollmentID, enrollmentSecret) {
        return new Promise((resolve, reject) => {
            this._login(enrollmentID, enrollmentSecret, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        });
    }

    /**
     * @callback loginCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {SecurityContext} result An object representing the logged in participant.
     */

    /**
     * Login as a participant on the business network.
     * @abstract
     * @param {string} enrollmentID The enrollment ID of the participant.
     * @param {string} enrollmentSecret The enrollment secret of the participant.
     * @param {loginCallback} callback The callback function to call when complete.
     */
    _login(enrollmentID, enrollmentSecret, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Install the Hyperledger Composer runtime.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {Object} installOptions connector specific installation options
     * @return {Promise} A promise that is resolved once the business network
     * artefacts have been installed, or rejected with an error.
     */
    install(securityContext, businessNetworkIdentifier, installOptions) {
        return new Promise((resolve, reject) => {
            this._install(securityContext, businessNetworkIdentifier, installOptions, (error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback installCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Install the Hyperledger Composer runtime.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {Object} installOptions connector specific installation options
     * @param {installCallback} callback The callback function to call when complete.
     */
    _install(securityContext, businessNetworkIdentifier, installOptions, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Start a business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {string} startTransaction The serialized start transaction.
     * @param {Object} startOptions connector specific installation options
     * @return {Promise} A promise that is resolved once the business network
     * artefacts have been installed, or rejected with an error.
     */
    start(securityContext, businessNetworkIdentifier, startTransaction, startOptions) {
        return new Promise((resolve, reject) => {
            this._start(securityContext, businessNetworkIdentifier, startTransaction, startOptions, (error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback startCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Start a business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {string} startTransaction The serialized start transaction.
     * @param {Object} startOptions connector specific statement options
     * @param {startCallback} callback The callback function to call when complete.
     */
    _start(securityContext, businessNetworkIdentifier, startTransaction, startOptions, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Deploy a business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {string} deployTransaction The serialized deploy transaction.
     * @param {Object} deployOptions connector specific deployment options
     * @return {Promise} A promise that is resolved once the business network
     * artefacts have been deployed, or rejected with an error.
     */
    deploy(securityContext, businessNetworkIdentifier, deployTransaction, deployOptions) {
        return new Promise((resolve, reject) => {
            this._deploy(securityContext, businessNetworkIdentifier, deployTransaction, deployOptions, (error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback deployCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Deploy a business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the Business network that will be started in this installed runtime
     * @param {string} deployTransaction The serialized deploy transaction.
     * @param {Object} deployOptions connector specific deployment options
     * @param {deployCallback} callback The callback function to call when complete.
     */
    _deploy(securityContext, businessNetworkIdentifier, deployTransaction, deployOptions, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Updates an existing deployed business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition The BusinessNetworkDefinition to deploy
     * @return {Promise} A promise that is resolved once the business network
     * artefacts have been updated, or rejected with an error.
     */
    update(securityContext, businessNetworkDefinition) {

        // create the new transaction to update the network
        if (!businessNetworkDefinition) {
            throw new Error('business network definition not specified');
        }
        let currentDeployedNetwork;

        return Util.queryChainCode(securityContext, 'getBusinessNetwork', [])
        .then((buffer) => {
            let businessNetworkJSON = JSON.parse(buffer.toString());
            let businessNetworkArchive = Buffer.from(businessNetworkJSON.data, 'base64');
            return BusinessNetworkDefinition.fromArchive(businessNetworkArchive);
        })
        .then((businessNetwork) => {
            currentDeployedNetwork = businessNetwork;
            // Serialize the business network.
            return businessNetworkDefinition.toArchive({ date: new Date(545184000000) });
        })
        .then((businessNetworkArchive) => {
            // Send an update request to the chaincode.
            // create the new system transaction to add the resources
            let transaction = currentDeployedNetwork.getFactory().newTransaction('org.hyperledger.composer.system','UpdateBusinessNetwork');
            let id = transaction.getIdentifier();
            if (id === null || id === undefined) {
                id = uuid.v4();
                transaction.setIdentifier(id);
            }
            let timestamp = transaction.timestamp;
            if (timestamp === null || timestamp === undefined) {
                timestamp = transaction.timestamp = new Date();
            }


            transaction.businessNetworkArchive =  businessNetworkArchive.toString('base64');
            let data = currentDeployedNetwork.getSerializer().toJSON(transaction);
            return Util.invokeChainCode(securityContext, 'submitTransaction', [JSON.stringify(data)]);
        });
    }

    /**
     * Resets an existing deployed business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {String} businessNetworkIdentifier The identifier of the business network
     * @return {Promise} A promise that is resolved once the business network
     * artefacts have been reset, or rejected with an error.
     */
    reset(securityContext, businessNetworkIdentifier) {

        let currentDeployedNetwork;
        return Promise.resolve()
        .then(()=>{
            // create the new transaction to update the network
            if (!businessNetworkIdentifier) {
                throw new Error('business network identifier not specified');
            }

            return Util.queryChainCode(securityContext, 'getBusinessNetwork', []);
        })
        .then((buffer) => {
            let businessNetworkJSON = JSON.parse(buffer.toString());
            let businessNetworkArchive = Buffer.from(businessNetworkJSON.data, 'base64');
            return BusinessNetworkDefinition.fromArchive(businessNetworkArchive);
        })
        .then((businessNetwork) => {
            currentDeployedNetwork = businessNetwork;
            // Send an update request to the chaincode.
            // create the new system transaction to add the resources

            if (currentDeployedNetwork.getName() !== businessNetworkIdentifier){
                throw new Error('Incorrect Business Network Identifier');
            }

            let transaction = currentDeployedNetwork.getFactory().newTransaction('org.hyperledger.composer.system','ResetBusinessNetwork');
            let id = transaction.getIdentifier();
            if (id === null || id === undefined) {
                id = uuid.v4();
                transaction.setIdentifier(id);
            }
            let timestamp = transaction.timestamp;
            if (timestamp === null || timestamp === undefined) {
                timestamp = transaction.timestamp = new Date();
            }
            let data = currentDeployedNetwork.getSerializer().toJSON(transaction);
            return Util.invokeChainCode(securityContext, 'submitTransaction', [JSON.stringify(data)]);
        });
    }

    /**
     * Resets an existing deployed business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {String} loglevel The new log level
     * @return {Promise} A promise that is resolved once the business network
     * logging level has been changed
     */
    setLogLevel(securityContext, loglevel) {
        let currentDeployedNetwork;
        return Promise.resolve()
        .then(()=>{
            // create the new transaction to update the network
            if (!loglevel) {
                throw new Error('Log Level not specified');
            }

            return Util.queryChainCode(securityContext, 'getBusinessNetwork', []);
        })
        .then((buffer) => {
            let businessNetworkJSON = JSON.parse(buffer.toString());
            let businessNetworkArchive = Buffer.from(businessNetworkJSON.data, 'base64');
            return BusinessNetworkDefinition.fromArchive(businessNetworkArchive);
        })
        .then((businessNetwork) => {
            currentDeployedNetwork = businessNetwork;

            let transaction = currentDeployedNetwork.getFactory().newTransaction('org.hyperledger.composer.system','SetLogLevel');
            let id = transaction.getIdentifier();
            if (id === null || id === undefined) {
                id = uuid.v4();
                transaction.setIdentifier(id);
            }
            let timestamp = transaction.timestamp;
            if (timestamp === null || timestamp === undefined) {
                timestamp = transaction.timestamp = new Date();
            }
            transaction.newLogLevel = loglevel;
            let data = currentDeployedNetwork.getSerializer().toJSON(transaction);
            return Util.invokeChainCode(securityContext, 'submitTransaction', [JSON.stringify(data)]);
        });
    }



    /**
     * Upgrade the Hyperledger Composer runtime.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved once the business network
     * runtime has been upgraded, or rejected with an error.
     */
    upgrade(securityContext) {
        return new Promise((resolve, reject) => {
            this._upgrade(securityContext, (error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback upgradeCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Upgrade the Hyperledger Composer runtime.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {upgradeCallback} callback The callback function to call when complete.
     */
    _upgrade(securityContext, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Undeploy a business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the business network to remove
     * @return {Promise} A promise that is resolved once the business network
     * artefacts have been undeployed, or rejected with an error.
     */
    undeploy(securityContext, businessNetworkIdentifier) {
        return new Promise((resolve, reject) => {
            this._undeploy(securityContext, businessNetworkIdentifier, (error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback undeployCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Undeploy a business network definition.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} businessNetworkIdentifier The identifier of the business network to remove
     * @param {undeployCallback} callback The callback function to call when complete.
     */
    _undeploy(securityContext, businessNetworkIdentifier, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Test ("ping") the connection to the business network.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that is resolved once the connection to the
     * business network has been tested, or rejected with an error.
     */
    ping(securityContext) {
        return new Promise((resolve, reject) => {
            this._ping(securityContext, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        });
    }

    /**
     * @callback pingCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {string} result The data returned by the chaincode function.
     */

    /**
     * Test ("ping") the connection to the business network.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {pingCallback} callback The callback function to call when complete.
     */
    _ping(securityContext, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Invoke a "query" chaincode function with the specified name and arguments.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that is resolved with the data returned by the
     * chaincode function once it has been invoked, or rejected with an error.
     */
    queryChainCode(securityContext, functionName, args) {
        return new Promise((resolve, reject) => {
            this._queryChainCode(securityContext, functionName, args, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        });
    }

    /**
     * @callback queryChainCodeCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {string} result The data returned by the chaincode function.
     */

    /**
     * Invoke a "query" chaincode function with the specified name and arguments.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @param {queryChainCodeCallback} callback The callback function to call when complete.
     */
    _queryChainCode(securityContext, functionName, args, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Invoke a "invoke" chaincode function with the specified name and arguments.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @param {Object} [options] Options for the invoking chaing code to use
     * @param {Object} [options.transactionId] Transaction Id to use.
     * @return {Promise} A promise that is resolved once the chaincode function
     * has been invoked, or rejected with an error.
     */
    invokeChainCode(securityContext, functionName, args, options) {
        return new Promise((resolve, reject) => {
            this._invokeChainCode(securityContext, functionName, args, options, (error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback invokeChainCodeCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Invoke a "invoke" chaincode function with the specified name and arguments.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} functionName The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @param {Object} [options] options for the invoking chain code
     * @param {Object} [options.transactionId] Transaction Id to use.
     * @param {invokeChainCodeCallback} callback The callback function to call when complete.
     */
    _invokeChainCode(securityContext, functionName, args, options, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Create a new identity for the specified user ID.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} userID The user ID.
     * @param {object} [options] Options for the new identity.
     * @param {boolean} [options.issuer] Whether or not the new identity should have
     * permissions to create additional new identities. False by default.
     * @param {string} [options.affiliation] Specify the affiliation for the new
     * identity. Defaults to 'institution_a'.
     * @return {Promise} A promise that is resolved with a generated user
     * secret once the new identity has been created, or rejected with an error.
     */
    createIdentity(securityContext, userID, options) {
        return new Promise((resolve, reject) => {
            this._createIdentity(securityContext, userID, options, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        });
    }

    /**
     * @callback createIdentityCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {string[]} result A generated user secret.
     */

    /**
     * Create a new identity for the specified user ID.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} userID The user ID.
     * @param {object} [options] Options for the new identity.
     * @param {boolean} [options.issuer] Whether or not the new identity should have
     * permissions to create additional new identities. False by default.
     * @param {string} [options.affiliation] Specify the affiliation for the new
     * identity. Defaults to 'institution_a'.
     * @param {createIdentityCallback} callback The callback function to call when complete.
     */
    _createIdentity(securityContext, userID, options, callback) {
        throw new Error('abstract function called');
    }

    /**
     * List all of the deployed business networks. The connection must
     * be connected for this method to succeed.
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that will be resolved with an array of
     * business network identifiers, or rejected with an error.
     */
    list(securityContext) {
        return new Promise((resolve, reject) => {
            this._list(securityContext, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        });
    }

    /**
     * @callback listCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {string[]} result An array of business network identifiers.
     */

    /**
     * List all of the deployed business networks. The connection must
     * be connected for this method to succeed.
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {listCallback} callback The callback function to call when complete.
     */
    _list(securityContext, callback) {
        throw new Error('abstract function called');
    }


    /**
     * Create a Transaction Id
     * @param {SecurityContext} securityContext The participant's security context.
     * @return {Promise} A promise that will be resolved with a representation of the id
     */
    createTransactionId(securityContext) {
        return new Promise((resolve, reject) => {
            this._createTransactionId(securityContext, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        });
    }

    /**
     * @callback transactionIdCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {string} result Transaction id.
     */

    /**
     * Create a transaction id
     * @abstract
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {listCallback} callback The callback function to call when complete.
     */
    _createTransactionId(securityContext, callback) {
        throw new Error('abstract function called');
    }

}

module.exports = Connection;
