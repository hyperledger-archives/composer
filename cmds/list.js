/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto CLI - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

exports.command = 'list [parms]';
exports.desc = 'List details of a Concerto business network ';
exports.builder = {
    dir: {
        default: '.'
    }
};
exports.handler = function (argv) {
    console.log('list called for dir', argv.dir);
};
