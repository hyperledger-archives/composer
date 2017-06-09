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
        return new Promise((resolve, reject) => {
            this._transactionStart(readOnly, (error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback transactionStartCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Called at the start of a transaction.
     * @abstract
     * @param {boolean} readOnly Is the transaction read-only?
     * @param {transactionStartCallback} callback The callback function to call when complete.
     */
    _transactionStart(readOnly, callback) {
        callback();
    }

    /**
     * Called when a transaction is preparing to commit.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionPrepare() {
        return new Promise((resolve, reject) => {
            this._transactionPrepare((error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback transactionPrepareCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Called when a transaction is preparing to commit.
     * @abstract
     * @param {transactionPrepareCallback} callback The callback function to call when complete.
     */
    _transactionPrepare(callback) {
        callback();
    }

    /**
     * Called when a transaction is rolling back.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionRollback() {
        return new Promise((resolve, reject) => {
            this._transactionRollback((error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback transactionRollbackCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Called when a transaction is rolling back
     * @abstract
     * @param {transactionRollbackCallback} callback The callback function to call when complete.
     */
    _transactionRollback(callback) {
        callback();
    }

    /**
     * Called when a transaction is committing.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionCommit() {
        return new Promise((resolve, reject) => {
            this._transactionCommit((error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback transactionCommitCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Called when a transaction is committing.
     * @abstract
     * @param {transactionCommitCallback} callback The callback function to call when complete.
     */
    _transactionCommit(callback) {
        callback();
    }

    /**
     * Called at the end of a transaction.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionEnd() {
        return new Promise((resolve, reject) => {
            this._transactionEnd((error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback transactionEndCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Called at the end of a transaction.
     * @abstract
     * @param {transactionEndCallback} callback The callback function to call when complete.
     */
    _transactionEnd(callback) {
        callback();
    }

}

module.exports = Service;
