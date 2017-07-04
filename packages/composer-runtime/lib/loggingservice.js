/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const Service = require('./service');

/**
 * Base class representing the logging service provided by a {@link Container}.
 * @protected
 * @abstract
 * @memberof module:composer-runtime
 */
class LoggingService extends Service {

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
     * Set the log level for the runtime.
     * @abstract
     * @param {string} newLogLevel The new log level to apply.
     */
    setLogLevel(newLogLevel) {
        throw new Error('abstract function called');
    }

    /**
     * Get the current log level for the runtime.
     * @abstract
     */
    getLogLevel() {
        throw new Error('abstract function called');
    }

}

module.exports = LoggingService;
