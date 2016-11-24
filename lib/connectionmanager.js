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

const ConnectionProfileManager = require('./connectionprofilemanager');

/**
 * Base class representing a connection manager that establishes and manages
 * connections to one or more business networks. The ConnectionManager loads
 * connection profiles using the ConnectionProfileManager.
 *
 * @protected
 * @abstract
 */
class ConnectionManager {

  /**
   * Create the ConnectionManager
   * @param {ConnectionProfileManager} connectionProfileManager - the ConnectionProfileManager
   * that controls this instance.
   */
    constructor(connectionProfileManager) {
        if(!(connectionProfileManager instanceof ConnectionProfileManager)) {
            throw new Error('Must create ConnectionManager with a ConnectionProfileManager implementation.');
        }

        this.connectionProfileManager = connectionProfileManager;
    }

    /**
     * Returns the ConnectionProfileManager associated with this ConnectionManager
     * @return {ConnectionProfileManager} the connection profile manager for this
     * connection manager.
     */
    getConnectionProfileManager() {
        return this.connectionProfileManager;
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
    connect(connectionProfile, businessNetworkIdentifier, connectionOptions) {
        return Promise.reject(new Error('abstract function called'));
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }
}

module.exports = ConnectionManager;
