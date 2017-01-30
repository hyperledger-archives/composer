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

const AssetDeclaration = require('composer-common').AssetDeclaration;
const ParticipantDeclaration = require('composer-common').ParticipantDeclaration;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const Connector = require('loopback-connector').Connector;
const debug = require('debug')('loopback:connector:businessnetworkconnector');
const LoopbackVisitor = require('composer-common/lib/codegen/fromcto/loopback/loopbackvisitor');
const TransactionDeclaration = require('composer-common/lib/introspect/transactiondeclaration');

/**
 * A Loopback connector for exposing the Blockchain Solution Framework to Loopback enabled applications.
 */
class BusinessNetworkConnector extends Connector {

    /**
     * Constructor.
     * @param {Object} settings the settings used by the call to BusinessNetworkConnection
     */
    constructor (settings) {
        debug('constructor');
        super('businessnetworkconnector', settings);
        this.settings = settings;
        this.businessNetworkConnection = new BusinessNetworkConnection();
        this.connected = this.connecting = false;
    }

    /**
     * Ensure that the connector has connected to Composer.
     * @return {Promise} A promise that is resolved when the connector has connected.
     */
    ensureConnected () {
        debug('ensureConnected');
        if (this.connected) {
            return Promise.resolve();
        } else if (this.connecting) {
            return this.connectionPromise;
        } else {
            return this.connect();
        }
    }

    /**
     * Connect to the Business Network
     * @param {function} callback the callback to call when complete.
     * @return {Promise} A promise that is resolved when the connector has connected.
     */
    connect (callback) {
        debug('connect', callback);
        this.connecting = true;
        this.connected = false;
        this.connectionPromise = this.businessNetworkConnection
            .connect(this.settings.connectionProfileName,
                this.settings.businessNetworkIdentifier,
                this.settings.participantId,
                this.settings.participantPwd
            )
            .then((result) => {
                this.businessNetworkDefinition = result;
            })
            .then(() => {
                this.connected = true;
                this.connecting = false;
                if (callback) {
                    callback();
                }
            })
            .catch((error) => {
                this.connected = this.connecting = false;
                if (callback) {
                    callback(error);
                }
                throw error;
            });
        return this.connectionPromise;
    }

    /**
     * Test the connection to Composer.
     * @param {function} callback the callback to call when complete.
     */
    ping (callback) {
        debug('ping');
        this.businessNetworkConnection
            .ping()
            .then(() => {
                callback();
            })
            .catch((error) => {
                callback(error);
            });
    }

    /**
     * Disconnect from the Business Network.
     * @param {function} callback the callback to call when complete.
     */
    disconnect (callback) {
        debug('disconnect');
        this.businessNetworkConnection
            .disconnect()
            .then(() => {
                this.connected = this.connecting = false;
                callback();
            })
            .catch((error) => {
                this.connected = this.connecting = false;
                callback(error);
            });
    }

    /**
     * Retrieve the list of all available model names, or the model names in a
     * specified namespace.
     * @param {Object} options the options provided by Loopback.
     * @param {function} callback the callback to call when complete.
     */
    discoverModelDefinitions (options, callback) {
        debug('discoverClassDeclarations', options);
        this.ensureConnected()
            .then(() => {
                let models = [];
                let modelClassDeclarations = this.businessNetworkDefinition.getIntrospector().getClassDeclarations();
                modelClassDeclarations
                    .forEach((modelClassDeclaration) => {
                        if (((modelClassDeclaration instanceof AssetDeclaration) || (modelClassDeclaration instanceof ParticipantDeclaration)) && !modelClassDeclaration.isAbstract()) {
                            models.push({
                                type : 'table',
                                name : modelClassDeclaration.getFullyQualifiedName()
                            });
                        }
                    });

                debug('discoverModelDefinitions', 'returning list of model class declarations', models);
                callback(null, models);
            })
            .catch((error) => {
                debug('discoverModelDefinitions', 'error thrown discovering list of model class declarations', error);
                callback(error);
            });
    }

    /**
     * Retrieve the model definition for the specified model name.
     * @param {string} object The name of the model.
     * @param {Object} options The options provided by Loopback.
     * @param {function} callback The callback to call when complete.
     */
    discoverSchemas (object, options, callback) {
        debug('discoverSchemas', object, options);
        this.ensureConnected()
            .then(() => {
                let introspector = this.businessNetworkDefinition.getIntrospector();
                let classDeclaration = introspector.getClassDeclaration(object);
                let visitor = new LoopbackVisitor();
                let schema = classDeclaration.accept(visitor, { first: true, modelFile: classDeclaration.getModelFile() });
                callback(null, schema);
            })
            .catch((error) => {
                debug('discoverSchemas', 'error thrown generating schema', error);
                callback(error);
            });
    }

    /**
     * Retrieves all the instances of objects in Composer.
     * @param {string} modelName The name of the model.
     * @param {Object} options The options provided by Loopback.
     * @param {function} callback The callback to call when complete.

     */
    all(modelName, options, callback) {
        debug('all', modelName, options, callback);
        let model = modelName.replace(/_/g, '.');
        let results = [];
        this.ensureConnected()
            .then(() => {
                let serializer = this.businessNetworkConnection.getBusinessNetwork().getSerializer();
                this.businessNetworkConnection.getAssetRegistry(model)
                    .then((assetRegistry) => {
                        assetRegistry.getAll()
                            .then((result) => {
                                result.forEach((res) => {
                                    results.push(serializer.toJSON(res));
                                });
                                callback(null, results);
                            });
                    })
                    .catch((error) => {
                        console.log('ERR: '+error);
                        callback(error);
                    });
            });

    }
    /**
     * Create an instance of an object in Composer. For assets, this method
     * adds the asset to the default asset registry. For transactions, this method
     * submits the transaction for execution.
     * @param {string} modelName the fully qualified model name.
     * @param {Object} data the data for the asset or transaction.
     * @param {Object} options the options provided by Loopback.
     * @param {function} callback the callback to call when complete.
     */
    create (modelName, data, options, callback) {
        debug('create', modelName, data, options);

        // If the $class property has not been provided, add it now.
        if (!data.$class) {
            // Loopback doesn't like dots in the model names so the loopback bootscript needs to change them to underscores
            // when it creates the schemas. (see <loopbackapp>/server/boot/composer.js sample)
            // So we need to change the underscores back to dots here for the composer API.
            data.$class = modelName.replace(/_/g, '.');
        }

        this.ensureConnected()
            .then(() => {
                // Convert the JSON data into a resource.
                let serializer = this.businessNetworkDefinition.getSerializer();
                let resource = serializer.fromJSON(data);

                // The create action is based on the type of the resource.
                let classDeclaration = resource.getClassDeclaration();
                if (classDeclaration instanceof AssetDeclaration) {
                    // For assets, we add the asset to its default asset registry
                    this.businessNetworkConnection.getAssetRegistry(classDeclaration.getFullyQualifiedName())
                        .then((assetRegistry) => {
                            return assetRegistry.add(resource);
                        })
                        .then(() => {
                            callback();
                        })
                        .catch((error) => {
                            callback(error);
                        });

                } else if (classDeclaration instanceof TransactionDeclaration) {
                    // For transactions, we submit the transaction for execution.
                    this.businessNetworkConnection.submitTransaction(resource)
                        .then(() => {
                            callback();
                        })
                        .catch((error) => {
                            callback(error);
                        });

                } else {
                    // For everything else, we blow up!
                    throw new Error(`Unable to handle resource of type: ${typeof classDeclaration}`);
                }
            })
            .catch((error) => {
                debug('create', 'error thrown doing create', error);
                callback(error);
            });
    }

    /**
     * Get an instance of an object in Composer. For assets, this method
     * gets the asset from the default asset registry.
     * @param {string} modelName the fully qualified model name.
     * @param {string} id the identifier of the asset or participant to retrieve.
     * @param {Object} options the options provided by Loopback.
     * @param {function} callback the callback to call when complete.
     */
    retrieve (modelName, id, options, callback) {
        debug('retrieve', modelName, id, options);

        this.ensureConnected()
            .then(() => {
                // For assets, we add the asset to its default asset registry.
                this.businessNetworkConnection.getAssetRegistry(modelName)
                    .then((assetRegistry) => {
                        return assetRegistry.get(id);
                    })
                    .then((result) => {
                        callback(null, result);
                    })
                    .catch((error) => {
                        callback(error);
                    });

            });
    }

    /**
     * Update an instance of an object in Composer. For assets, this method
     * updates the asset to the default asset registry.
     * @param {string} modelName the fully qualified model name.
     * @param {Object} data the data for the asset or transaction.
     * @param {Object} options the options provided by Loopback.
     * @param {function} callback the callback to call when complete.
     */
    update (modelName, data, options, callback) {
        debug('create', modelName, data, options);
        console.log('Update', modelName, data, options);
        // If the $class property has not been provided, add it now.
        if (!data.$class) {
            data.$class = modelName.replace(/_/g, '.');
        }

        this.ensureConnected()
            .then(() => {
                // Convert the JSON data into a resource.
                let serializer = this.businessNetworkDefinition.getSerializer();
                let resource = serializer.fromJSON(data);

                // The create action is based on the type of the resource.
                let classDeclaration = resource.getClassDeclaration();
                if (classDeclaration instanceof AssetDeclaration) {
                    // For assets, we add the asset to its default asset registry.
                    this.businessNetworkConnection.getAssetRegistry(classDeclaration.getFullyQualifiedName())
                        .then((assetRegistry) => {
                            return assetRegistry.update(resource);
                        })
                        .then(() => {
                            callback();
                        })
                        .catch((error) => {
                            callback(error);
                        });
                } else {
                    // For everything else, we blow up!
                    throw new Error(`Unable to handle resource of type: ${typeof classDeclaration}`);
                }
            })
            .catch((error) => {
                debug('create', 'error thrown doing update', error);
                callback(error);
            });
    }

    /**
     * Delete an instance of an object in Composer. For assets, this method
     * updates the asset to the default asset registry.
     * @param {string} modelName the fully qualified model name.
     * @param {Object} id the identifier of the asset or participant to be removed.
     * @param {Object} options the options provided by Loopback.
     * @param {function} callback the callback to call when complete.
     */
    delete (modelName, id, options, callback) {
        debug('delete', modelName, id, options);

        this.ensureConnected()
            .then(() => {
                // Delete the object
                this.businessNetworkConnection.getAssetRegistry(modelName)
                    .then((assetRegistry) => {
                        return assetRegistry.remove(id);
                    })
                    .then(() => {
                        callback();
                    })
                    .catch((error) => {
                        callback(error);
                    });
            });
    }
}
module.exports = BusinessNetworkConnector;
