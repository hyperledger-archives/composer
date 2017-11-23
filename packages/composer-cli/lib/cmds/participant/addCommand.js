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

const Add = require ('./lib/add.js');

const checkFn = (argv,options)=>{
    if (Array.isArray(argv.card)){
        throw new Error('Please specify --card or -c only once');
    }
    if (Array.isArray(argv.data)){
        throw new Error('Please specify --data or -d only once');
    }
    return true;
};

module.exports._checkFn = checkFn;

module.exports.command = 'add [options]';
module.exports.describe = 'Add a new participant to a participant registry';
module.exports.builder = (yargs) =>{

    yargs.options({
        data: { alias: 'd', required: true, describe: 'Serialized participant JSON object as a string', type: 'string' },
        card: { alias: 'c', required: true, description: 'The cardname to use to add the participant', type:'string'}
    });

    yargs.strict();

    yargs.check(checkFn);

    return yargs;
};

module.exports.handler = (argv) => {
    return argv.thePromise = Add.handler(argv);
};
