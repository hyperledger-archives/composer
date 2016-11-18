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

const Container = require('@ibm/ibm-concerto-runtime').Container;
const WebLoggingService = require('./webloggingservice');
const version = require('../package.json').version;

/**
 * A class representing the chaincode container hosting the JavaScript engine.
 * @protected
 */
class WebContainer extends Container {

    /**
     * Constructor.
     */
    constructor() {
        super();
        this.loggingService = new WebLoggingService();
    }

    /**
     * Get the version of the chaincode container.
     * @return {string} The version of the chaincode container.
     */
    getVersion() {
        return version;
    }

    /**
     * Get the logging service provided by the chaincode container.
     * @return {LoggingService} The logging service provided by the chaincode container.
     */
    getLoggingService() {
        return this.loggingService;
    }

}

module.exports = WebContainer;
