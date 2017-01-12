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

/**
 * SecurityContext is used to authenticate and manage
 * user credentials to the underlying blockchain fabric.
 * <p><a href="./diagrams/securitycontext.svg"><img src="./diagrams/securitycontext.svg" style="width:100%;"/></a></p>
 * @abstract
 * @class
 * @memberof module:concerto-common
 */
class SecurityContext {

    /**
     * Create the SecurityContext.
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances by calling {@link Concerto#login login}</strong>
     * </p>
     * @param {Connection} connection The owning connection.
     * @param {string} user The user identifier.
     */
    constructor(connection) {
        this.connection = connection;
    }

    /**
     * Get the owning connection.
     * @return {Connection} The owning connection.
     */
    getConnection() {
        return this.connection;
    }

    /**
     * Get the current username.
     * @abstract
     * @return {string} The username
     */
    getUser() {
        throw new Error('abstract function called');
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

}

module.exports = SecurityContext;
