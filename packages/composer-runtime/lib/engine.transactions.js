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
const util = require('util');

const LOG = Logger.getLog('EngineTransactions');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 * @memberof module:composer-runtime
 */
class EngineTransactions {

    /**
     * Submit a transaction for execution.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    submitTransaction(context, args) {
        const method = 'submitTransaction';
        LOG.entry(method, context, args);
        if (args.length !== 2) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'submitTransaction', ['registryId', 'serializedResource']));
        }

        // Find the default transaction registry.
        let registryManager = context.getRegistryManager();
        let transaction = null;

        // Parse the transaction from the JSON string..
        LOG.debug(method, 'Parsing transaction from JSON');
        let transactionData = JSON.parse(args[1]);

        // Now we need to convert the JavaScript object into a transaction resource.
        LOG.debug(method, 'Parsing transaction from parsed JSON object');
        // First we parse *our* copy, that is not resolved. This is the copy that gets added to the
        // transaction registry, and is the one in the context (for adding log entries).
        transaction = context.getSerializer().fromJSON(transactionData);

        // Store the transaction in the context.
        context.setTransaction(transaction);

        // This is the count of transaction processor functions executed.
        let totalCount = 0;

        // Resolve the users copy of the transaction.
        LOG.debug(method, 'Parsed transaction, resolving it', transaction);
        let resolvedTransaction;
        return context.getResolver().resolve(transaction)
            .then((resolvedTransaction_) => {

                // Save the resolved transaction.
                resolvedTransaction = resolvedTransaction_;

                // Execute any system transaction processor functions.
                const api = context.getApi();
                return context.getTransactionHandlers().reduce((promise, transactionHandler) => {
                    return promise.then(() => {
                        return transactionHandler.execute(api, resolvedTransaction)
                            .then((count) => {
                                totalCount += count;
                            });
                    });
                }, Promise.resolve());

            })
            .then(() => {

                // Execute any user transaction processor functions.
                const api = context.getApi();
                return context.getCompiledScriptBundle().execute(api, resolvedTransaction)
                    .then((count) => {
                        totalCount += count;
                    });

            })
            .then(() => {

                // Check that a transaction processor function was executed.
                if (totalCount === 0) {
                    const error = new Error(`Could not find any functions to execute for transaction ${resolvedTransaction.getFullyQualifiedIdentifier()}`);
                    LOG.error(method, error);
                    throw error;
                }

                // Get the default transaction registry.
                LOG.debug(method, 'Getting default transaction registry');
                return registryManager.get('Transaction', 'default');

            })
            .then((transactionRegistry) => {

                // Store the transaction in the transaction registry.
                LOG.debug(method, 'Storing executed transaction in transaction registry');
                return transactionRegistry.add(transaction);

            });

    }

}

module.exports = EngineTransactions;
