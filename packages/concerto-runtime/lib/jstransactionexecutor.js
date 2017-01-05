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

const Logger = require('@ibm/concerto-common').Logger;
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

        // Find all of the scripts that contain a function for the supplied transaction.
        let matchingScripts = this.findScripts(scriptManager, transaction);

        // For each script, build a function.
        let functions = this.compileScripts(matchingScripts, transaction);

        // Bind the API into the global object.
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
        }, Promise.resolve())
            .then(() => {
                LOG.exit(method);
            });

    }

    /**
     * Find all scripts matching this transaction.
     * @param {ScriptManager} scriptManager The script manager to use.
     * @param {Resource} transaction The transaction to execute.
     * @return {Script[]} All scripts matching this transaction.
     */
    findScripts(scriptManager, transaction) {
        const method = 'findScripts';
        LOG.entry(method, scriptManager, transaction);

        // Find all of the scripts that contain a function for the supplied transaction.
        let scripts = scriptManager.getScripts();
        let matchingScripts = scripts.filter((script) => {
            LOG.debug(method, 'Looking at script', script.getIdentifier());
            let matchingFunctionDeclaration = script.getFunctionDeclarations().find((functionDeclaration) => {
                return functionDeclaration.getTransactionDeclarationName() === transaction.getType();
            });
            LOG.debug(method, 'Found a matching function declaration?', matchingFunctionDeclaration ? matchingFunctionDeclaration.getName() : undefined);
            return matchingFunctionDeclaration !== undefined;
        });

        LOG.exit(method, matchingScripts);
        return matchingScripts;
    }

    /**
     * Compile the scripts into functions for execution.
     * @param {Script[]} scripts All scripts matching this transaction.
     * @param {Resource} transaction The transaction to execute.
     * @return {Function[]} All functions to execute.
     */
    compileScripts(scripts, transaction) {
        const method = 'compileScripts';
        LOG.entry(method, scripts, transaction);

        // For each script, build a function.
        let functions = scripts.map((script) => {
            LOG.debug(method, 'Looking at script', script.getIdentifier());
            let source = script.getFunctionDeclarations().reduce((result, functionDeclaration) => {
                LOG.debug(method, 'Appending function declaration', functionDeclaration.getName());
                return result + functionDeclaration.getFunctionText() + '\n';
            }, '');
            source += `return on${transaction.getType()}(transaction);\n`;
            LOG.debug(method, 'Creating new function from source', source);
            return new Function('transaction', source);
        });

        LOG.exit(method, functions);
        return functions;
    }

}

module.exports = JSTransactionExecutor;
