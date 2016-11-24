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

const util = require('util');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
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
        if (args.length !== 3) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'submitTransaction', ['registryId', 'resourceId', 'resourceData']));
        }

        // Parse the transaction and resolve it.
        let transactionData = JSON.parse(args[2]);
        let transaction = context.getSerializer().fromJSON(transactionData);
        return context.getResolver().resolve(transaction)
            .then((transaction) => {

                // Find all of the scripts that contain a function for the supplied transaction.
                let scriptManager = context.getScriptManager();
                let scripts = scriptManager.getScripts();
                let matchingScripts = scripts.filter((script) => {
                    let matchingFunctionDeclaration = script.getFunctionDeclarations().find((functionDeclaration) => {
                        return functionDeclaration.getTransactionDeclarationName() === transaction.getType();
                    });
                    return matchingFunctionDeclaration !== undefined;
                });

                // For each script, build a function.
                let functions = [];
                matchingScripts.forEach((script) => {
                    let source = '';
                    script.getFunctionDeclarations().forEach((functionDeclaration) => {
                        source += functionDeclaration.getFunctionText() + '\n';
                    });
                    source += `on${transaction.getType()}(transaction);\n`;
                    functions.push(new Function('transaction', source));
                });

                // Execute each function for the transaction.
                return functions.reduce((result, func) => {
                    return result.then(() => {
                        func(transaction);
                    });
                }, Promise.resolve());

            });

    }

}

module.exports = EngineTransactions;
