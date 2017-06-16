/*eslint no-var: 0*/
/* eslint-disable no-unused-vars*/
/* eslint-disable no-undef*/
/* eslint-disable func-names*/
/* eslint-disable no-var*/
'use strict';

/**
 * Executes a CouchDB query and checks the results.
 * @param {org.fabric_composer.marbles.QueryMarbleByOwner} transaction
 * @transaction
 * @return {Promise} a promise to the results of transaction processing
 */
function onQueryMarbleByOwner(transaction) {
    var factory = getFactory();

    // create the query
    var q = {
        selector: {
            size: 'SMALL'
        }
    };

    return queryNative(JSON.stringify(q))
        .then(function (resultArray) {
            print('TP function received query result: ', JSON.stringify(resultArray));
            if (resultArray.length !== 5) {
                throw new Error('The incorrect number of marbles found: ', resultArray.length);
            }

            for (var x = 0; x < resultArray.length; x++) {
                var currentResult = resultArray[x];
                if (currentResult.Record.size !== 'SMALL') {
                    throw new Error('Query returned a marble that is not SMALL!', currentResult.Record);
                }
            }
        });
}
