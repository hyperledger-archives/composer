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

function onSimpleTransaction (transaction) {

}

function onSimpleTransactionWithPrimitiveTypes (transaction) {
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

function onSimpleTransactionWithPrimitiveTypeArrays (transaction) {
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

function onSimpleTransactionWithAssets (transaction) {
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

function onSimpleTransactionWithAssetArrays (transaction) {
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

function onSimpleTransactionWithAssetRelationships (transaction) {
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

function onSimpleTransactionWithAssetRelationshipArrays (transaction) {
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

function onGetAllAssetsFromAssetRegistryTransaction (transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            return ar.getAll();
        })
        .then(function (as) {
            as.sort(function (a, b) {
                return a.assetId.localeCompare(b.assetId);
            });
            // console.log(JSON.stringify(as));
            if (as.length !== 2) {
                throw new Error('length does not match');
            }
            if (typeof as[0] !== 'object') {
                throw new Error('first asset is not an object');
            }
            if (typeof as[1] !== 'object') {
                throw new Error('second asset is not an object');
            }
            if (as[0].assetId !== 'stringAsset1') {
                throw new Error('first asset has invalid value');
            }
            if (as[0].stringValue !== 'party parrot in hursley') {
                throw new Error('first asset has invalid value');
            }
            if (as[1].assetId !== 'stringAsset2') {
                throw new Error('second asset has invalid value');
            }
            if (as[1].stringValue !== 'party parrot in san francisco') {
                throw new Error('second asset has invalid value');
            }
        });
}

// example using async/await
async function onGetAssetFromAssetRegistryTransaction (transaction) {
    // console.log(JSON.stringify(transaction));
    let ar = await getAssetRegistry('systest.transactions.SimpleStringAsset');
    let a = await ar.get('stringAsset1');
    if (typeof a !== 'object') {
        return new Error('asset is not an object');
    }
    if (a.assetId !== 'stringAsset1') {
        return new Error('asset has invalid value');
    }
    if (a.stringValue !== 'party parrot in hursley') {
        return new Error('asset has invalid value');
    }
}

function onAddAssetInTransactionToAssetRegistryTransaction (transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            return ar.add(transaction.stringAsset);
        });
}

function onAddAssetWithRelationshipInTransactionToAssetRegistryTransaction (transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleRelationshipAsset')
        .then(function (ar) {
            return ar.add(transaction.relationshipAsset);
        });
}

function onAddNewAssetToAssetRegistryTransaction (transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
            a.stringValue = 'party parrot in hursley';
            return ar.add(a);
        });
}

function onAddNewAssetWithRelationshipToAssetRegistryTransaction (transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleRelationshipAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
            a.stringAsset = f.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
            return ar.add(a);
        });
}

function onUpdateAssetInTransactionInAssetRegistryTransaction (transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            return ar.update(transaction.stringAsset);
        });
}

function onUpdateAssetWithRelationshipInTransactionInAssetRegistryTransaction (transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleRelationshipAsset')
        .then(function (ar) {
            return ar.update(transaction.relationshipAsset);
        });
}

function onUpdateNewAssetInAssetRegistryTransaction (transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
            a.stringValue = 'party parrot in san francisco';
            return ar.update(a);
        });
}

function onUpdateNewAssetWithRelationshipToAssetRegistryTransaction (transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleRelationshipAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
            a.stringAsset = f.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset2');
            return ar.update(a);
        });
}

function onRemoveAssetInTransactionInAssetRegistryTransaction (transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            return ar.remove(transaction.stringAsset);
        });
}

function onRemoveAssetWithRelationshipInTransactionInAssetRegistryTransaction (transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleRelationshipAsset')
        .then(function (ar) {
            return ar.remove(transaction.relationshipAsset);
        });
}

function onRemoveNewAssetInAssetRegistryTransaction (transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleStringAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
            a.stringValue = 'party parrot in san francisco';
            return ar.remove(a);
        });
}

function onRemoveNewAssetWithRelationshipInAssetRegistryTransaction (transaction) {
    // console.log(JSON.stringify(transaction));
    return getAssetRegistry('systest.transactions.SimpleRelationshipAsset')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
            a.stringAsset = f.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
            return ar.remove(a);
        });
}

/**
 * Handle the single annotated transaction.
 * @param {systest.transactions.SingleAnnotatedTransaction} transaction The transaction
 * @transaction
 * @return {Promise} A promise that is resolved when complete.
 */
function handleTheSingleAnnotatedTransaction (transaction) {
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
function handleMultipleAnnotatedTransactionFirst (transaction) {
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
function handleMultipleAnnotatedTransactionSecond (transaction) {
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
function utilityFunc1 (transaction) {
    return utilityFuncA(transaction);
}

/**
 * Handle the single annotated transaction.
 * @param {systest.transactions.TransactionUsingUtilityFunctions} transaction The transaction
 * @transaction
 * @return {Promise} A promise that is resolved when complete.
 */
function handleTheTransactionUsingUtilityFunctions (transaction) {
    return utilityFunc1(transaction);
}

/**
 * Handle the single annotated transaction (3/4).
 * @param {systest.transactions.TransactionUsingUtilityFunctions} transaction The transaction
 * @return {Promise} A promise that is resolved when complete.
 */
function utilityFunc2 (transaction) {
    return utilityFuncB(transaction);
}

/**
 * handle function with native api
 * @param {systest.transactions.SimpleNativePutStateTransaction} transaction The transaction
 * @transaction
 * @return {Promise} A promise that is resolved when complete.
 */
function simpleNativeAddStateTransaction (transaction) {
    const id = transaction.assetId;
    const value = transaction.stringValue;

    const nativeKey = getNativeAPI().createCompositeKey('Asset:systest.transactions.SimpleStringAsset', [id]);

    const data = {
        $class : 'systest.transactions.SimpleStringAsset',
        assetId : id,
        stringValue : value
    };

    return getNativeAPI().putState(nativeKey, Buffer.from(JSON.stringify(data)));
}

/**
 * handle function with native api
 * @param {systest.transactions.SimpleNativeHistoryTransaction} transaction The transaction
 * @transaction
 * @return {Promise} A promise that is resolved when complete.
 */
async function simpleNativeHistoryTransaction (transaction) {
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

    const id = transaction.assetId;
    const nativeSupport = transaction.nativeSupport;

    try {
        const nativeKey = getNativeAPI().createCompositeKey('Asset:systest.transactions.SimpleStringAsset', [id]);
        const iterator = await getNativeAPI().getHistoryForKey(nativeKey);
        let results = [];
        let res = {done : false};
        while (!res.done) {
            res = await iterator.next();

            if (res && res.value && res.value.value) {
                let val = res.value.value.toString('utf8');
                if (val.length > 0) {
                    results.push(JSON.parse(val));
                }
            }
            if (res && res.done) {
                try {
                    iterator.close();
                }
                catch (err) {
                }
            }
        }

        assertEqual('results length', results.length, 2);
        assertEqual('first string value', results[0].stringValue, 'hello world');
        assertEqual('second string value', results[1].stringValue, 'hello bob');
    } catch (error) {
        if (nativeSupport) {
            throw error;
        }
    }
}

/**
 * handle function with native api
 * @param {systest.transactions.AdvancedInvokeChainCodeTransaction} transaction The transaction
 * @transaction
 * @return {Promise} A promise that is resolved when complete.
 */
async function AdvancedInvokeChainCodeTransaction (transaction) {
    const id = transaction.assetId;
    const channel = transaction.channel;
    const chainCodeName = transaction.chainCodeName;
    const expectedValue = transaction.expectedValue;

    let assertEqual = function (property, actual, expected) {
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

    const otherNetworkData = await getNativeAPI().invokeChaincode(chainCodeName, ['getResourceInRegistry', 'Asset', 'systest.transactions.assets.SimpleStringAsset', id], channel);

    const stringAsset = new Buffer(otherNetworkData.payload.toArrayBuffer()).toString('utf8');
    const asset = JSON.parse(stringAsset);

    assertEqual('string value', asset.stringValue, expectedValue);
}

/**
 * handle function with native api
 * @param {systest.transactions.AdvancedInvokeChainCodeError} transaction The transaction
 * @transaction
 * @return {Promise} A promise that is resolved when complete.
 */
async function AdvancedInvokeChainCodeError (transaction) {
    const channel = transaction.channel;
    const chainCodeName = transaction.chainCodeName;

    // 0 = ok, 1 = wrong error message, 2 = no error message
    let resultOfTest = 2;
    let error;
    try {
        await getNativeAPI().invokeChaincode(chainCodeName, ['getResourceInRegistry', 'Asset', 'systest.transactions.assets.SimpleStringAsset'], channel);
    } catch(err) {
        resultOfTest = 0;
        if (err.message.match(/Invalid arguments .* to function .*, expecting/) === null) {
            error = err;
            resultOfTest = 1;
        }
    }

    switch(resultOfTest) {
    case 1:
        throw new Error('unexpected error received: ' + error.message);
    case 2:
        throw new Error('expected an error to be thrown, but no error was thrown');
    case 0:
        break;
    default:
        throw new Error('ok, this should never have happened.');
    }

}
