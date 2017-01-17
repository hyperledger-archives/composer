#!/usr/bin/env node
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

process.env.SUPPRESS_NO_CONFIG_WARNING = true;

const yargs = require('yargs');
let _ = require('lodash');
yargs
    .commandDir('./lib/cmds')
    .help()
    .example('concerto identity issue\nconcerto network deploy\nconcerto participant add\nconcerto transaction submit')
    .demand(1)
    .wrap(null)
    .strict()
    .epilogue('For more information: https://pages.github.ibm.com/Blockchain-WW-Labs/Concerto/reference')
    .alias('v', 'version')
    .version(function() {


        return getInfo('@ibm/ibm-concerto-cli')+'\n'+
          getInfo('@ibm/concerto-admin')+'\n'+getInfo('@ibm/concerto-client')+'\n'+
          getInfo('@ibm/concerto-common')+'\n'+getInfo('@ibm/concerto-runtime-hlf')+
          '\n'+getInfo('@ibm/concerto-connector-hlf')+'\n';


    })
    .describe('v', 'show version information')
    .argv;

/**
 * [getInfo description]
 * @param  {[type]} moduleName [description]
 * @return {[type]}            [description]
 */
function getInfo(moduleName){
    let pjson = require(moduleName+'/package.json');

    return _.padEnd(pjson.name,30) + ' v'+pjson.version;
}
