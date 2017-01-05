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

const Context = require('@ibm/concerto-runtime').Context;
const EmbeddedIdentityService = require('./embeddedidentityservice');

/**
 * A class representing the current request being handled by the JavaScript engine.
 * @protected
 */
class EmbeddedContext extends Context {

    /**
     * Constructor.
     * @param {Engine} engine The owning engine.
     */
    constructor(engine) {
        super(engine);
        this.dataService = engine.getContainer().getDataService();
        this.identityService = new EmbeddedIdentityService();
    }

    /**
     * Get the data service provided by the chaincode container.
     * @return {DataService} The data service provided by the chaincode container.
     */
    getDataService() {
        return this.dataService;
    }

    /**
     * Get the identity service provided by the chaincode container.
     * @return {IdentityService} The identity service provided by the chaincode container.
     */
    getIdentityService() {
        return this.identityService;
    }

}

module.exports = EmbeddedContext;
