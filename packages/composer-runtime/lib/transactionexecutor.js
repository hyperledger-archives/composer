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
 * A class for executing transaction processor functions.
 * @protected
 */
class TransactionExecutor {

    /**
     * Get the type of this transaction executor.
     * @abstract
     * @return {string} The type of this transaction executor.
     */
    getType() {
        throw new Error('abstract function called');
    }

    /**
     * Execute the specified transaction.
     * @abstract
     * @param {Api} api The API to use.
     * @param {ScriptManager} scriptManager The script manager to use.
     * @param {Resource} transaction The transaction to execute.
     * @param {Resource} resolvedTransaction The resolved transaction to execute.
     * @return {Promise} A promise that is resolved when the transaction has been
     * executed, or rejected with an error.
     */
    execute(api, scriptManager, transaction, resolvedTransaction) {
        return Promise.reject(new Error('abstract function called'));
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

}

module.exports = TransactionExecutor;
