/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const LOG = require('./log/logger').getLog('ConnectionProfileManager');

/**
 * A connection profile manager that manages a set of connection profiles. Each
 * connection profile defines an arbitrary set of configuration data and is associated
 * with a ConnectionManager.
 *
 */
class ConnectionProfileManager {

  /**
   * Create the ConnectionManager and attach a file system
   * @param {ConnectionProfileStore} connectionProfileStore - Node.js FS implementation, for example BrowserFS
   */
    constructor(connectionProfileStore) {
        LOG.info('constructor','Created a new ConnectionProfileManager', connectionProfileStore);

        if(!connectionProfileStore) {
            throw new Error('Must create ConnectionProfileManager with a ConnectionProfileStore implementation.');
        }

        this.connectionProfileStore = connectionProfileStore;
        this.connectionManagers = {};
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
        this.connectionManagers[type] = connectionManager;
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
            let connectionManager  = this.connectionManagers[data.type];
            if(!connectionManager) {
                const mod = `@ibm/ibm-concerto-connector-${data.type}`;
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
                    throw new Error(`Failed to load connector module "${mod}" for connection profile "${connectionProfile}"`);
                }
                this.connectionManagers[data.type] = connectionManager;
            }
            return connectionManager;
        });
    }

    /**
     * Establish a connection to the business network, using connection information
     * from the connection profile.
     *
     * @param {string} connectionProfile The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network
     * @param {object} connectionOptions The connection options loaded from the profile
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
}

module.exports = ConnectionProfileManager;
