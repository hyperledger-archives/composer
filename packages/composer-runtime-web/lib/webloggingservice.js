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

/**
 * Base class representing the logging service provided by a {@link Container}.
 * @protected
 */
class WebLoggingService extends LoggingService {

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
        // console.debug(message);
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

    /**
     * Return the logger config... basically the usual default setting for debug
     * Console only maxLevel error, and nothing file based
     * @return {Object} logging configuration
     */
    getLoggerCfg(){
        return {
            'logger': './winstonInjector.js',
            'debug': 'composer[debug]:*',
            'console': {
                'maxLevel': 'error'
            },
            'file': {
                'maxLevel': 'none'
            }
        };
    }

}

module.exports = WebLoggingService;
