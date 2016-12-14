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

const ConnectionManager = require('@ibm/ibm-concerto-common').ConnectionManager;
const EmbeddedConnection = require('./embeddedconnection');

/**
 * Base class representing a connection manager that establishes and manages
 * connections to one or more business networks.
 * @protected
 * @abstract
 */
class EmbeddedConnectionManager extends ConnectionManager {

    /**
     * Creates a new EmbeddedConnectionManager
     * @param {ConnectionProfileManager} connectionProfileManager
     * - the ConnectionProfileManager used to manage access connection profiles.
     */
    constructor(connectionProfileManager) {
        super(connectionProfileManager);
    }

    /**
     * Establish a connection to the business network.
     * @param {string} connectionProfile The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network
     * @param {object} connectionOptions The connection options loaded from the profile
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     */
    connect(connectionProfile, businessNetworkIdentifier, connectionOptions) {
        return Promise.resolve(new EmbeddedConnection(this, connectionProfile, businessNetworkIdentifier));
    }

}

module.exports = EmbeddedConnectionManager;
