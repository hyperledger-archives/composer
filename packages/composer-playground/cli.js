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

const argv = require('yargs')
    .option('p', {
        alias: 'port',
        demand: false,
        default: process.env.PORT || 8080,
        type: 'number',
        describe: 'The port to start composer on'
    })
    .option('t', {
        alias: 'test',
        demand: false,
        default: false
    })
    .argv;

const isDocker = require('is-docker');
const Logger = require('composer-common').Logger;
const opener = require('opener');

const LOG = Logger.getLog('Composer');
Logger.setCLIDefaults();


let config;
if (process.env.COMPOSER_CONFIG) {
    config = JSON.parse(process.env.COMPOSER_CONFIG);
}

(async function main() {
    const method = 'main';
    LOG.entry(method);

    await require('.')(argv.port, argv.test, config);

    if (!isDocker()) {
        opener(`http://localhost:${argv.port}`);
    }
})();