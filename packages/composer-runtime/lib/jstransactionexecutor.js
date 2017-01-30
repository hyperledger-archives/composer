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
const TransactionExecutor = require('./transactionexecutor');

const LOG = Logger.getLog('JSTransactionExecutor');

/**
 * A class for executing JavaScript transaction processor functions.
 * @protected
 */
class JSTransactionExecutor extends TransactionExecutor {

    /**
     * Get the type of this transaction executor.
     * @return {string} The type of this transaction executor.
     */
    getType() {
        return 'JS';
    }

    /**
     * Execute the specified transaction.
     * @param {Api} api The API to use.
     * @param {ScriptManager} scriptManager The script manager to use.
     * @param {Resource} transaction The transaction to execute.
     * @param {Resource} resolvedTransaction The resolved transaction to execute.
     * @return {Promise} A promise that is resolved when the transaction has been
     * executed, or rejected with an error.
     */
    execute(api, scriptManager, transaction, resolvedTransaction) {
        const method = 'execute';
        LOG.entry(method, api, scriptManager, transaction, resolvedTransaction);

        // Find all of the function names.
        let functionNames = this.findFunctionNames(scriptManager, transaction);

        // If we didn't find any functions to call, then throw an error!
        if (functionNames.length === 0) {
            LOG.error(`Could not find any functions to execute for transaction ${transaction.getFullyQualifiedIdentifier()}`);
            throw new Error(`Could not find any functions to execute for transaction ${transaction.getFullyQualifiedIdentifier()}`);
        }

        // Find all of the scripts, and build a function for each script function to call.
        let functions = this.compileScripts(scriptManager, functionNames);

        // Bind the API into the global object.
        Object.getOwnPropertyNames(api).forEach((key) => {
            LOG.debug(method, 'Binding API function', key);
            global[key] = api[key].bind(api);
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
        }, Promise.resolve())
            .then(() => {
                LOG.exit(method);
            });

    }

    /**
     * Find all of the function names that should be executed.
     * @param {ScriptManager} scriptManager The script manager to use.
     * @param {Resource} transaction The transaction to execute.
     * @return {string[]} All function names to execute.
     */
    findFunctionNames(scriptManager, transaction) {
        const method = 'findFunctionNames';
        LOG.entry(method, scriptManager, transaction);

        // Find all of the scripts.
        let functionNames = [];
        scriptManager.getScripts().forEach((script) => {

            // Look at all the functions.
            LOG.debug(method, 'Looking at script', script.getIdentifier());
            script.getFunctionDeclarations().forEach((functionDeclaration) => {

                // Is this function annotated with @transaction?
                LOG.debug(method, 'Looking at function declaration', functionDeclaration.getName());
                if (functionDeclaration.getDecorators().indexOf('transaction') !== -1) {

                    // Yes - is the type of the only parameter (validated elsewhere)
                    // the same type as the transaction?
                    LOG.debug(method, 'Function is annotated with @transaction');
                    if (functionDeclaration.getParameterTypes()[0] === transaction.getFullyQualifiedType()) {
                        LOG.debug(method, 'Function parameter type matches transaction');
                        functionNames.push(functionDeclaration.getName());
                    } else {
                        LOG.debug(method, 'Function parameter type does not match transaction');
                    }

                // It's not annotated with @transaction, does it start with on<transactionType>?
                // This is to keep supporting the original transaction processor function format
                // which went by naming conventions rather than annotations.
                } else if (functionDeclaration.getTransactionDeclarationName() === transaction.getType()) {
                    LOG.debug(method, 'Function name matches on<transactionType>');
                    functionNames.push(functionDeclaration.getName());

                // Must be a query or utility function.
                } else {
                    LOG.debug(method, 'Function is query or utility function');
                }

            });

        });

        LOG.exit(method, functionNames);
        return functionNames;
    }

    /**
     * Compile the scripts into functions for execution.
     * @param {ScriptManager} scriptManager The script manager to use.
     * @param {string[]} functionNames The function names to execute.
     * @return {Function[]} All functions to execute.
     */
    compileScripts(scriptManager, functionNames) {
        const method = 'compileScripts';
        LOG.entry(method, scriptManager, functionNames);

        // This is the source for all of the scripts.
        let source = '';

        // Find all of the scripts.
        scriptManager.getScripts().forEach((script) => {

            // Concatenate the script source.
            LOG.debug(method, 'Looking at script', script.getIdentifier());
            source += script.getContents() + '\n';

        });

        // For each transaction processor function we found, build a function.
        let functions = functionNames.map((functionName) => {

            // The source for the function is all of the scripts and a call to execute
            // the current transaction processor function.
            LOG.debug(method, 'Building function for transaction processor function', functionName);
            let functionSource = source;
            functionSource += `return ${functionName}($transaction);\n`;
            LOG.debug(method, 'Creating new function from source', functionSource);
            return new Function('$transaction', functionSource);

        });

        LOG.exit(method, functions);
        return functions;
    }

}

module.exports = JSTransactionExecutor;
