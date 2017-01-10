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

const Create = require ('./lib/create.js');

module.exports.command = 'create [options]';
module.exports.describe = 'Create the details of a Business Network Archive';
module.exports.builder = function (yargs){

    return yargs.option('archiveFile',{alias: 'a', required: false, describe: 'Business network archive file name. Default is based on the Identifier of the BusinessNetwork', type: 'string' })
            .option('inputDir',{alias: 'd', required: false, describe: 'Location to create the archive from e.g. NPM module directory'})
            .option('moduleName',{alias: 'm', required: false, describe: 'Name of the npm module to use '})
            .conflicts('inputDir','moduleName')
            .epilog('Only one of either inputDir or moduleName must be specified.');
};


module.exports.handler = (argv) => {

    return Create.handler(argv)
    .then(() => {
        console.log ('Command completed successfully.');
        process.exit(0);
    })
    .catch((error) => {
        console.log(error+ '\nCommand failed.');
        process.exit(1);
    });
};
