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

require('dotenv').config({path: './config/.env'});

const config = require('./config/environment');

const argv = require('yargs')
    .option('p', {
        alias: 'port',
        demand: false,
        default: config.port,
        type: 'number',
        describe: 'The port to start the connector server on'
    })
    .option('t', {
        alias: 'test',
        demand: false,
        default: false
    })
    .argv;

const Logger = require('composer-common').Logger;
Logger.setCLIDefaults();
const LOG = Logger.getLog('PlaygroundAPI');

(async function main() {
    const method = 'main';
    LOG.entry(method);

    const app = await require('.')(argv.port, argv.test);

    if (process.env.COMPOSER_CONFIG) {
        const config = JSON.parse(process.env.COMPOSER_CONFIG);
        app.get('/config.json', (req, res, next) => {
            res.json(config);
        });
    }
})();