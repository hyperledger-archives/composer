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

const LoggingService = require('composer-runtime').LoggingService;


const LOG_LEVELS = {
    CRITICAL: 0,
    ERROR:    100,
    WARNING:  200,
    NOTICE:   300,
    INFO:     400,
    DEBUG:    500
};

const LOOKUP_LOG_LEVELS = {
    '-1':  'NOT_ENABLED',
    0:   'CRITICAL',
    100: 'ERROR',
    200: 'WARNING',
    300: 'NOTICE',
    400: 'INFO',
    500: 'DEBUG'
};

const LOGLEVEL_KEY = 'ComposerLogLevel';

/**
 * Base class representing the logging service provided by a {@link Container}.
 * @protected
 */
class NodeLoggingService extends LoggingService {
    constructor() {
        super();
        this.stub = null;
        this.currentLogLevel = -1;
    }

    _outputMessage(message) {
        console.log(message);
    }

    /**
     * Initialise the logging service for the incoming request.
     * This will need to stub for the request so it saves the stub for later use.
     * And enables the logging level currently set.
     *
     * @param {any} stub The stub to save
     * @returns {Promise} A promise that resolves once the logging level has been set, rejected if an error
     */
    async initLogging(stub) {
        this.stub = stub;
        if (this.currentLogLevel >= 0) {
            return;
        }
        await this._enableLogging();
    }

    /**
     * Enable logging for the current request based on the level set in the world state
     * or the CORE_CHAINCODE_LOGGING_LEVEL environment variable. If neither are set
     * then default to INFO.
     */
    async _enableLogging() {
        try {
            let result = await this.stub.getState(LOGLEVEL_KEY);
            if (result.length === 0) {
                result = process.env.CORE_CHAINCODE_LOGGING_LEVEL;
                if (!result) {
                    result = 'INFO';
                }
            }
            this.currentLogLevel = LOG_LEVELS[result] ? LOG_LEVELS[result] : LOG_LEVELS.INFO;
        }
        catch(err) {
            this.currentLogLevel = LOG_LEVELS.INFO;
            this.logWarning('failed to get logging level from world state: ' + err);
        }
    }

    /**
     * Write a critical message to the log.
     * @param {string} message The message to write to the log.
     */
    logCritical(message) {
        if (this.currentLogLevel >= LOG_LEVELS.CRITICAL) {
            this._outputMessage(message);
        }
    }

    /**
     * Write a debug message to the log.
     * @param {string} message The message to write to the log.
     */
    logDebug(message) {
        if (this.currentLogLevel >= LOG_LEVELS.DEBUG) {
            this._outputMessage(message);
        }
    }

    /**
     * Write an error message to the log.
     * @param {string} message The message to write to the log.
     */
    logError(message) {
        if (this.currentLogLevel >= LOG_LEVELS.ERROR) {
            this._outputMessage(message);
        }
    }

    /**
     * Write a informational message to the log.
     * @param {string} message The message to write to the log.
     */
    logInfo(message) {
        if (this.currentLogLevel >= LOG_LEVELS.INFO) {
            this._outputMessage(message);
        }
    }

    /**
     * Write a notice message to the log.
     * @param {string} message The message to write to the log.
     */
    logNotice(message) {
        if (this.currentLogLevel >= LOG_LEVELS.NOTICE) {
            this._outputMessage(message);
        }
    }

    /**
     * Write a warning message to the log.
     * @param {string} message The message to write to the log.
     */
    logWarning(message) {
        if (this.currentLogLevel >= LOG_LEVELS.WARNING) {
            this._outputMessage(message);
        }
    }

    /**
     * Set the log level for the runtime.
     * @param {string} newLogLevel The new log level to apply.
     * @returns {Promise} which is resolved when log level is set, rejected otherwise
     */
    async setLogLevel(newLogLevel) {
        newLogLevel = newLogLevel.toUpperCase();
        if (LOG_LEVELS[newLogLevel]) {
            try {
                await this.stub.putState(LOGLEVEL_KEY, newLogLevel);
                this.currentLogLevel = LOG_LEVELS[newLogLevel];
                this.logWarning('Setting Composer log level to ' + newLogLevel);
            }
            catch(err) {
                throw new Error('failed to set the new log level. ' + err);
            }
        }
        else {
            throw new Error(`${newLogLevel} is not a valid log level. Log level not changed.`);
        }
    }

    /**
     * Get the current log level for the runtime.
     */
    getLogLevel() {
        return LOOKUP_LOG_LEVELS[this.currentLogLevel];
    }
}

module.exports = NodeLoggingService;
