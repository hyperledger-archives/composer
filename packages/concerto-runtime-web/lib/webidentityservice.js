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

const IdentityService = require('@ibm/ibm-concerto-runtime').IdentityService;

/**
 * Base class representing the identity service provided by a {@link Container}.
 * @protected
 */
class WebIdentityService extends IdentityService {

    /**
     * Retrieve the current user ID.
     * @return {string} The current user ID, or null if the current user ID cannot
     * be determined or has not been specified.
     */
    getCurrentUserID() {
        return null;
    }

}

module.exports = WebIdentityService;
