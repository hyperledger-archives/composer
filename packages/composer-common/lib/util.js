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

const Globalize = require('./globalize');
const SecurityContext = require('./securitycontext');
const SecurityException = require('./securityexception');

/**
 * Internal Utility Class
 * <p><a href="./diagrams-private/util.svg"><img src="./diagrams-private/util.svg" style="height:100%;"/></a></p>
 * @private
 * @class
 * @memberof module:composer-common
 */
class Util {

    /**
     * Internal method to check the security context
     * @param {SecurityContext} securityContext - The user's security context
     * @throws {SecurityException} if the user context is invalid
     */
    static securityCheck(securityContext) {
        if (Util.isNull(securityContext)) {
            throw new SecurityException(Globalize.formatMessage('util-securitycheck-novalidcontext'));
        } else if (!(securityContext instanceof SecurityContext)) {
            throw new SecurityException(Globalize.formatMessage('util-securitycheck-novalidcontext'));
        }
    }

    /**
     * Submit a query request to the chain-code
     * @param {SecurityContext} securityContext - The user's security context
     * @param {string} functionName - The name of the function to call.
     * @param {string[]} args - The arguments to pass to the function being called.
     * @return {Promise} - A promise that will be resolved with the value returned
     * by the chain-code function.
     */
    static queryChainCode(securityContext, functionName, args) {
        Util.securityCheck(securityContext);
        if (!functionName) {
            throw new Error('functionName not specified');
        } else if (!args) {
            throw new Error('args not specified');
        }
        args.forEach((arg) => {
            if (typeof arg !== 'string') {
                throw new Error('invalid arg specified: ' + arg);
            }
        });
        return securityContext.getConnection().queryChainCode(securityContext, functionName, args);
    }

    /**
     * Submit an invoke request to the chain-code
     * @param {SecurityContext} securityContext - The user's security context
     * @param {string} functionName - The name of the function to call.
     * @param {string[]} args - The arguments to pass to the function being called.
     * @return {Promise} - A promise that will be resolved with the value returned
     * by the chain-code function.
     */
    static invokeChainCode(securityContext, functionName, args) {
        Util.securityCheck(securityContext);
        if (!functionName) {
            throw new Error('functionName not specified');
        } else if (!args) {
            throw new Error('args not specified');
        }
        args.forEach((arg) => {
            if (typeof arg !== 'string') {
                throw new Error('invalid arg specified: ' + arg);
            }
        });
        return securityContext.getConnection().invokeChainCode(securityContext, functionName, args);
    }

    /**
     * Returns true if the typeof the object === 'undefined' or
     * the object === null.
     * @param {Object} obj - the object to be tested
     * @returns {boolean} true if the object is null or undefined
     */
    static isNull(obj) {
        return(typeof(obj) === 'undefined' || obj === null);
    }

}

module.exports = Util;
