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

let LOG;

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
    static registerConnectionManagerLoader(module) {
        connectionManagerLoaders.push(module);
    }

    /**
     * Register a new ConnectionManager class.
     * @param {string} type - the profile type identifier of the ConnectionManager
     * @param {function} ctor - the constructor of the ConnectionManager
     */
    static registerConnectionManager(type, ctor) {
        connectionManagerClasses[type] = ctor;
    }

    /**
     * Create the ConnectionManager and attach a file system
     * @param {ConnectionProfileStore} connectionProfileStore - Node.js FS implementation, for example BrowserFS
     */
    constructor(connectionProfileStore) {
        if (!LOG) {
            LOG = require('./log/logger').getLog('ConnectionProfileManager');
        }
        LOG.info('constructor','Created a new ConnectionProfileManager', connectionProfileStore);

        if(!connectionProfileStore) {
            throw new Error('Must create ConnectionProfileManager with a ConnectionProfileStore implementation.');
        }

        this.connectionProfileStore = connectionProfileStore;
    }

    /**
     * Returns the ConnectionProfileStore associated with this
     * instance.
     * @return {ConnectionProfileStore} the associated store.
     */
    getConnectionProfileStore() {
        return this.connectionProfileStore;
    }

    /**
     * Adds a ConnectionManager to the mappings of this ConnectionProfileManager
     * @param {string} type - the profile type identifier of the ConnectionManager
     * @param {ConnectionManager} connectionManager - the instance
     */
    addConnectionManager(type, connectionManager) {
        LOG.info('addConnectionManager','Adding a new connection manager', type);
        connectionManagers[type] = connectionManager;
    }

    /**
     * Retrieves the ConnectionManager for the given connection profile.
     *
     * @param {string} connectionProfile The name of the connection profile
     * @return {Promise} A promise that is resolved with a {@link ConnectionManager}
     * object once the connection is established, or rejected with a connection error.
     */
    getConnectionManager(connectionProfile) {
        LOG.info('getConnectionManager','Looking up a connection manager for profile', connectionProfile);

        return this.connectionProfileStore.load(connectionProfile)
        .then((data) => {
            let connectionManager  = connectionManagers[data.type];
            if(!connectionManager) {
                const mod = `composer-connector-${data.type}`;
                try {
                    // Check for the connection manager class registered using
                    // registerConnectionManager (used by the web connector).
                    let connectionManagerClass = connectionManagerClasses[data.type];
                    if (connectionManagerClass) {
                        connectionManager = new(connectionManagerClass)(this);
                    } else {
                        // Not registered using registerConnectionManager, we now
                        // need to search for the connector module in our module
                        // and all of the parent modules (the ones who require'd
                        // us) as we do not depend on any connector modules.
                        let curmod = module;
                        while (curmod) {
                            try {
                                connectionManager = new(curmod.require(mod))(this);
                                break;
                            } catch (e) {
                                // Continue to search the parent.
                            }
                            curmod = curmod.parent;
                        }
                        if (!connectionManager) {
                            connectionManagerLoaders.some((connectionManagerLoader) => {
                                try {
                                    connectionManager = new(connectionManagerLoader.require(mod))(this);
                                    return true;
                                } catch (e) {
                                    // Search the next one.
                                    return false;
                                }
                            });
                        }
                        if (!connectionManager) {
                            // We still didn't find it, so try plain old require
                            // one last time.
                            connectionManager = new(require(mod))(this);
                        }
                    }
                } catch (e) {
                    throw new Error(`Failed to load connector module "${mod}" for connection profile "${connectionProfile}"`);
                }
                connectionManagers[data.type] = connectionManager;
            }
            return connectionManager;
        });
    }

    /**
     * Establish a connection to the business network, using connection information
     * from the connection profile.
     *
     * @param {string} connectionProfile The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network, or null if this is an admin connection
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     * @abstract
     */
    connect(connectionProfile, businessNetworkIdentifier) {

        LOG.info('connect','Connecting using ' + connectionProfile, businessNetworkIdentifier);

        return this.connectionProfileStore.load(connectionProfile)
        .then((connectOptions) => {
            return this.getConnectionManager(connectionProfile)
          .then((connectionManager) => {
              return connectionManager.connect(connectionProfile, businessNetworkIdentifier, connectOptions);
          });
        });
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

    /**
     * Clear the static object containing all the connection managers
     */
    static removeAllConnectionManagers() {
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
