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
 * Base class representing the identity service provided by a {@link Container}.
 * @protected
 * @abstract
 * @memberof module:ibm-concerto-runtime
 */
class IdentityService {

    /**
     * Retrieve the current user ID.
     * @abstract
     * @return {string} The current user ID, or null if the current user ID cannot
     * be determined or has not been specified.
     */
    getCurrentUserID() {
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

module.exports = IdentityService;
