'use strict';

/**
 * Handle the single annotated transaction (2/4).
 * @param {systest.transactions.TransactionUsingUtilityFunctions} transaction The transaction
 * @return {Promise} A promise that is resolved when complete.
 */
function utilityFuncA(transaction) {
    return utilityFunc2(transaction);
}

/**
 * Handle the single annotated transaction (4/4).
 * @param {systest.transactions.TransactionUsingUtilityFunctions} transaction The transaction
 * @return {Promise} A promise that is resolved when complete.
 */
function utilityFuncB(transaction) {
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
            a.stringValue = transaction.stringValue;
            return ar.add(a);
        });
}
