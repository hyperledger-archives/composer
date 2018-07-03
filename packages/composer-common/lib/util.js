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
const Resource = require('./model/resource');
const Globalize = require('./globalize');
const os = require('os');
const path = require('path');
const SecurityContext = require('./securitycontext');
const SecurityException = require('./securityexception');
const uuid = require('uuid');

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
            throw new SecurityException(Globalize.formatMessage('composer-connect-notconnected'));
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
        args.forEach((arg,index) => {
            if (typeof arg === 'boolean') {
                args[index] = arg.toString();
            } else if (typeof arg !== 'string') {
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
     * @param {Object} options - options to pass to the invoking chain code
     * @param {Object} options.transactionId Transaction Id to use.
     * @return {Promise} - A promise that will be resolved with the value returned
     * by the chain-code function.
     */
    static invokeChainCode(securityContext, functionName, args, options) {
        Util.securityCheck(securityContext);
        if (!functionName) {
            throw new Error('functionName not specified');
        } else if (!args) {
            throw new Error('args not specified');
        }
        options = options || {};
        args.forEach((arg) => {
            if (typeof arg !== 'string') {
                throw new Error('invalid arg specified: ' + arg);
            }
        });

        return securityContext.getConnection().invokeChainCode(securityContext, functionName, args, options);
    }

    /**
     * Takes a json structure of a transaction, and processes this for transaction id
     * Passes it on to the invokeChainCode fn
     *
     * @param {SecurityContext} securityContext - The user's security context
     * @param {Resource|object} transaction - the transaction
     * @param {Serializer} [serializer]  needed ONLY if the transaction passed is a resource
     * @param {Object} [additionalConnectorOptions] Additional connector specific options for this transaction.
     * @return {Promise} - A promise that will be resolved with the value returned
     * by the chain-code function.
     */
    static async submitTransaction(securityContext, transaction, serializer, additionalConnectorOptions = {}) {
        Util.securityCheck(securityContext);

        let txId = await Util.createTransactionId(securityContext);
        let json;

        if (transaction instanceof Resource){
            transaction.setIdentifier(txId.idStr);
            json = serializer.toJSON(transaction);

        } else {
            transaction.transactionId = txId.idStr;
            json=transaction;
        }

        Object.assign(additionalConnectorOptions, { transactionId: txId.id });

        return Util.invokeChainCode(securityContext, 'submitTransaction', [JSON.stringify(json)], additionalConnectorOptions);
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

   /** Obtain a UUID for use as a TransactionId
     * @param {SecurityContext} securityContext - The user's security context
     * @return {Promise}  resolved with an object representing the transaction Id to be used later when invoking chain code
     * Strutcure of this object is { id: <id object>, idStr:<string representation>}
    */
    static createTransactionId(securityContext){
        Util.securityCheck(securityContext);
        return securityContext.getConnection().createTransactionId(securityContext)
        .then((id)=>{
            if (this.isNull(id)){
                let tempId = uuid.v4();
                return {id:tempId, idStr:tempId};
            }
            return id;
        });

    }

    /**
     * Get the home directory path for the current user. Returns root directory for environments where there is no
     * file system path available.
     * @returns {String} A file system path.
     */
    static homeDirectory() {
        return (os.homedir && os.homedir()) || path.sep;
    }

}

module.exports = Util;
