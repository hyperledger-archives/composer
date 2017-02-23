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
        debug('settings', JSON.stringify(this.settings));
        this.connecting = true;
        this.connected = false;
        this.connectionPromise = this.businessNetworkConnection
            .connect(this.settings.connectionProfileName,
                this.settings.businessNetworkIdentifier,
                this.settings.participantId,
                this.settings.participantPwd
            )
            .then((result) => {
                // setup some objects for this business network
                this.businessNetworkDefinition = result;
                this.serializer = this.businessNetworkDefinition.getSerializer();
                this.modelManager = this.businessNetworkDefinition.getModelManager();
                this.introspector = this.businessNetworkDefinition.getIntrospector();
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
                let modelClassDeclarations = this.introspector.getClassDeclarations();
                modelClassDeclarations
                    .forEach((modelClassDeclaration) => {
                        if (((modelClassDeclaration instanceof TransactionDeclaration) || (modelClassDeclaration instanceof AssetDeclaration) || (modelClassDeclaration instanceof ParticipantDeclaration)) && !modelClassDeclaration.isAbstract()) {
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
                let classDeclaration = this.introspector.getClassDeclaration(object);
                let visitor = new LoopbackVisitor();
                let schema = classDeclaration.accept(visitor, {
                    first : true,
                    modelFile : classDeclaration.getModelFile()
                });
                callback(null, schema);
            })
            .catch((error) => {
                debug('discoverSchemas', 'error thrown generating schema', error);
                callback(error);
            });
    }


    /**
     * Retrieves all the instances of objects in the Business Network.
     * @param {string} lbModelName The name of the model.
     * @param {string} filter The filter of which objects to get
     * @param {Object} options The options provided by Loopback.
     * @param {function} callback The callback to call when complete.
     */
    all(lbModelName, filter, options, callback) {
        debug('all', lbModelName, filter, options);
        let composerModelName = lbModelName.replace(/_/g, '.');
        let results = [];
        this.ensureConnected()
            .then(() => {
                this.getRegistryForModel(composerModelName, (error, registry) => {

                    // check for resolve include filter
                    let doResolve = this.isResolveSet(filter);
                    debug('doResolve', doResolve);
                    let filterKeys = Object.keys(filter);

                    if(filterKeys.indexOf('where') >= 0) {
                        debug('where', JSON.stringify(filter.where));
                        let whereKeys = Object.keys(filter.where);
                        debug('where keys', whereKeys);
                        let identifierField = this.getClassIdentifier(composerModelName);
                        debug('identifierField', identifierField);

                        // Check we have the right identifier for the object type
                        if(whereKeys.indexOf(identifierField) >= 0) {
                            let objectId = filter.where[identifierField];
                            if(doResolve) {
                                registry.resolve(objectId)
                                .then((result) => {
                                    debug('Got Result:', result);
                                    results.push(result);
                                    callback(null, results);
                                })
                                .catch((error) => {
                                    // check the error - it might be ok just an error indicating that the object doesn't exist
                                    debug('all: error ', error);
                                    if(error.toString().indexOf('does not exist') >= 0) {
                                        callback(null, {});
                                    } else {
                                        callback(error);
                                    }
                                });

                            } else {
                                registry.get(objectId)
                                .then((result) => {
                                    debug('Got Result:', result);
                                    results.push(this.serializer.toJSON(result));
                                    callback(null, results);
                                })
                                .catch((error) => {
                                    // check the error - it might be ok just an error indicating that the object doesn't exist
                                    debug('all: error ', error);
                                    if(error.toString().indexOf('does not exist') >= 0) {
                                        callback(null, {});
                                    } else {
                                        callback(error);
                                    }
                                });
                            }
                        } else {
                            callback('ERROR: the specified filter does not match the identifier in the model');
                        }
                    } else {
                        debug('no where filter');
                        if(doResolve) {
                            debug('About to resolve on all');
                            // get all unresolved objects
                            registry.resolveAll()
                                .then((result) => {
                                    debug('Got Result:', result);
                                    result.forEach((res) => {
                                        results.push(res);
                                    });
                                    callback(null, results);
                                })
                                .catch((error) => {
                                    callback(error);
                                });

                        } else {
                            // get all unresolved objects
                            debug('About to get all');
                            registry.getAll()
                                .then((result) => {
                                    debug('Got Result:', result);
                                    result.forEach((res) => {
                                        results.push(this.serializer.toJSON(res));
                                    });
                                    callback(null, results);
                                })
                                .catch((error) => {
                                    callback(error);
                                });
                        }
                    }
                });
            })
            .catch((error) => {
                //console.log('ERR: '+error);
                callback(error);
            });
    }

    /**
     * check if the filter contains an Include filter
     * @param {string} filter The filter of which objects to get
     * @return {boolean} true if there is an include that specifies to resolve
     */
    isResolveSet(filter) {
        debug('isResolveSet', filter);
        let filterKeys = Object.keys(filter);
        if(filterKeys.indexOf('include') >= 0) {
            if(filter.include === 'resolve') {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * Get the identifier for the given class
     * @param {string} modelName The fully qualified Composer name of the class.
     * @return {string} the identifier for this class
     */
    getClassIdentifier(modelName) {
        debug('getClassIdentifier', modelName);
        let classDeclaration = this.introspector.getClassDeclaration(modelName);
        return classDeclaration.getIdentifierFieldName();
    }


    /**
     * Check that the identifier provided matches that in the model.
     * @param {string} modelName The fully qualified Composer model name.
     * @param {id} id The filter to identify the asset or participant to be removed.
     * @return {boolean} true if the identifier is valid, false otherwise
     */
    isValidId(modelName, id) {
        debug('isValidId', modelName, id);
        let classDeclaration = this.introspector.getClassDeclaration(modelName);
        if(classDeclaration.getIdentifierFieldName() === id) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Retrieves all the instances of objects in IBM Concerto.
     * @param {string} modelName The name of the model.
     * @param {Object} callback The callback to call with the result.
     */
    getRegistryForModel(modelName, callback) {
        debug('all', modelName);
        let classDeclaration = this.modelManager.getType(modelName);
        if (classDeclaration instanceof AssetDeclaration) {
            this.businessNetworkConnection.getAssetRegistry(modelName)
                .then((assetRegistry) => {
                    callback(null, assetRegistry);
                });
        } else if (classDeclaration instanceof ParticipantDeclaration) {
            this.businessNetworkConnection.getParticipantRegistry(modelName)
                .then((participantRegistry) => {
                    callback(null, participantRegistry);
                });
        } else if (classDeclaration instanceof TransactionDeclaration) {
            this.businessNetworkConnection.getTransactionRegistry(modelName)
                .then((transactionRegistry) => {
                    callback(null, transactionRegistry);
                });
        } else {
            callback('Error: No registry for specified model name');
        }
    }

    /**
     * counts the number of instances of the specified object in the blockchain
     * @param {string} lbModelName The Loopback model name.
     * @param {string} where The LoopBack filter with the ID apply.
     * @param {Object} options The LoopBack options.
     * @param {function} callback The Callback to call when complete.
     */
    count(lbModelName, where, options, callback) {
        debug('count', lbModelName, where, options);
        let composerModelName = lbModelName.replace(/_/g, '.');
        //console.log('COUNT: '+composerModelName, arguments);
        this.ensureConnected()
        .then(() => {
            let idField = Object.keys(where)[0];
            if(this.isValidId(composerModelName, idField)) {
                // Just a basic existence check for now
                this.exists(composerModelName, where[idField], callback);
            } else {
                callback('ERROR: '+idField+' is not valid for asset '+composerModelName);
            }
        });
    }

    /**
     * Runs the callback with whether the object exists or not.
     * @param {string} composerModelName The composer model name.
     * @param {string} id The LoopBack filter with the ID apply.
     * @param {function} callback The Callback to call when complete.
     */
    exists(composerModelName, id, callback) {
        debug('exists', composerModelName, id);
        this.getRegistryForModel(composerModelName, (error, registry) => {
            registry.exists(id)
            .then((result) => {
                if(result === true) {
                    callback(null, 1);
                } else {
                    callback(null, 0);
                }
            })
            .catch((error) => {
                callback(error);
            });
        });
    }

    /**
     * Updates the properties of the specified object in the Business Network.
     * This function is called by the PATCH API.
     * @param {string} lbModelName The name of the model.
     * @param {string} objectId The id of the object to update
     * @param {Object} data The object data to use for modification
     * @param {Object} callback The object data to use for modification
     */
    updateAttributes(lbModelName, objectId, data, callback) {
        debug('updateAttributes', lbModelName, objectId, data);
        let composerModelName = lbModelName.replace(/_/g, '.');
        // If the $class property has not been provided, add it now.
        if (!data.$class) {
            data.$class = composerModelName;
        }

        this.ensureConnected()
            .then(() => {
                let resource = this.serializer.fromJSON(data);
                this.getRegistryForModel(composerModelName, (error, registry) => {
                    registry.update(resource)
                    .then(() => {
                        callback();
                    })
                    .catch((error) => {
                        callback(error);
                    });
                });
            })
            .catch((error) => {
                debug('create', 'error thrown doing update', error);
                callback(error);
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

                } else if (classDeclaration instanceof ParticipantDeclaration) {
                    this.businessNetworkConnection.getParticipantRegistry(classDeclaration.getFullyQualifiedName())
                        .then((participantRegistry) => {
                            return participantRegistry.add(resource);
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
                let modelManager = this.businessNetworkDefinition.getModelManager();
                let classDeclaration = modelManager.getType(modelName);

                if (classDeclaration instanceof AssetDeclaration) {
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
                } else if (classDeclaration instanceof ParticipantDeclaration) {
                    // For participants, we add the participant to its default participant registry.
                    this.businessNetworkConnection.getParticipantRegistry(modelName)
                        .then((participantRegistry) => {
                            return participantRegistry.get(id);
                        })
                        .then((result) => {
                            callback(null, result);
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
                debug('retrieve', 'error thrown doing retrieve', error);
                callback(error);
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
        debug('update', modelName, data, options);
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
                } else if (classDeclaration instanceof ParticipantDeclaration) {
                    // For participants, we add the participant to its default participant registry.
                    this.businessNetworkConnection.getParticipantRegistry(classDeclaration.getFullyQualifiedName())
                        .then((participantRegistry) => {
                            return participantRegistry.update(resource);
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
     * Destroy all instances of the specified objects in Concerto.
     * @param {string} lbModelName The fully qualified model name.
     * @param {string} where The filter to identify the asset or participant to be removed.
     * @param {Object} options The LoopBack options.
     * @param {function} callback The callback to call when complete.
     */
    destroyAll(lbModelName, where, options, callback) {
        debug('destroyAll', lbModelName, where, options);
        let composerModelName = lbModelName.replace(/_/g, '.');
        //console.log('DESTROY ALL: '+composerModelName, where, options, callback);
        this.ensureConnected()
            .then(() => {
                let idField = Object.keys(where)[0];
                if(this.isValidId(composerModelName, idField)) {
                    this.getRegistryForModel(composerModelName, (error, registry) => {
                        registry.get(where[idField])
                        .then((resourceToRemove) => {
                            registry.remove(resourceToRemove)
                            .then(() => {
                                callback();
                            })
                            .catch((error) => {
                                callback(error);
                            });
                        })
                        .catch((error) => {
                            callback(error);
                        });
                    });
                } else {
                    callback('ERROR: the specified filter does not match the identifier in the model');
                }
            });
    }
}

module.exports = BusinessNetworkConnector;
