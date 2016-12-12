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

const Test = require ('./lib/tests.js');

module.exports.command = 'tests [options]';
module.exports.describe = 'Generate unit tests';
module.exports.builder = {
    projectDir: {alias: 'd', required: true, describe: 'The directory of your your concerto project', type: 'string' },
    networkArchiveLocation: {alias: 'a', required: true, describe: 'The location of the network archive zip file', type: 'string' },
    testDirName: {alias: 't', required: false, describe: 'The name of the projects test directory', type: 'string' },
    enrollId: { alias: 'i', required: true, describe: 'The enrollment ID of the user', type: 'string' },
    enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' }
};
module.exports.handler = (argv) => {

    return Test.handler(argv)
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
