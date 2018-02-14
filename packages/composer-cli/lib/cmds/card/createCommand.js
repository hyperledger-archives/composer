/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const Create = require ('./lib/create.js');
const checkFn = (argv,options)=>{

    ['file','businessNetworkName','connectionProfileFile','user','enrollSecret','certificate','privateKey'].forEach((e)=>{
        if (Array.isArray(argv[e])){
            throw new Error(`Option ${e} can only be specified once`);
        }
    });

    return true;
};

module.exports._checkFn =checkFn;

module.exports.command = 'create [options]';
module.exports.describe = 'Creates a business network card from individual components';
module.exports.builder = function (yargs) {
    yargs.options({
        file: {alias: 'f', required: false, describe: 'File name of the card archive to be created', type: 'string' },
        businessNetworkName: {alias: 'n', required: false, describe: 'The business network name', type: 'string' },
        connectionProfileFile: {alias: 'p', required: true, describe: 'Filename of the connection profile json file', type: 'string' },
        user: { alias: 'u', required: true, describe: 'The name of the identity for the card', type: 'string' },
        enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' },
        certificate: { alias: 'c', required: false, describe:'File containing the user\'s certificate.', type: 'string'},
        privateKey: { alias: 'k', required: false, describe:'File containing the user\'s private key', type: 'string'},
        role: { alias: 'r', required: false, describe:'The role for this card can, specify as many as needed',
            choices:['PeerAdmin','ChannelAdmin']}
    });

    // enforce the option after these options
    yargs.requiresArg(['file','businessNetworkName','connectionProfileFile','user','enrollSecret','certificate','privateKey','roles']);

    yargs.check(checkFn);

    return yargs;
};

module.exports.handler = (argv) => {
    return argv.thePromise = Create.handler(argv);
};
