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
