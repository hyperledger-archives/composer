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
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const ConceptDeclaration = require('composer-common').ConceptDeclaration;
const Connector = require('loopback-connector').Connector;
const crypto = require('crypto');
const debug = require('debug')('loopback:connector:composer');
const LoopbackVisitor = require('composer-common').LoopbackVisitor;
const NodeCache = require( 'node-cache' );
const ParticipantDeclaration = require('composer-common').ParticipantDeclaration;
const TransactionDeclaration = require('composer-common').TransactionDeclaration;

const util = require('util');

class BusinessNetworkConnectionWrapper {

    /**
     * Constructor.
     * @param {Object} settings the settings used by the call to BusinessNetworkConnection
     */
    constructor(settings) {
        debug('BusinessNetworkConnectionWrapper ctor');

        // Check for required properties.
        if (!settings.connectionProfileName) {
            throw new Error('connectionProfileName not specified');
        } else if (!settings.businessNetworkIdentifier) {
            throw new Error('businessNetworkIdentifier not specified');
        } else if (!settings.participantId) {
            throw new Error('participantId not specified');
        } else if (!settings.participantPwd) {
            throw new Error('participantPwd not specified');
        }
        this.settings = settings;
        this.additionalConnectOptions = {};
        if (settings.wallet) {
            this.additionalConnectOptions.wallet = settings.wallet;
        }

        // Create the new disconnected business network connection.
        this.businessNetworkConnection = new BusinessNetworkConnection();
        this.connected = this.connecting = false;
        this.connectionPromise = null;

    }

    /**
     * Ensure that the connector has connected to Composer.
     * @return {Promise} A promise that is resolved with a {@link BusinessNetworkConnection}
     * when the connector has connected, or rejected with an error.
     */
    ensureConnected() {
        debug('ensureConnected', this.connected, this.connecting);
        if (this.connected) {
            return Promise.resolve(this.businessNetworkConnection);
        } else if (this.connecting) {
            return this.connectionPromise;
        } else {
            return this.connect();
        }
    }

    /**
     * Connect to the Business Network
     * @return {Promise} A promise that is resolved when the connector has connected.
     */
    connect() {
        debug('connect');
        debug('settings', JSON.stringify(this.settings));
        this.connecting = true;
        this.connected = false;
        this.connectionPromise = this.businessNetworkConnection.connect(
                this.settings.connectionProfileName,
                this.settings.businessNetworkIdentifier,
                this.settings.participantId,
                this.settings.participantPwd,
                this.additionalConnectOptions
            )
            .then((result) => {
                // setup some objects for this business network
                debug('here after connect');
                this.businessNetworkDefinition = result;
                this.serializer = this.businessNetworkDefinition.getSerializer();
                this.modelManager = this.businessNetworkDefinition.getModelManager();
                this.introspector = this.businessNetworkDefinition.getIntrospector();
                debug('here after connect #2');
            })
            .then(() => {
                debug('here after connect #3');
                this.connected = true;
                this.connecting = false;
                debug('here after connect #4');
                return this.businessNetworkConnection;
            })
            .catch((error) => {
                debug('here after connect #5', error);
                this.connected = this.connecting = false;
                throw error;
            });
        return this.connectionPromise;
    }

    /**
     * Disconnect from the Business Network.
     */
    disconnect () {
        debug('disconnect');
        return this.businessNetworkConnection.disconnect()
            .then(() => {
                this.connected = this.connecting = false;
            })
            .catch((error) => {
                this.connected = this.connecting = false;
                throw error;
            });
    }

    ping() {
        return this.businessNetworkConnection.ping();
    }

    getBusinessNetworkDefinition() {
        return this.businessNetworkDefinition;
    }

    getSerializer() {
        return this.serializer;
    }

    getModelManager() {
        return this.modelManager;
    }

    getIntrospector() {
        return this.introspector;
    }

    isConnected() {
        return this.connected;
    }

    isConnecting() {
        return this.connecting;
    }

}

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
        super('composer', settings);

        // Check for required properties.
        if (!settings.connectionProfileName) {
            throw new Error('connectionProfileName not specified');
        } else if (!settings.businessNetworkIdentifier) {
            throw new Error('businessNetworkIdentifier not specified');
        } else if (!settings.participantId) {
            throw new Error('participantId not specified');
        } else if (!settings.participantPwd) {
            throw new Error('participantPwd not specified');
        }

        // Assign defaults for any optional properties.
        this.settings = Object.assign({
            namespaces: 'always', // Default is namespaces always enabled.
            multiuser: false      // Default is single user mode.
        }, settings);

        // Create a new visitor for generating LoopBack models.
        this.visitor = new LoopbackVisitor(this.settings.namespaces === 'always');

        // Create the cache.
        this.connectionWrappers = new NodeCache({
            stdTTL: 5 * 60,
            useClones: false
        });
        this.connectionWrappers.on('del', (key, value) => {
            return value.disconnect()
                .catch((error) => {
                    console.error(error);
                });
        });
        this.defaultConnectionWrapper = new BusinessNetworkConnectionWrapper(settings);

    }

    /**
     * Ensure that the connector has connected to Composer.
     * @param {Object} options The options from LoopBack.
     */
    getConnectionWrapper(options) {
        if (options && options.accessToken) {
            if (!options.enrollmentID || !options.enrollmentSecret) {
                throw new Error('No enrollment ID or enrollment secret has been provided');
            }
            const key = crypto.createHmac('sha256', 'such secret')
                .update(options.accessToken.id)
                .update(options.enrollmentID)
                .update(options.enrollmentSecret)
                .digest('hex');
            let connectionWrapper = this.connectionWrappers.get(key);
            if (!connectionWrapper) {
                console.log('Creating new connection wrapper for key', key);
                const settings = Object.assign(this.settings, {
                    participantId: options.enrollmentID,
                    participantPwd: options.enrollmentSecret,
                    wallet: options.wallet
                });
                connectionWrapper = new BusinessNetworkConnectionWrapper(settings);
                this.connectionWrappers.set(key, connectionWrapper);
            }
            return connectionWrapper;
        } else {
            return this.defaultConnectionWrapper;
        }
    }

    /**
     * Ensure that the connector has connected to Composer.
     * @param {Object} options The options from LoopBack.
     * @return {Promise} A promise that is resolved with a {@link BusinessNetworkConnection}
     * when the connector has connected, or rejected with an error.
     */
    ensureConnected (options) {
        debug('ensureConnected');
        return this.getConnectionWrapper(options).ensureConnected();
    }

    /**
     * Connect to the Business Network
     * @param {function} callback the callback to call when complete.
     */
    connect (callback) {
        debug('connect');
        const connectionWrapper = this.getConnectionWrapper(null);
        connectionWrapper.connect()
            .then(() => {
                this.businessNetworkDefinition = connectionWrapper.getBusinessNetworkDefinition();
                this.serializer = connectionWrapper.getSerializer();
                this.modelManager = connectionWrapper.getModelManager();
                this.introspector = connectionWrapper.getIntrospector();
                if (callback) {
                    callback();
                }
            })
            .catch((error) => {
                if (callback) {
                    callback(error);
                }
            });
    }

    /**
     * Test the connection to Composer.
     * @param {function} callback the callback to call when complete.
     */
    ping (callback) {
        debug('ping');
        this.getConnectionWrapper().ping()
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
        this.getConnectionWrapper().disconnect()
            .then(() => {
                callback();
            })
            .catch((error) => {
                callback(error);
            });
    }

    /**
     * Get the Composer model name for the specified LoopBack model name.
     * @param {String} lbModelName The LoopBack model name.
     * @return {String} The Composer model name.
     */
    getComposerModelName(lbModelName) {
        debug('getComposerModelName', lbModelName);
        if (this.getModelDefinition(lbModelName)) {
            let settings = this.getConnectorSpecificSettings(lbModelName);
            return settings.fqn || lbModelName;
        } else {
            return lbModelName;
        }
    }

    /**
     * Get the registry that stores the resources of the specified model type.
     * @param {BusinessNetworkConnection} businessNetworkConnection the business network connection to use.
     * @param {string} modelName The name of the model.
     * @return {Promise} A promise that will be resolved with the {@link Registry},
     * or rejected with an error.
     */
    getRegistryForModel(businessNetworkConnection, modelName) {
        debug('getRegistryForModel', modelName);
        let classDeclaration = this.modelManager.getType(modelName);
        if (classDeclaration instanceof AssetDeclaration) {
            return businessNetworkConnection.getAssetRegistry(modelName);
        } else if (classDeclaration instanceof ParticipantDeclaration) {
            return businessNetworkConnection.getParticipantRegistry(modelName);
        } else {
            return Promise.reject(new Error('No registry for specified model name'));
        }
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
        let composerModelName = this.getComposerModelName(lbModelName);

        this.ensureConnected(options)
            .then((businessNetworkConnection) => {
                return this.getRegistryForModel(businessNetworkConnection, composerModelName);
            })
            .then((registry) => {

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
                            return registry.resolve(objectId)
                                .then((result) => {
                                    debug('Got Result:', result);
                                    return [ result ];
                                })
                                .catch((error) => {
                                    // check the error - it might be ok just an error indicating that the object doesn't exist
                                    debug('all: error ', error);
                                    if(error.toString().indexOf('does not exist') >= 0) {
                                        return {};
                                    } else {
                                        throw error;
                                    }
                                });

                        } else {
                            return registry.get(objectId)
                                .then((result) => {
                                    debug('Got Result:', result);
                                    return [ this.serializer.toJSON(result) ];
                                })
                                .catch((error) => {
                                    // check the error - it might be ok just an error indicating that the object doesn't exist
                                    debug('all: error ', error);
                                    if(error.toString().indexOf('does not exist') >= 0) {
                                        return {};
                                    } else {
                                        throw error;
                                    }
                                });
                        }
                    } else {
                        throw new Error('The specified filter does not match the identifier in the model');
                    }
                } else if(doResolve) {
                    debug('no where filter, about to resolve on all');
                    // get all unresolved objects
                    return registry.resolveAll()
                        .then((result) => {
                            debug('Got Result:', result);
                            return result;
                        });

                } else {
                    // get all unresolved objects
                    debug('no where filter, about to get all');
                    return registry.getAll()
                        .then((result) => {
                            debug('Got Result:', result);
                            return result.map((res) => {
                                return this.serializer.toJSON(res);
                            });
                        });
                }
            })
            .then((result) => {
                callback(null, result);
            })
            .catch((error) => {
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
     * counts the number of instances of the specified object in the blockchain
     * @param {string} lbModelName The Loopback model name.
     * @param {string} where The LoopBack filter with the ID apply.
     * @param {Object} options The LoopBack options.
     * @param {function} callback The Callback to call when complete.
     */
    count(lbModelName, where, options, callback) {
        debug('count', lbModelName, where, options);
        let composerModelName = this.getComposerModelName(lbModelName);

        this.ensureConnected(options)
            .then((businessNetworkConnection) => {
                let idField = Object.keys(where)[0];
                if(this.isValidId(composerModelName, idField)) {
                    // Just a basic existence check for now
                    this.exists(lbModelName, where[idField], options, (error, result) => {
                        callback(null, result ? 1 : 0);
                    });
                } else {
                    callback(new Error(idField+' is not valid for asset '+composerModelName));
                }
            });
    }

    /**
     * Runs the callback with whether the object exists or not.
     * @param {string} lbModelName The composer model name.
     * @param {string} id The LoopBack filter with the ID apply.
     * @param {Object} options The LoopBack options.
     * @param {function} callback The Callback to call when complete.
     */
    exists(lbModelName, id, options, callback) {
        debug('exists', lbModelName, id);
        let composerModelName = this.getComposerModelName(lbModelName);

        this.ensureConnected(options)
            .then((businessNetworkConnection) => {
                return this.getRegistryForModel(businessNetworkConnection, composerModelName);
            })
            .then((registry) => {
                return registry.exists(id);
            })
            .then((result) => {
                callback(null, result);
            })
            .catch((error) => {
                debug('exists', 'error thrown doing exists', error);
                callback(error);
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
    updateAttributes(lbModelName, objectId, data, options, callback) {
        debug('updateAttributes', lbModelName, objectId, data);
        let composerModelName = this.getComposerModelName(lbModelName);

        // If the $class property has not been provided, add it now.
        if (!data.$class) {
            data.$class = composerModelName;
        }

        let resource;
        this.ensureConnected(options)
            .then((businessNetworkConnection) => {
                resource = this.serializer.fromJSON(data);
                return this.getRegistryForModel(businessNetworkConnection, composerModelName);
            })
            .then((registry) => {
                return registry.update(resource);
            })
            .then(() => {
                callback();
            })
            .catch((error) => {
                debug('updateAttributes', 'error thrown doing update', error);
                callback(error);
            });

    }

    /**
     * Updates the properties of the specified object in the Business Network.
     * This function is called by the PUT API.
     * @param {string} lbModelName The name of the model.
     * @param {string} objectId The id of the object to update
     * @param {Object} data The object data to use for modification
     * @param {Object} options the options provided by Loopback.
     * @param {Object} callback The object data to use for modification
     */
    replaceById(lbModelName, objectId, data, options, callback) {
        debug('replaceById', lbModelName, objectId, data, options);
        let composerModelName = this.getComposerModelName(lbModelName);

        // If the $class property has not been provided, add it now.
        if (!data.$class) {
            data.$class = composerModelName;
        }

        let resource;
        this.ensureConnected(options)
            .then((businessNetworkConnection) => {
                resource = this.serializer.fromJSON(data);
                return this.getRegistryForModel(businessNetworkConnection, composerModelName);
            })
            .then((registry) => {
                return registry.update(resource);
            })
            .then(() => {
                callback();
            })
            .catch((error) => {
                debug('replaceById', 'error thrown doing update', error);
                callback(error);
            });

    }

    /**
     * Create an instance of an object in Composer. For assets, this method
     * adds the asset to the default asset registry. For transactions, this method
     * submits the transaction for execution.
     * @param {string} lbModelName the fully qualified model name.
     * @param {Object} data the data for the asset or transaction.
     * @param {Object} options the options provided by Loopback.
     * @param {function} callback the callback to call when complete.
     */
    create (lbModelName, data, options, callback) {
        debug('create', lbModelName, data, options);
        let composerModelName = this.getComposerModelName(lbModelName);

        // If the $class property has not been provided, add it now.
        if (!data.$class) {
            // Loopback doesn't like dots in the model names so the loopback bootscript needs to change them to underscores
            // when it creates the schemas. (see <loopbackapp>/server/boot/composer.js sample)
            // So we need to change the underscores back to dots here for the composer API.
            data.$class = composerModelName;
        }

        this.ensureConnected(options)
            .then((businessNetworkConnection) => {
                // Convert the JSON data into a resource.
                let serializer = this.businessNetworkDefinition.getSerializer();
                let resource = serializer.fromJSON(data);

                // The create action is based on the type of the resource.
                // If it's a transaction, it's a transaction submit.
                let classDeclaration = resource.getClassDeclaration();
                if (classDeclaration instanceof TransactionDeclaration) {

                    // For transactions, we submit the transaction for execution.
                    return businessNetworkConnection.submitTransaction(resource);

                }

                // For assets and participants, we add the resource to its default registry
                return this.getRegistryForModel(businessNetworkConnection, composerModelName)
                    .then((registry) => {
                        return registry.add(resource);
                    });

            })
            .then(() => {
                callback();
            })
            .catch((error) => {
                debug('create', 'error thrown doing create', error);
                callback(error);
            });
    }

    /**
     * Get an instance of an object in Composer. For assets, this method
     * gets the asset from the default asset registry.
     * @param {string} lbModelName the fully qualified model name.
     * @param {string} id the identifier of the asset or participant to retrieve.
     * @param {Object} options the options provided by Loopback.
     * @param {function} callback the callback to call when complete.
     */
    retrieve (lbModelName, id, options, callback) {
        debug('retrieve', lbModelName, id, options);
        let composerModelName = this.getComposerModelName(lbModelName);

        this.ensureConnected(options)
            .then((businessNetworkConnection) => {

                // For assets, we add the asset to its default asset registry
                return this.getRegistryForModel(businessNetworkConnection, composerModelName)
                    .then((registry) => {
                        return registry.get(id);
                    })
                    .then((resource) => {
                        let serializer = this.businessNetworkDefinition.getSerializer();
                        return serializer.toJSON(resource);
                    });

            })
            .then((result) => {
                callback(null, result);
            })
            .catch((error) => {
                debug('retrieve', 'error thrown doing retrieve', error);
                callback(error);
            });
    }

    /**
     * Update an instance of an object in Composer. For assets, this method
     * updates the asset to the default asset registry.
     * @param {string} lbModelName the fully qualified model name.
     * @param {Object} data the data for the asset or transaction.
     * @param {Object} options the options provided by Loopback.
     * @param {function} callback the callback to call when complete.
     */
    update (lbModelName, data, options, callback) {
        debug('update', lbModelName, data, options);
        let composerModelName = this.getComposerModelName(lbModelName);

        // If the $class property has not been provided, add it now.
        if (!data.$class) {
            data.$class = composerModelName;
        }

        this.ensureConnected(options)
            .then((businessNetworkConnection) => {
                // Convert the JSON data into a resource.
                let serializer = this.businessNetworkDefinition.getSerializer();
                let resource = serializer.fromJSON(data);

                // The create action is based on the type of the resource.
                return this.getRegistryForModel(businessNetworkConnection, composerModelName)
                    .then((registry) => {
                        return registry.update(resource);
                    });

            })
            .then(() => {
                callback();
            })
            .catch((error) => {
                debug('update', 'error thrown doing update', error);
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
        let composerModelName = this.getComposerModelName(lbModelName);

        let idField, registry;
        this.ensureConnected(options)
            .then((businessNetworkConnection) => {
                idField = Object.keys(where)[0];
                if(this.isValidId(composerModelName, idField)) {
                    return this.getRegistryForModel(businessNetworkConnection, composerModelName);
                } else {
                    callback(new Error('The specified filter does not match the identifier in the model'));
                }
            })
            .then((registry_) => {
                registry = registry_;
                return registry.get(where[idField]);
            })
            .then((resourceToRemove) => {
                return registry.remove(resourceToRemove);
            })
            .then(() => {
                callback();
            })
            .catch((error) => {
                debug('destroyAll', 'error thrown doing remove', error);
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
        this.ensureConnected(options)
            .then(() => {
                let models = [];
                let modelNames = new Set();
                let namesAreUnique = true;

                // Find all the types in the buiness network.
                const classDeclarations = this.introspector.getClassDeclarations()
                    .filter((classDeclaration) => {

                        // Filter out anything that isn't a type we want to represent.
                        return (classDeclaration instanceof AssetDeclaration) ||
                               (classDeclaration instanceof ConceptDeclaration) ||
                               (classDeclaration instanceof ParticipantDeclaration) ||
                               (classDeclaration instanceof TransactionDeclaration);

                    })
                    .filter((classDeclaration) => {

                        // Filter out any abstract types.
                        return !classDeclaration.isAbstract();

                    });

                // Look for duplicate type names, and set a flag if so.
                classDeclarations.forEach((classDeclaration) => {
                    const name = classDeclaration.getName();
                    if (modelNames.has(name)) {
                        namesAreUnique = false;
                    } else {
                        modelNames.add(name);
                    }
                });

                // Determine whether or not we are going to use namespaces.
                let namespaces;
                switch (this.settings.namespaces) {
                case 'always':
                    namespaces = true;
                    break;
                case 'required':
                    namespaces = !namesAreUnique;
                    break;
                case 'never':
                    if (!namesAreUnique) {
                        throw new Error('namespaces has been set to never, but type names in business network are not unique');
                    }
                    namespaces = false;
                }
                this.visitor = new LoopbackVisitor(namespaces);

                // Add all the types to the result.
                classDeclarations.forEach((classDeclaration) => {
                    models.push({
                        type : 'table',
                        name : namespaces ? classDeclaration.getFullyQualifiedName() : classDeclaration.getName()
                    });
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
        this.ensureConnected(options)
            .then(() => {

                // Try to find the type - search for the fully qualified name first.
                let classDeclaration = this.introspector.getClassDeclarations()
                    .find((classDeclaration) => {
                        return classDeclaration.getFullyQualifiedName() === object;
                    });

                // Then look for the name.
                if (!classDeclaration) {
                    let matchingClassDeclaration = this.introspector.getClassDeclarations()
                        .filter((classDeclaration) => {
                            return classDeclaration.getName() === object;
                        });
                    if (matchingClassDeclaration.length > 1) {
                        throw new Error(`Found multiple type definitions for ${object}, must fully qualify type name`);
                    } else if (matchingClassDeclaration.length === 1) {
                        classDeclaration = matchingClassDeclaration[0];
                    }
                }

                // If we didn't find it, throw!
                if (!classDeclaration) {
                    throw new Error(`Failed to find type definition for ${object}`);
                }

                // Generate a LoopBack schema for the type.
                let schema = classDeclaration.accept(this.visitor, {
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

}

module.exports = BusinessNetworkConnector;
