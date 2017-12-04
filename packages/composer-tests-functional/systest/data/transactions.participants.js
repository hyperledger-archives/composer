/*eslint no-var: 0*/
'use strict';

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

function onSimpleTransactionWithParticipants(transaction) {
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
    assertEqual('stringParticipant.participantId', transaction.stringParticipant.participantId, 'stringParticipant1');
    assertEqual('stringParticipant.stringValue', transaction.stringParticipant.stringValue, 'party parrot in hursley');
    assertEqual('integerParticipant.participantId', transaction.integerParticipant.participantId, 'integerParticipant1');
    assertEqual('integerParticipant.integerValue', transaction.integerParticipant.integerValue, 5318008);
}

function onSimpleTransactionWithParticipantArrays(transaction) {
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
    assertEqual('stringParticipants.length', transaction.stringParticipants.length, 2);
    assertEqual('stringParticipants[0].participantId', transaction.stringParticipants[0].participantId, 'stringParticipant1');
    assertEqual('stringParticipants[0].stringValue', transaction.stringParticipants[0].stringValue, 'party parrot in hursley');
    assertEqual('stringParticipants[1].participantId', transaction.stringParticipants[1].participantId, 'stringParticipant2');
    assertEqual('stringParticipants[1].stringValue', transaction.stringParticipants[1].stringValue, 'party parrot in san francisco');
    assertEqual('integerParticipants.length', transaction.stringParticipants.length, 2);
    assertEqual('integerParticipants[0].participantId', transaction.integerParticipants[0].participantId, 'integerParticipant1');
    assertEqual('integerParticipants[0].integerValue', transaction.integerParticipants[0].integerValue, 5318008);
    assertEqual('integerParticipants[1].participantId', transaction.integerParticipants[1].participantId, 'integerParticipant2');
    assertEqual('integerParticipants[1].integerValue', transaction.integerParticipants[1].integerValue, 56373351);
}

function onSimpleTransactionWithParticipantRelationships(transaction) {
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
    assertEqual('stringParticipant.participantId', transaction.stringParticipant.participantId, 'stringParticipant1');
    assertEqual('stringParticipant.stringValue', transaction.stringParticipant.stringValue, 'party parrot in hursley');
    assertEqual('integerParticipant.participantId', transaction.integerParticipant.participantId, 'integerParticipant1');
    assertEqual('integerParticipant.integerValue', transaction.integerParticipant.integerValue, 5318008);
}

function onSimpleTransactionWithParticipantRelationshipArrays(transaction) {
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
    assertEqual('stringParticipants.length', transaction.stringParticipants.length, 2);
    assertEqual('stringParticipants[0].participantId', transaction.stringParticipants[0].participantId, 'stringParticipant1');
    assertEqual('stringParticipants[0].stringValue', transaction.stringParticipants[0].stringValue, 'party parrot in hursley');
    assertEqual('stringParticipants[1].participantId', transaction.stringParticipants[1].participantId, 'stringParticipant2');
    assertEqual('stringParticipants[1].stringValue', transaction.stringParticipants[1].stringValue, 'party parrot in san francisco');
    assertEqual('integerParticipants.length', transaction.stringParticipants.length, 2);
    assertEqual('integerParticipants[0].participantId', transaction.integerParticipants[0].participantId, 'integerParticipant1');
    assertEqual('integerParticipants[0].integerValue', transaction.integerParticipants[0].integerValue, 5318008);
    assertEqual('integerParticipants[1].participantId', transaction.integerParticipants[1].participantId, 'integerParticipant2');
    assertEqual('integerParticipants[1].integerValue', transaction.integerParticipants[1].integerValue, 56373351);
}

// example of async/await
async function onGetAllParticipantsFromParticipantRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    let ar = await getParticipantRegistry('systest.transactions.participants.SimpleStringParticipant');
    let as = await ar.getAll();
    as.sort(function (a, b) {
        return a.participantId.localeCompare(b.participantId);
    });
    // console.log(JSON.stringify(as));
    if (as.length !== 2) { throw new Error('length does not match'); }
    if (typeof as[0] !== 'object') { throw new Error('first participant is not an object'); }
    if (typeof as[1] !== 'object') { throw new Error('second participant is not an object'); }
    if (as[0].participantId !== 'stringParticipant1') { throw new Error('first participant has invalid value'); }
    if (as[0].stringValue !== 'party parrot in hursley') { throw new Error('first participant has invalid value'); }
    if (as[1].participantId !== 'stringParticipant2') { throw new Error('second participant has invalid value'); }
    if (as[1].stringValue !== 'party parrot in san francisco') { throw new Error('second participant has invalid value'); }
}

function onGetParticipantFromParticipantRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getParticipantRegistry('systest.transactions.participants.SimpleStringParticipant')
        .then(function (ar) {
            return ar.get('stringParticipant1');
        })
        .then(function (a) {
            if (typeof a !== 'object') { return new Error('participant is not an object'); }
            if (a.participantId !== 'stringParticipant1') { return new Error('participant has invalid value'); }
            if (a.stringValue !== 'party parrot in hursley') { return new Error('participant has invalid value'); }
        });
}

// example using async/await
async function onExistsParticipantInParticipantRegistryTransaction(transaction) {
    let pr = await getParticipantRegistry('systest.transactions.participants.SimpleStringParticipant');
    let exists = await pr.exists('stringParticipant1');
    if (exists !== true) { return new Error('participant does not exist'); }
    exists = await pr.exists('stringParticipant2');
    if (exists !== false) { return new Error('participant does exist'); }
}

function onAddParticipantInTransactionToParticipantRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getParticipantRegistry('systest.transactions.participants.SimpleStringParticipant')
        .then(function (ar) {
            return ar.add(transaction.stringParticipant);
        });
}

function onAddParticipantWithRelationshipInTransactionToParticipantRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getParticipantRegistry('systest.transactions.participants.SimpleRelationshipParticipant')
        .then(function (ar) {
            return ar.add(transaction.relationshipParticipant);
        });
}

function onAddNewParticipantToParticipantRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getParticipantRegistry('systest.transactions.participants.SimpleStringParticipant')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions.participants', 'SimpleStringParticipant', 'stringParticipant1');
            a.stringValue = 'party parrot in hursley';
            return ar.add(a);
        });
}

function onAddNewParticipantWithRelationshipToParticipantRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getParticipantRegistry('systest.transactions.participants.SimpleRelationshipParticipant')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions.participants', 'SimpleRelationshipParticipant', 'relationshipParticipant1');
            a.stringParticipant = f.newRelationship('systest.transactions.participants', 'SimpleStringParticipant', 'stringParticipant1');
            return ar.add(a);
        });
}

function onUpdateParticipantInTransactionInParticipantRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getParticipantRegistry('systest.transactions.participants.SimpleStringParticipant')
        .then(function (ar) {
            return ar.update(transaction.stringParticipant);
        });
}

function onUpdateParticipantWithRelationshipInTransactionInParticipantRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getParticipantRegistry('systest.transactions.participants.SimpleRelationshipParticipant')
        .then(function (ar) {
            return ar.update(transaction.relationshipParticipant);
        });
}

function onUpdateNewParticipantInParticipantRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getParticipantRegistry('systest.transactions.participants.SimpleStringParticipant')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions.participants', 'SimpleStringParticipant', 'stringParticipant1');
            a.stringValue = 'party parrot in san francisco';
            return ar.update(a);
        });
}

function onUpdateNewParticipantWithRelationshipToParticipantRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getParticipantRegistry('systest.transactions.participants.SimpleRelationshipParticipant')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions.participants', 'SimpleRelationshipParticipant', 'relationshipParticipant1');
            a.stringParticipant = f.newRelationship('systest.transactions.participants', 'SimpleStringParticipant', 'stringParticipant2');
            return ar.update(a);
        });
}

function onRemoveParticipantInTransactionInParticipantRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getParticipantRegistry('systest.transactions.participants.SimpleStringParticipant')
        .then(function (ar) {
            return ar.remove(transaction.stringParticipant);
        });
}

function onRemoveParticipantWithRelationshipInTransactionInParticipantRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getParticipantRegistry('systest.transactions.participants.SimpleRelationshipParticipant')
        .then(function (ar) {
            return ar.remove(transaction.relationshipParticipant);
        });
}

function onRemoveNewParticipantInParticipantRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getParticipantRegistry('systest.transactions.participants.SimpleStringParticipant')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions.participants', 'SimpleStringParticipant', 'stringParticipant1');
            a.stringValue = 'party parrot in san francisco';
            return ar.remove(a);
        });
}

function onRemoveNewParticipantWithRelationshipInParticipantRegistryTransaction(transaction) {
    // console.log(JSON.stringify(transaction));
    return getParticipantRegistry('systest.transactions.participants.SimpleRelationshipParticipant')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions.participants', 'SimpleRelationshipParticipant', 'relationshipParticipant1');
            a.stringParticipant = f.newRelationship('systest.transactions.participants', 'SimpleStringParticipant', 'stringParticipant1');
            return ar.remove(a);
        });
}

/**
 * Handle the transaction to check that transactions are atomic.
 * @param {systest.transactions.participants.ParticipantAddIsAtomic} transaction The transaction
 * @return {Promise} A promise that is resolved when complete.
 * @transaction
 */
function participantAddIsAtomic(transaction) {
    return getParticipantRegistry('systest.transactions.participants.SimpleStringParticipant')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions.participants', 'SimpleStringParticipant', 'stringParticipant1');
            a.stringValue = 'party parrot in hursley';
            return ar.add(a);
        })
        .then(function () {
            throw new Error('we dont want no stinkin party parrots');
        });
}

/**
 * Handle the transaction to check that transactions are atomic.
 * @param {systest.transactions.participants.ParticipantUpdateIsAtomic} transaction The transaction
 * @return {Promise} A promise that is resolved when complete.
 * @transaction
 */
function participantUpdateIsAtomic(transaction) {
    return getParticipantRegistry('systest.transactions.participants.SimpleStringParticipant')
        .then(function (ar) {
            var f = getFactory();
            var a = f.newResource('systest.transactions.participants', 'SimpleStringParticipant', 'stringParticipant1');
            a.stringValue = 'party parrot in san francisco';
            return ar.update(a);
        })
        .then(function () {
            throw new Error('we dont want no stinkin party parrots');
        });
}

/**
 * Handle the transaction to check that transactions are atomic.
 * @param {systest.transactions.participants.ParticipantRemoveIsAtomic} transaction The transaction
 * @return {Promise} A promise that is resolved when complete.
 * @transaction
 */
function participantRemoveIsAtomic(transaction) {
    return getParticipantRegistry('systest.transactions.participants.SimpleStringParticipant')
        .then(function (ar) {
            return ar.remove('stringParticipant1');
        })
        .then(function () {
            throw new Error('we dont want no stinkin party parrots');
        });
}
