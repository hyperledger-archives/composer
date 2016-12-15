/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const Logger = require('@ibm/ibm-concerto-common').Logger;
const util = require('util');

const LOG = Logger.getLog('EngineTransactions');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 * @memberof module:ibm-concerto-runtime
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
        let transaction = null, resolvedTransaction = null;

        // Parse the transaction from the JSON string..
        LOG.debug(method, 'Parsing transaction from JSON');
        let transactionData = JSON.parse(args[1]);

        // Now we need to convert the JavaScript object into a transaction resource.
        LOG.debug(method, 'Parsing transaction from parsed JSON object');
        // First we parse *our* copy, that is not resolved. This is the copy that gets added to the
        // transaction registry, and is the one in the context (for adding log entries).
        transaction = context.getSerializer().fromJSON(transactionData);
        // Then we parse the *users* copy, that is resolved, and they can modify to their hearts content.
        // This is only given to the user, and is discarded afterwards.
        resolvedTransaction = context.getSerializer().fromJSON(transactionData);

        // Store the transaction in the context.
        context.setTransaction(transaction);

        // Resolve the users copy of the transaction.
        LOG.debug(method, 'Parsed transaction, resolving it', resolvedTransaction);
        return context.getResolver().resolve(resolvedTransaction)
            .then((transaction) => {

                // Find all of the scripts that contain a function for the supplied transaction.
                let scriptManager = context.getScriptManager();
                let scripts = scriptManager.getScripts();
                let matchingScripts = scripts.filter((script) => {
                    LOG.debug(method, 'Looking at script', script.getIdentifier());
                    let matchingFunctionDeclaration = script.getFunctionDeclarations().find((functionDeclaration) => {
                        return functionDeclaration.getTransactionDeclarationName() === transaction.getType();
                    });
                    LOG.debug(method, 'Found a matching function declaration?', matchingFunctionDeclaration ? matchingFunctionDeclaration.getName() : undefined);
                    return matchingFunctionDeclaration !== undefined;
                });

                // For each script, build a function.
                let functions = [];
                matchingScripts.forEach((script) => {
                    LOG.debug(method, 'Looking at script', script.getIdentifier());
                    let source = '';
                    script.getFunctionDeclarations().forEach((functionDeclaration) => {
                        LOG.debug(method, 'Appending function declaration', functionDeclaration.getName());
                        source += functionDeclaration.getFunctionText() + '\n';
                    });
                    source += `return on${transaction.getType()}(transaction);\n`;
                    LOG.debug(method, 'Creating new function from source', source);
                    functions.push(new Function('transaction', source));
                });

                // Bind the API into the global object.
                let api = context.getApi();
                Object.getOwnPropertyNames(api).forEach((key) => {
                    if (typeof api[key] === 'function') {
                        LOG.debug(method, 'Binding API function', key);
                        global[key] = api[key].bind(api);
                    }
                });

                // Execute each function for the transaction.
                return functions.reduce((result, func) => {
                    return result.then(() => {
                        LOG.debug(method, 'Executing function');
                        let funcResult = func(resolvedTransaction);
                        if (funcResult instanceof Promise) {
                            return funcResult.then(() => {
                                LOG.debug(method, 'Function executed (returned promise)');
                            });
                        } else {
                            LOG.debug(method, 'Function executed');
                        }
                    });
                }, Promise.resolve());

            })
            .then(() => {

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
