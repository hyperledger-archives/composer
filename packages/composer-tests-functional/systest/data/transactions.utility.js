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
            let f = getFactory();
            let a = f.newResource('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
            a.stringValue = transaction.stringValue;
            return ar.add(a);
        });
}
