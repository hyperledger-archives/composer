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

const LOG = Logger.getLog('CompiledScriptBundle');

/**
 * A script compiler compiles all scripts in a script manager into a compiled
 * script bundle that can easily be called by the runtime.
 * @protected
 */
class CompiledScriptBundle {

    /**
     * Constructor.
     * @param {FunctionDeclaration[]} functionDeclarations The function declarations to use.
     * @param {Function} generatorFunction The generator function to use.
     */
    constructor(functionDeclarations, generatorFunction) {
        this.functionDeclarations = functionDeclarations;
        this.generatorFunction = generatorFunction;
    }

    /**
     * Execute the specified transaction.
     * @param {Api} api The API to use.
     * @param {Resource} resolvedTransaction The resolved transaction to execute.
     * @return {Promise} A promise that is resolved when the transaction has been
     * executed, or rejected with an error.
     */
    async execute(api, resolvedTransaction) {
        const method = 'execute';
        LOG.entry(method, api, resolvedTransaction);

        // Find all of the function names.
        const functionNames = this.findFunctionNames(resolvedTransaction);

        // Generate an instance of the compiled script bundle.
        const bundle = this.generatorFunction(api);

        // Execute each function for the transaction.
        const functionReturnValues = [];
        for (const functionName of functionNames) {
            LOG.debug(method, 'Executing function', functionName);
            const func = bundle[functionName];
            const functionReturnValue = await func(resolvedTransaction);
            LOG.debug(method, 'Function executed', typeof functionResult);
            functionReturnValues.push(functionReturnValue);
        }

        LOG.exit(method, functionNames.length, functionReturnValues);
        return { executed: functionNames.length, returnValues: functionReturnValues };
    }

    /**
     * Find all of the function names that should be executed.
     * @param {Resource} transaction The transaction to execute.
     * @return {string[]} All function names to execute.
     */
    findFunctionNames(transaction) {
        const method = 'findFunctionNames';
        LOG.entry(method, transaction);

        // Look at all the functions.
        const functionNames = [];
        this.functionDeclarations.forEach((functionDeclaration) => {

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

        LOG.exit(method, functionNames);
        return functionNames;
    }

}

module.exports = CompiledScriptBundle;
