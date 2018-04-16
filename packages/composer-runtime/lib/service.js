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

/**
 * Base class for all services provided by a {@link Container}.
 * @protected
 * @abstract
 * @memberof module:composer-runtime
 */
class Service {

    /**
     * Constructor.
     */
    constructor() {

    }

    /**
     * Called at the start of a transaction.
     * @abstract
     * @param {boolean} readOnly Is the transaction read-only?
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionStart(readOnly) {
        return Promise.resolve();
    }

    /**
     * Called when a transaction is preparing to commit.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionPrepare() {
        return Promise.resolve();
    }

    /**
     * Called when a transaction is rolling back.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    async transactionRollback() {
        return Promise.resolve();
    }

    /**
     * Called when a transaction is committing.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    async transactionCommit() {
        return Promise.resolve();
    }

    /**
     * Called at the end of a transaction.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    async transactionEnd() {
        return Promise.resolve();
    }

}

module.exports = Service;
