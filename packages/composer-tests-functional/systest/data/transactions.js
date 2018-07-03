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

/*eslint no-var: 0*/
'use strict';

// this function doesn't do anything but it ensures that the runtime doesn't
// try to create an object with references to it's functions if it did you
// would get ReferenceError: s is not defined
var require2=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require==='function'&&require;if(!u&&a){return a(o,!0);}if(i){return i(o,!0);}var f=new Error('Cannot find module \''+o+'\'');throw f.code='MODULE_NOT_FOUND',f;}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e);},l,l.exports,e,t,n,r);}return n[o].exports;}var i=typeof require==='function'&&require;for(var o=0;o<r.length;o++){s(r[o]);}return s;})({'json-logic-js':[function(require,module,exports){
},{}]},{},[]);


function onSimpleTransactionWithPrimitiveTypes(transaction) {
    // console.log(JSON.stringify(transaction));
    var assertEqual = function (property, actual, expected) {
        if (typeof actual !== typeof expected) {
            throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') types not equal');
        } else if (actual instanceof Date) {
            if (actual.getTime() !== expected.getTime()) {
                throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') values not equal');
            }
        } else if (actual !== expected) {
            throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') values not equal');
        }
    };
    assertEqual('stringValue', transaction.stringValue, 'what a transaction');
    assertEqual('doubleValue', transaction.doubleValue, 3.142);
    assertEqual('integerValue', transaction.integerValue, 2000000000);
    assertEqual('longValue', transaction.longValue, 16000000000000);
    assertEqual('dateTimeValue', transaction.dateTimeValue, new Date('2016-10-14T18:30:30+00:00'));
    assertEqual('booleanValue', transaction.booleanValue, true);
    assertEqual('enumValue', transaction.enumValue, 'SUCH');
}

function onSimpleTransactionWithPrimitiveTypeArrays(transaction) {
    // console.log(JSON.stringify(transaction));
    var assertArraysEqual = function (property, actuals, expecteds) {
        if (actuals.length !== expecteds.length) {
            throw new Error('assertArraysEqual(' + property + ', ' + actuals + ', ' + expecteds + ') lengths not equal');
        }
        for (var i = 0; i < actuals.length; i++) {
            var actual = actuals[i];
            var expected = expecteds[i];
            if (typeof actual !== typeof expected) {
                throw new Error('assertArraysEqual(' + property + ', ' + actuals + ', ' + expecteds + ') types not equal');
            } else if (actual instanceof Date) {
                if (actual.getTime() !== expected.getTime()) {
                    throw new Error('assertArraysEqual(' + property + ', ' + actuals + ', ' + expecteds + ') values not equal');
                }
            } else if (actual !== expected) {
                throw new Error('assertArraysEqual(' + property + ', ' + actuals + ', ' + expecteds + ') values not equal');
            }
        }
    };
    assertArraysEqual('stringValues', transaction.stringValues, ['what a transaction', 'hail the party parrot']);
    assertArraysEqual('doubleValues', transaction.doubleValues, [3.142, 6.666]);
    assertArraysEqual('integerValues', transaction.integerValues, [2000000000, 16384]);
    assertArraysEqual('longValues', transaction.longValues, [16000000000000, 32000000]);
    assertArraysEqual('dateTimeValues', transaction.dateTimeValues, [new Date('2016-10-14T18:30:30+00:00'), new Date('1066-10-14T18:30:30+00:00')]);
    assertArraysEqual('booleanValues', transaction.booleanValues, [true, false]);
    assertArraysEqual('enumValues', transaction.enumValues, ['SUCH', 'MANY']);
}

function onSimpleTransactionWithAssets(transaction) {
    // console.log(JSON.stringify(transaction));
    var assertEqual = function (property, actual, expected) {
        if (typeof actual !== typeof expected) {
            throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') types not equal');
        } else if (actual instanceof Date) {
            if (actual.getTime() !== expected.getTime()) {
                throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') values not equal');
            }
        } else if (actual !== expected) {
            throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') values not equal');
        }
    };
    assertEqual('stringAsset.assetId', transaction.stringAsset.assetId, 'stringAsset1');
    assertEqual('stringAsset.stringValue', transaction.stringAsset.stringValue, 'party parrot in hursley');
    assertEqual('integerAsset.assetId', transaction.integerAsset.assetId, 'integerAsset1');
    assertEqual('integerAsset.integerValue', transaction.integerAsset.integerValue, 5318008);
}

function onSimpleTransactionWithAssetArrays(transaction) {
    // console.log(JSON.stringify(transaction));
    var assertEqual = function (property, actual, expected) {
        if (typeof actual !== typeof expected) {
            throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') types not equal');
        } else if (actual instanceof Date) {
            if (actual.getTime() !== expected.getTime()) {
                throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') values not equal');
            }
        } else if (actual !== expected) {
            throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') values not equal');
        }
    };
    assertEqual('stringAssets.length', transaction.stringAssets.length, 2);
    assertEqual('stringAssets[0].assetId', transaction.stringAssets[0].assetId, 'stringAsset1');
    assertEqual('stringAssets[0].stringValue', transaction.stringAssets[0].stringValue, 'party parrot in hursley');
    assertEqual('stringAssets[1].assetId', transaction.stringAssets[1].assetId, 'stringAsset2');
    assertEqual('stringAssets[1].stringValue', transaction.stringAssets[1].stringValue, 'party parrot in san francisco');
    assertEqual('integerAssets.length', transaction.stringAssets.length, 2);
    assertEqual('integerAssets[0].assetId', transaction.integerAssets[0].assetId, 'integerAsset1');
    assertEqual('integerAssets[0].integerValue', transaction.integerAssets[0].integerValue, 5318008);
    assertEqual('integerAssets[1].assetId', transaction.integerAssets[1].assetId, 'integerAsset2');
    assertEqual('integerAssets[1].integerValue', transaction.integerAssets[1].integerValue, 56373351);
}

function onSimpleTransactionWithAssetRelationships(transaction) {
    // console.log(JSON.stringify(transaction));
    var assertEqual = function (property, actual, expected) {
        if (typeof actual !== typeof expected) {
            throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') types not equal');
        } else if (actual instanceof Date) {
            if (actual.getTime() !== expected.getTime()) {
                throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') values not equal');
            }
        } else if (actual !== expected) {
            throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') values not equal');
        }
    };
    assertEqual('stringAsset.assetId', transaction.stringAsset.assetId, 'stringAsset1');
    assertEqual('stringAsset.stringValue', transaction.stringAsset.stringValue, 'party parrot in hursley');
    assertEqual('integerAsset.assetId', transaction.integerAsset.assetId, 'integerAsset1');
    assertEqual('integerAsset.integerValue', transaction.integerAsset.integerValue, 5318008);
}

function onSimpleTransactionWithAssetRelationshipArrays(transaction) {
    // console.log(JSON.stringify(transaction));
    var assertEqual = function (property, actual, expected) {
        if (typeof actual !== typeof expected) {
            throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') types not equal');
        } else if (actual instanceof Date) {
            if (actual.getTime() !== expected.getTime()) {
                throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') values not equal');
            }
        } else if (actual !== expected) {
            throw new Error('assertEqual(' + property + ', ' + actual + ', ' + expected + ') values not equal');
        }
    };
    assertEqual('stringAssets.length', transaction.stringAssets.length, 2);
    assertEqual('stringAssets[0].assetId', transaction.stringAssets[0].assetId, 'stringAsset1');
    assertEqual('stringAssets[0].stringValue', transaction.stringAssets[0].stringValue, 'party parrot in hursley');
    assertEqual('stringAssets[1].assetId', transaction.stringAssets[1].assetId, 'stringAsset2');
    assertEqual('stringAssets[1].stringValue', transaction.stringAssets[1].stringValue, 'party parrot in san francisco');
    assertEqual('integerAssets.length', transaction.stringAssets.length, 2);
    assertEqual('integerAssets[0].assetId', transaction.integerAssets[0].assetId, 'integerAsset1');
    assertEqual('integerAssets[0].integerValue', transaction.integerAssets[0].integerValue, 5318008);
    assertEqual('integerAssets[1].assetId', transaction.integerAssets[1].assetId, 'integerAsset2');
    assertEqual('integerAssets[1].integerValue', transaction.integerAssets[1].integerValue, 56373351);
}

// example using async/await
async function onGetAllAssetsFromAssetRegistryTransaction(transaction) {
    let ar = await getAssetRegistry('systest.transactions.SimpleStringAsset');
    let as = await ar.getAll();
    as.sort(function (a, b) {
        return a.assetId.localeCompare(b.assetId);
    });
    if (as.length !== 2) { throw new Error('length does not match'); }
    if (typeof as[0] !== 'object') { throw new Error('first asset is not an object'); }
    if (typeof as[1] !== 'object') { throw new Error('second asset is not an object'); }
    if (as[0].assetId !== 'stringAsset1') { throw new Error('first asset has invalid value'); }
    if (as[0].stringValue !== 'party parrot in hursley') { throw new Error('first asset has invalid value'); }
    if (as[1].assetId !== 'stringAsset2') { throw new Error('second asset has invalid value'); }
    if (as[1].stringValue !== 'party parrot in san francisco') { throw new Error('second asset has invalid value'); }
}

function onGetAssetFromAssetRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            return ar.get('stringAsset1');
        })
        .then(function (a) {
            if (typeof a !== 'object') { return new Error('asset is not an object'); }
            if (a.assetId !== 'stringAsset1') { return new Error('asset has invalid value'); }
            if (a.stringValue !== 'party parrot in hursley') { return new Error('asset has invalid value'); }
        });
}

function onAddAssetInTransactionToAssetRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            return ar.add(transaction.stringAsset);
        });
}

function onAddAssetWithRelationshipInTransactionToAssetRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleRelationshipAsset')
        .then(function (ar) {
            return ar.add(transaction.relationshipAsset);
        });
}

function onAddNewAssetToAssetRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
            a.stringValue = 'party parrot in hursley';
            return ar.add(a);
        });
}

function onAddNewAssetWithRelationshipToAssetRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleRelationshipAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
            a.stringAsset = f.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
            return ar.add(a);
        });
}

function onUpdateAssetInTransactionInAssetRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            return ar.update(transaction.stringAsset);
        });
}

function onUpdateAssetWithRelationshipInTransactionInAssetRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleRelationshipAsset')
        .then(function (ar) {
            return ar.update(transaction.relationshipAsset);
        });
}

function onUpdateNewAssetInAssetRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
            a.stringValue = 'party parrot in san francisco';
            return ar.update(a);
        });
}

function onUpdateNewAssetWithRelationshipToAssetRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleRelationshipAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
            a.stringAsset = f.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset2');
            return ar.update(a);
        });
}

function onRemoveAssetInTransactionInAssetRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            return ar.remove(transaction.stringAsset);
        });
}

function onRemoveAssetWithRelationshipInTransactionInAssetRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleRelationshipAsset')
        .then(function (ar) {
            return ar.remove(transaction.relationshipAsset);
        });
}

function onRemoveNewAssetInAssetRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
            a.stringValue = 'party parrot in san francisco';
            return ar.remove(a);
        });
}

function onRemoveNewAssetWithRelationshipInAssetRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleRelationshipAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
            a.stringAsset = f.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
            return ar.remove(a);
        });
}

// IMPORTANT, the blank lines between comments and some TP functions is INTENTIONAL
// it is testing that these types of transactions are correctly identified even
// through the function definition doesn't directly follow the comment

/**
 * Handle the single annotated transaction.
 * @param {systest.transactions.SingleAnnotatedTransaction} transaction The transaction
 * @transaction
 * @return {Promise} A promise that is resolved when complete.
 */

function handleTheSingleAnnotatedTransaction(transaction) {
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
            a.stringValue = transaction.stringValue;
            return ar.add(a);
        });
}

/**
 * Handle the first annotated transaction.
 * @param {systest.transactions.MultipleAnnotatedTransaction} transaction The transaction
 * @transaction
 * @return {Promise} A promise that is resolved when complete.
 */
function handleMultipleAnnotatedTransactionFirst(transaction) {
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
            a.stringValue = transaction.stringValue1;
            return ar.add(a);
        });
}

/**
 * Handle the second annotated transaction.
 * @param {systest.transactions.MultipleAnnotatedTransaction} transaction The transaction
 * @transaction
 * @return {Promise} A promise that is resolved when complete.
 */


function handleMultipleAnnotatedTransactionSecond(transaction) {
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleStringAsset', 'stringAsset2');
            a.stringValue = transaction.stringValue2;
            return ar.add(a);
        });
}

/**
 * Handle the single annotated transaction (1/4).
 * @param {systest.transactions.TransactionUsingUtilityFunctions} transaction The transaction
 * @return {Promise} A promise that is resolved when complete.
 */
function utilityFunc1(transaction) {
    return utilityFuncA(transaction);
}

/**
 * Handle the single annotated transaction.
 * @param {systest.transactions.TransactionUsingUtilityFunctions} transaction The transaction
 * @transaction
 * @return {Promise} A promise that is resolved when complete.
 */
function handleTheTransactionUsingUtilityFunctions(transaction) {
    return utilityFunc1(transaction);
}

/**
 * Handle the single annotated transaction (3/4).
 * @param {systest.transactions.TransactionUsingUtilityFunctions} transaction The transaction
 * @return {Promise} A promise that is resolved when complete.
 */
function utilityFunc2(transaction) {
    return utilityFuncB(transaction);
}

/**
 * Handle a transaction that returns a concept.
 * @param {systest.transactions.TransactionThatReturnsConcept} transaction The transaction
 * @return {systest.transactions.TransactionReceipt} The transaction receipt
 * @transaction
 */
async function transactionThatReturnsConcept(transaction) {
    const concept = getFactory().newConcept('systest.transactions', 'TransactionReceipt');
    concept.value = transaction.value;
    return concept;
}

/**
 * Handle a transaction that returns a concept array.
 * @param {systest.transactions.TransactionThatReturnsConceptArray} transaction The transaction
 * @return {systest.transactions.TransactionReceipt} The transaction receipt array
 * @transaction
 */
async function transactionThatReturnsConceptArray(transaction) {
    const concept1 = getFactory().newConcept('systest.transactions', 'TransactionReceipt');
    concept1.value = transaction.value + '1';
    const concept2 = getFactory().newConcept('systest.transactions', 'TransactionReceipt');
    concept2.value = transaction.value + '2';
    return [concept1, concept2];
}

/**
 * Handle a transaction that returns a date/time.
 * @param {systest.transactions.TransactionThatReturnsDateTime} transaction The transaction
 * @return {Date} The date/time
 * @transaction
 */
async function transactionThatReturnsDateTime(transaction) {
    return transaction.value;
}

/**
 * Handle a transaction that returns a integer.
 * @param {systest.transactions.TransactionThatReturnsInteger} transaction The transaction
 * @return {number} The integer
 * @transaction
 */
async function transactionThatReturnsInteger(transaction) {
    return transaction.value;
}

/**
 * Handle a transaction that returns a long.
 * @param {systest.transactions.TransactionThatReturnsLong} transaction The transaction
 * @return {number} The long
 * @transaction
 */
async function transactionThatReturnsLong(transaction) {
    return transaction.value;
}

/**
 * Handle a transaction that returns a double.
 * @param {systest.transactions.TransactionThatReturnsDouble} transaction The transaction
 * @return {number} The double
 * @transaction
 */
async function transactionThatReturnsDouble(transaction) {
    return transaction.value;
}

/**
 * Handle a transaction that returns a double array.
 * @param {systest.transactions.TransactionThatReturnsDoubleArray} transaction The transaction
 * @return {number} The double array
 * @transaction
 */
async function transactionThatReturnsDoubleArray(transaction) {
    return [transaction.value + 1, transaction.value + 2];
}

/**
 * Handle a transaction that returns a boolean.
 * @param {systest.transactions.TransactionThatReturnsBoolean} transaction The transaction
 * @return {boolean} The boolean
 * @transaction
 */
async function transactionThatReturnsBoolean(transaction) {
    return transaction.value;
}

/**
 * Handle a transaction that returns a string.
 * @param {systest.transactions.TransactionThatReturnsString} transaction The transaction
 * @return {string} The string
 * @transaction
 */
async function transactionThatReturnsString(transaction) {
    return transaction.value;
}

/**
 * Handle a transaction that returns a string array.
 * @param {systest.transactions.TransactionThatReturnsStringArray} transaction The transaction
 * @return {string[]} The string array
 * @transaction
 */
async function transactionThatReturnsStringArray(transaction) {
    return [transaction.value + '1', transaction.value + '2'];
}

/**
 * Handle a transaction that returns a enum.
 * @param {systest.transactions.TransactionThatReturnsEnum} transaction The transaction
 * @return {systest.transactions.SimpleEnum} The enum
 * @transaction
 */
async function transactionThatReturnsEnum(transaction) {
    return 'WOW';
}

/**
 * Handle a transaction that returns a enum array.
 * @param {systest.transactions.TransactionThatReturnsEnumArray} transaction The transaction
 * @return {systest.transactions.SimpleEnum[]} The enum array
 * @transaction
 */
async function transactionThatReturnsEnumArray(transaction) {
    return ['SUCH', 'MANY'];
}

/**
 * Handle a transaction with @commit(true).
 * @param {systest.transactions.TransactionWithCommitTrue} transaction The transaction
 * @transaction
 */
async function transactionWithCommitTrue(transaction) {
    const assetRegistry = await getAssetRegistry('systest.transactions.SimpleStringAsset');
    const factory = getFactory();
    const asset  = factory.newResource('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
    asset.stringValue = transaction.stringValue;
    await assetRegistry.add(asset);
}

/**
 * Handle a transaction with @commit(false).
 * @param {systest.transactions.TransactionWithCommitFalse} transaction The transaction
 * @transaction
 */
async function transactionWithCommitFalse(transaction) {
    await transactionWithCommitTrue(transaction);
}
