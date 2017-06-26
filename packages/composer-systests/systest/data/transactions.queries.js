/*eslint no-var: 0*/
'use strict';

/**
 * Handle the sample transaction.
 *   o String namedQuery optional
 *   o String dynamicQuery optional
 *   o String parameters optional
 *   o String expected
 * @param {systest.transactions.queries.SampleTransaction} tx The sample transaction.
 * @transaction
 */
function handleSampleTransaction(tx) {
    var parameters = undefined;
    if (tx.parameters) {
        parameters = JSON.parse(tx.parameters);
    }
    var expected = JSON.parse(tx.expected);
    return Promise.resolve()
        .then(function () {
            if (tx.namedQuery && tx.dynamicQuery) {
                throw new Error('cannot supply namedQuery and dynamicQuery');
            } else if (tx.namedQuery) {
                return query(tx.namedQuery, parameters);
            } else if (tx.dynamicQuery) {
                var q = buildQuery(tx.dynamicQuery);
                return query(q, parameters);
            } else {
                throw new Error('must supply namedQuery or dynamicQuery');
            }
        })
        .then(function (resources) {
            var actual = resources.map(function (resource) {
                return getSerializer().toJSON(resource);
            });
            assert.deepStrictEqual(actual, expected);
        });
}
