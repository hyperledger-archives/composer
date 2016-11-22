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
const WebConnection = require('./webconnection');

/**
 * Base class representing a connection manager that establishes and manages
 * connections to one or more business networks.
 * @protected
 * @abstract
 */
class WebConnectionManager extends ConnectionManager {

    /**
     * Establish a connection to the business network.
     * @param {Object} connectOptions Implementation specific connection options.
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     */
    connect(connectOptions) {
        return Promise.resolve(new WebConnection(this));
    }

}

module.exports = WebConnectionManager;
