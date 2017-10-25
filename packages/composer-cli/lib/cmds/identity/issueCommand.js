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

const Issue = require ('./lib/issue.js');

module.exports.command = 'issue [options]';
module.exports.describe = 'Issue a new identity to a participant in a participant registry';
module.exports.builder =function (yargs) {
    yargs.options({
        'connectionProfileName': {alias: 'p', required: false, describe: 'The connection profile name', type: 'string' },
        'businessNetworkName': {alias: 'n', required: false, describe: 'The business network name', type: 'string' },
        'enrollId': { alias: 'i', required: false, describe: 'The enrollment ID of the user', type: 'string' },
        'enrollSecret': { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' },
        'newUserId': { alias: 'u', required: false, describe: 'The user ID for the new identity', type: 'string' },
        'participantId': { alias: 'a', required: true, describe: 'The particpant to issue the new identity to', type: 'string' },
        'issuer': { alias: 'x', required: false, describe: 'If the new identity should be able to issue other new identities', type: 'boolean' },
        'option': { alias: 'o', required: false, describe: 'Options that are specific specific to connection. Multiple options are specified by repeating this option', type: 'string' },
        'optionsFile': { alias: 'O', required: false, describe: 'A file containing options that are specific to connection', type: 'string' },
        'card': {alias: 'c', required: false, describe: 'Name of the network card to use for issuing', type: 'string'},
        'file': {alias: 'f', required: false, describe: 'The card file name for the new identity', type: 'string' }
    });

    // mark that the card options conflict with the detail options
    yargs.conflicts({'c':['p','n','i','s'],
        'f':['p','n','i','s']})  ;

    yargs.check((argv,options)=>{
        // if either from one of the 'groups'  details or card have been specified, then check the minimal subset is given
        if (argv.c || argv.f){
            if (!(argv.c && argv.f)){
                throw new Error('Error: Both --card and --file must be specified');
            }
        }
        if (argv.p || argv.n || argv.i || argv.s ){
            if (!(argv.p && argv.n && argv.i)){
                throw new Error('Error: --connectionProfileName and --businessNetworkName and --enrollId must be specified');
            }
        }

        // finally the userid and participant must be specified for all commands
        if (!(argv.u && argv.a)){
            throw new Error('Error: Both --newUserId and --participantId  must be specified');
        }
        return true;
    });

    yargs.group(['p','n','i','s'],'Full Connection Details');
    yargs.group(['c','f'],'Business Network Cards');
    yargs.group(['u','a','x'],'Identity Options');

    return yargs;
};

module.exports.handler = (argv) => {
    return argv.thePromise = Issue.handler(argv);
};
