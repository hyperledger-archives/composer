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

const Context = require('@ibm/ibm-concerto-runtime').Context;
const WebDataService = require('./webdataservice');

/**
 * A class representing the current request being handled by the JavaScript engine.
 * @protected
 */
class WebContext extends Context {

    /**
     * Constructor.
     * @param {Engine} engine The owning engine.
     */
    constructor(engine) {
        super(engine);
        this.dataService = new WebDataService();
    }

    /**
     * Get the data service provided by the chaincode container.
     * @return {DataService} The data service provided by the chaincode container.
     */
    getDataService() {
        return this.dataService;
    }

}

module.exports = WebContext;
