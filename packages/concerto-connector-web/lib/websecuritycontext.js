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

const SecurityContext = require('@ibm/concerto-common').SecurityContext;

/**
 * A security context for the web connection.
 */
class WebSecurityContext extends SecurityContext {

    /**
     * Constructor.
     * @param {Connection} connection The owning connection.
     */
    constructor(connection) {
        super(connection);
        this.chaincodeID = null;
    }

    /**
     * Get the chaincode ID.
     * @return {string} The chaincode ID.
     */
    getChaincodeID() {
        return this.chaincodeID;
    }

    /**
     * Set the chaincode ID.
     * @param {string} chaincodeID - The chaincode ID.
     */
    setChaincodeID(chaincodeID) {
        this.chaincodeID = chaincodeID;
    }

}

module.exports = WebSecurityContext;
