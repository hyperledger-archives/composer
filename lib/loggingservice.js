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
 * Base class representing the logging service provided by a {@link Container}.
 * @protected
 * @abstract
 */
class LoggingService {

    /**
     * Write a critical message to the log.
     * @abstract
     * @param {string} message The message to write to the log.
     */
    logCritical(message) {
        throw new Error('abstract function called');
    }

    /**
     * Write a debug message to the log.
     * @abstract
     * @param {string} message The message to write to the log.
     */
    logDebug(message) {
        throw new Error('abstract function called');
    }

    /**
     * Write an error message to the log.
     * @abstract
     * @param {string} message The message to write to the log.
     */
    logError(message) {
        throw new Error('abstract function called');
    }

    /**
     * Write a informational message to the log.
     * @abstract
     * @param {string} message The message to write to the log.
     */
    logInfo(message) {
        throw new Error('abstract function called');
    }

    /**
     * Write a notice message to the log.
     * @abstract
     * @param {string} message The message to write to the log.
     */
    logNotice(message) {
        throw new Error('abstract function called');
    }

    /**
     * Write a warning message to the log.
     * @abstract
     * @param {string} message The message to write to the log.
     */
    logWarning(message) {
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

module.exports = LoggingService;
