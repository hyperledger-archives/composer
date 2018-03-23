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

const util = require('util');

/**
 * A functional logger implementation that simply writes to the console.
 * @private
 */
class ConsoleLogger {

/**
 * Called to format.
 * @param {string} method The method.
 * @param {string} msg The message.
 * @param {*} [args] The arguments.
 * @returns {string} The formatted message.
 * @private
 */
    format(method, msg, args) {
        if (!args) {
            return util.format('%s %s', method, msg);
        }
        let formattedArguments = args.map((arg) => {
            if (typeof (arg) === 'function') {
                return '<function>';
            } else if (arg === Object(arg)) {
            // It's an object, array, or function, so serialize it as JSON.
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return arg;
                }
            } else {
                return String(arg);
            }
        }).join(', ');
        return util.format('%s %s %s', method, msg, formattedArguments);
    }

/**
 * Called to log.
 * @param {string} level The logging level.
 * @param {string} method The method.
 * @param {string} msg The message.
 * @param {*} [args] The arguments.
 * @private
 */
    log(level, method, msg, args) {
        const formattedMessage = this.format(method, msg, args);
        switch (level) {
        case 'debug':
            console.log(formattedMessage);
            break;
        case 'warn':
            console.warn(formattedMessage);
            break;
        case 'info':
            console.info(formattedMessage);
            break;
        case 'verbose':
            console.log(formattedMessage);
            break;
        case 'error':
            console.error(formattedMessage);
            break;
        }
    }

}

module.exports.getLogger = function (config) {
    return new ConsoleLogger();
};
