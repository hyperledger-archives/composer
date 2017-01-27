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
 * A security context for the embedded connection.
 */
class ProxySecurityContext extends SecurityContext {

    /**
     * Constructor.
     * @param {Connection} connection The owning connection.
     * @param {string} securityContextID The security context ID.
     */
    constructor(connection, securityContextID) {
        super(connection);
        this.securityContextID = securityContextID;
    }

    /**
     * Get the current username.
     * @abstract
     * @return {string} The username
     */
    getUser() {
        // TODO: this is not a promise based API!
        throw new Error('TODO TODO TODO');
    }

    /**
     * Get the security context ID.
     * @return {string} The security context ID.
     */
    getSecurityContextID() {
        return this.securityContextID;
    }

}

module.exports = ProxySecurityContext;
