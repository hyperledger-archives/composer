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

const DeployCommand = require ('./deploy.js');

module.exports.command = 'network deploy [options]';
module.exports.describe = 'Deploy a business network';
module.exports.builder = {
    archiveFile: {alias: 'a', required: true, describe: 'The business network archive file name', type: 'string' },
    enrollId: { alias: 'i', required: true, describe: 'The enrollment ID of the user', type: 'string' },
    enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' },
};

module.exports.handler = (argv) => {

    return DeployCommand.handler(argv)
       .then(() => {
           console.log ('Command completed successfully.');
           process.exit(0);
       })
       .catch((error) => {
           console.log(error+ '\nCommand failed.');
           process.exit(1);
       });
};
