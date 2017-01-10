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

const Submit = require ('./lib/submit.js');

module.exports.command = 'submit [options]';
module.exports.describe = 'Submit a transaction to a business network';
module.exports.builder = {
    connectionProfileName: {alias: 'p', required: false, describe: 'The connection profile name', type: 'string' },
    businessNetworkName: {alias: 'n', required: true, describe: 'The business network name', type: 'string' },
    enrollId: { alias: 'i', required: true, describe: 'The enrollment ID of the user', type: 'string' },
    enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' },
    data: { alias: 'd', required: true, describe: 'Transactions JSON object as a string', type: 'string' }
};

module.exports.handler = (argv) => {

    return Submit.handler(argv)
    .then(() => {
        console.log ('Command completed successfully.');
        process.exit(0);
    })
    .catch((error) => {
        console.log(error);
        console.log('Command failed.');
        process.exit(1);
    });
};
