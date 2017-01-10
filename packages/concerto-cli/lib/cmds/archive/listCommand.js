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

const List = require ('./lib/list.js');

module.exports.command = 'list [options]';
module.exports.describe = 'Lists details of a Business Network Archive';
module.exports.builder = function (yargs){

    return yargs.option('archiveFile',{alias: 'a', required: false, describe: 'Business network archive file name.', type: 'string' });
};


module.exports.handler = (argv) => {

    return List.handler(argv)
    .then(() => {
        console.log ('Command completed successfully.');
        process.exit(0);
    })
    .catch((error) => {
        console.log(error+ '\nCommand failed.');
        process.exit(1);
    });
};
