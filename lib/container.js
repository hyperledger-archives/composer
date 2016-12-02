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
 * A class representing the chaincode container hosting the JavaScript engine.
 * @protected
 * @abstract
 * @memberof module:ibm-concerto-runtime
 */
class Container {

    /**
     * Get the version of the chaincode container.
     * @abstract
     * @return {string} The version of the chaincode container.
     */
    getVersion() {
        throw new Error('abstract function called');
    }

    /**
     * Get the logging service provided by the chaincode container.
     * @abstract
     * @return {LoggingService} The logging service provided by the chaincode container.
     */
    getLoggingService() {
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

module.exports = Container;
