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

const Logger = require('./log/logger');

const LOG = Logger.getLog('ConnectionProfileManager');

const connectionManagerLoaders = [];
const connectionManagerClasses = {};
const connectionManagers = {};

/**
 * A connection profile manager that manages a set of connection profiles. Each
 * connection profile defines an arbitrary set of configuration data and is associated
 * with a ConnectionManager.
 * @private
 * @class
 * @memberof module:composer-common
 */
class ConnectionProfileManager {

    /**
     * The composer-common module cannot load connector modules from parent modules
     * when the dependencies are linked together using npm link or lerna. To work
     * around this, the packages that require the connectors register themselves as
     * modules that can load connection managers.
     * @param {Object} module The module that can load connector modules.
     */
    static registerConnectionManagerLoader (module) {
        connectionManagerLoaders.push(module);
    }

    /**
     * Register a new ConnectionManager class.
     * @param {string} type - the profile type identifier of the ConnectionManager
     * @param {function} ctor - the constructor of the ConnectionManager
     */
    static registerConnectionManager (type, ctor) {
        connectionManagerClasses[type] = ctor;
    }

    /**
     * Adds a ConnectionManager to the mappings of this ConnectionProfileManager
     * @param {string} type - the profile type identifier of the ConnectionManager
     * @param {ConnectionManager} connectionManager - the instance
     */
    addConnectionManager (type, connectionManager) {
        LOG.info('addConnectionManager', 'Adding a new connection manager', type);
        connectionManagers[type] = connectionManager;
    }

    /**
     * Retrieves the ConnectionManager for the given connection type.
     *
     * @param {String} connectionType The connection type, eg hlfv1, embedded, embedded@proxy
     * @return {Promise} A promise that is resolved with a {@link ConnectionManager}
     * object once the connection is established, or rejected with a connection error.
     */
    getConnectionManagerByType (connectionType) {
        const METHOD = 'getConnectionManagerByType';

        if (!connectionType) {
            let err = new Error('No connection type provided, probably because the connection profile has no \'x-type\' property defined.');
            LOG.error(METHOD, err);
            return Promise.reject(err);
        }

        LOG.info(METHOD, 'Looking up a connection manager for type', connectionType);
        let errorList = [];

        return Promise.resolve()
            .then(() => {
                let connectionManager = connectionManagers[connectionType];
                if (!connectionManager) {
                    const delegateTypeIndex = connectionType.toLowerCase().lastIndexOf('@');
                    const mod = delegateTypeIndex === -1 || delegateTypeIndex === connectionType.length - 1 ? `composer-connector-${connectionType}` : `composer-connector-${connectionType.substring(delegateTypeIndex + 1)}`;
                    LOG.debug(METHOD, 'Looking for module', mod);
                    try {
                        // Check for the connection manager class registered using
                        // registerConnectionManager (used by the web connector).
                        const actualType = delegateTypeIndex !== -1 && delegateTypeIndex < connectionType.length - 1 ? connectionType.substring(delegateTypeIndex + 1) : connectionType;
                        const connectionManagerClass = connectionManagerClasses[actualType];
                        if (connectionManagerClass) {
                            connectionManager = new (connectionManagerClass)(this);
                        } else {
                            // Not registered using registerConnectionManager, we now
                            // need to search for the connector module in our module
                            // and all of the parent modules (the ones who required
                            // us) as we do not depend on any connector modules.
                            let curmod = module;
                            while (curmod) {
                                try {
                                    connectionManager = new (curmod.require(mod))(this);
                                    break;
                                } catch (e) {
                                    errorList.push(e.message);
                                    LOG.info(METHOD, 'No yet located the module ', e.message);
                                    // Continue to search the parent.
                                }
                                curmod = curmod.parent;
                            }

                            LOG.info(METHOD, 'Using this connection manager ', connectionManager);
                            if (!connectionManager) {
                                connectionManagerLoaders.some((connectionManagerLoader) => {
                                    try {
                                        connectionManager = new (connectionManagerLoader.require(mod))(this);
                                        return true;
                                    } catch (e) {
                                        // Search the next one.
                                        errorList.push(e.message);
                                        LOG.info(METHOD, e);
                                        return false;
                                    }
                                });
                            }
                            if (!connectionManager) {
                                LOG.verbose(METHOD, 'not located the module - final try ');
                                // We still didn't find it, so try plain old require
                                // one last time.
                                connectionManager = new (require(mod))(this);
                            }

                        }

                    } catch (e) {
                        // takes the error list, and filters out duplicate lines
                        errorList.push(e.message);
                        errorList.filter((element, index, self) => {
                            return index === self.indexOf(element);
                        });

                        const newError = new Error(`Failed to load connector module "${mod}" for connection type "${connectionType}". ${errorList.join('-')}`);
                        LOG.error(METHOD, newError);
                        throw newError;
                    }
                    connectionManagers[connectionType] = connectionManager;
                }
                return connectionManager;
            });
    }

    /**
     * Establish a connection to the business network, using connection information
     * from the connection profile.
     *
     * @param {string} connectionProfileName The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network, or null if this is an admin connection
     * @param {Object} connectionProfileData the actual connection profile
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     */
    connect(connectionProfileName, businessNetworkIdentifier, connectionProfileData) {
        LOG.info('connect', 'Connecting using ' + connectionProfileName, businessNetworkIdentifier);

        return this.getConnectionManagerByType(connectionProfileData['x-type'])
            .then((connectionManager) => {
                return connectionManager.connect(connectionProfileName, businessNetworkIdentifier, connectionProfileData);
            });
    }


    /**
     * Connect with the actual connection profile data, so the look up of the connection profile
     * is by passed as this has come direct from the business network card.
     *
     * @param {Object} connectionProfileData object representing of the connection profile
     * @param {String} businessNetworkIdentifier id of the business network
     * @param {Object} [additionalConnectOptions] additional options
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     */
    connectWithData(connectionProfileData, businessNetworkIdentifier, additionalConnectOptions) {
        let connectOptions = connectionProfileData;

        return Promise.resolve().then(() => {
            if (additionalConnectOptions) {
                connectOptions = Object.assign(connectOptions, additionalConnectOptions);
            }
            return this.getConnectionManagerByType(connectOptions['x-type']);
        })
            .then((connectionManager) => {
                return connectionManager.connect(connectOptions.name, businessNetworkIdentifier, connectOptions);
            });

    }

    /**
     * Clear the static object containing all the connection managers
     */
    static removeAllConnectionManagers () {
        connectionManagerLoaders.length = 0;
        Object.keys(connectionManagerClasses).forEach((key) => {
            connectionManagerClasses[key] = null;
        });
        Object.keys(connectionManagers).forEach((key) => {
            connectionManagers[key] = null;
        });
    }
}

module.exports = ConnectionProfileManager;
