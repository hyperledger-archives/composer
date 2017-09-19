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

const Logger = require('composer-common').Logger;
const LOG = Logger.getLog('TransactionHandler');

/**
 * A transaction handler class can bind transaction processor functions which are
 * then executed when the bound transaction type is submitted.
 * @abstract
 * @protected
 */
class TransactionHandler {

    /**
     * Constructor.
     */
    constructor() {
        this.handlers = {};
    }

    /**
     * Bind the specified transaction processor function to the specified transaction
     * type, so that it is executed when the specified transaction is submitted..
     * @protected
     * @param {string} transactionFQT The fully qualified type of the transaction.
     * @param {Function} handler The transaction processor function.
     */
    bind(transactionFQT, handler) {
        const method = 'bind';
        LOG.entry(method, transactionFQT, handler);
        if (this.handlers[transactionFQT]) {
            LOG.debug(method, 'Found existing handlers array');
            this.handlers[transactionFQT].push(handler);
        } else {
            LOG.debug(method, 'Creating new handlers array');
            this.handlers[transactionFQT] = [handler];
        }
        LOG.exit(method);
    }

    /**
     * Execute the specified transaction.
     * @param {Api} api The API to use.
     * @param {Resource} resolvedTransaction The resolved transaction to execute.
     * @return {Promise} A promise that is resolved when the transaction has been
     * executed, or rejected with an error.
     */
    execute(api, resolvedTransaction) {
        const method = 'execute';
        LOG.entry(method, api, resolvedTransaction);
        const fqt = resolvedTransaction.getFullyQualifiedType();
        const handlers = this.handlers[fqt] || [];
        return handlers.reduce((promise, handler) => {
            return promise.then(() => {
                LOG.debug(method, 'Calling handler');
                return handler.call(this, api, resolvedTransaction);
            });
        }, Promise.resolve())
            .then(() => {
                LOG.exit(method, handlers.length);
                return handlers.length;
            });
    }

}

module.exports = TransactionHandler;
