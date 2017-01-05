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

const LoggingService = require('@ibm/concerto-runtime').LoggingService;

/**
 * Base class representing the logging service provided by a {@link Container}.
 * @protected
 */
class EmbeddedLoggingService extends LoggingService {

    /**
     * Write a critical message to the log.
     * @param {string} message The message to write to the log.
     */
    logCritical(message) {
        console.error(message);
    }

    /**
     * Write a debug message to the log.
     * @param {string} message The message to write to the log.
     */
    logDebug(message) {
        console.log(message);
    }

    /**
     * Write an error message to the log.
     * @param {string} message The message to write to the log.
     */
    logError(message) {
        console.error(message);
    }

    /**
     * Write a informational message to the log.
     * @param {string} message The message to write to the log.
     */
    logInfo(message) {
        console.info(message);
    }

    /**
     * Write a notice message to the log.
     * @param {string} message The message to write to the log.
     */
    logNotice(message) {
        console.info(message);
    }

    /**
     * Write a warning message to the log.
     * @param {string} message The message to write to the log.
     */
    logWarning(message) {
        console.warn(message);
    }

}

module.exports = EmbeddedLoggingService;
