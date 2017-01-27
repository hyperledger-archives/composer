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
 * Inflate an error that was serialized using serializerr back into an Error
 * instance of the correct type.
 * @param {object} error An error that was serialized using serializerr.
 * @return {Error} The inflated error.
 */
function inflaterr(error) {
    let result = global[error.name](error.message);
    result.stack = error.stack;
    return result;
}
module.exports.inflaterr = inflaterr;
