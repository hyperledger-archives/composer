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

// not using the config file module as this could be run anwhere so suppress warning
process.env.SUPPRESS_NO_CONFIG_WARNING = true;
const cmdUtil = require('./lib/cmds/utils/cmdutils');
const yargs = require('yargs');
const chalk = require('chalk');
const version = 'v' +require('./package.json').version;
const Logger = require('composer-common').Logger;
const LOG = Logger.getLog('CLI');
LOG.info('CLI', 'CLI Launched with', process.argv);

let results = yargs
    .commandDir('./lib/cmds')
    .help()
    .example('composer archive create\ncomposer identity issue\ncomposer network install\ncomposer participant add\ncomposer transaction submit')
    .demand(1)
    .wrap(null)
    .strict()
    .epilogue('For more information on Hyperledger Composer: https://hyperledger.github.io/composer/')
    .alias('v', 'version')
    .version(version)
    .describe('v', 'show version information')
    .argv;

if (typeof(results.thePromise) !== 'undefined'){
    results.thePromise.then( () => {

        if (!results.quiet) {
            cmdUtil.log(chalk.green('\nCommand succeeded\n'));
        }
        Logger.flushLogFileAndExit(0);
    }).catch((error) => {
        cmdUtil.log(error+chalk.red('\nCommand failed\n'));
        Logger.flushLogFileAndExit(1);
    });
} else {
    Logger.flushLogFileAndExit(0);
}
