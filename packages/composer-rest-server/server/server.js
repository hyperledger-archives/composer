#!/usr/bin/env node
/*
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const util = require('../lib/util');
const loopback = require('loopback');
const boot = require('loopback-boot');
const app = module.exports = loopback();

process.env.SUPPRESS_NO_CONFIG_WARNING = true;

const yargs = require('yargs')
    .wrap(null)
    .usage('Usage: $0 [options]')
    .option('n', { alias: 'businessNetworkName', describe: 'The business network identifier', type: 'string', default: process.env.COMPOSER_BUSINESS_NETWORK })
    .option('p', { alias: 'connectionProfileName', describe: 'The connection profile name', type: 'string', default: process.env.COMPOSER_CONNECTION_PROFILE })
    .option('i', { alias: 'enrollId', describe: 'The enrollment ID of the user', type: 'string', default: process.env.COMPOSER_ENROLLMENT_ID })
    .option('s', { alias: 'enrollSecret', describe: 'The enrollment secret of the user', type: 'string', default: process.env.COMPOSER_ENROLLMENT_SECRET })
    .option('N', { alias: 'namespaces', describe: 'Use namespaces if conflicting types exist', type: 'string', default: process.env.COMPOSER_NAMESPACES || 'always', choices: ['always', 'required', 'never'] })
    .option('P', { alias: 'port', describe: 'The port to serve the REST API on', type: 'number', default: process.env.COMPOSER_PORT || undefined })
    .help('h')
    .alias('h', 'help')
    .argv;

// see if we need to run interactively
let promise;
if (yargs.p === undefined && yargs.n === undefined && yargs.i === undefined && yargs.s === undefined) {
    // Gather some args interactively
    clear();
    console.log(
        chalk.yellow(
            figlet.textSync('Fabric-Composer', { horizontalLayout: 'full' })
        )
    );
    // Get details of the server that we want to run
    promise = util.getFabricDetails()
        .then((answers) => {
            // augment the app with the extra config that we've just collected
            return {
                connectionProfileName: answers.profilename,
                businessNetworkIdentifier: answers.businessNetworkId,
                participantId: answers.userid,
                participantPwd: answers.secret,
                namespaces: answers.namespaces
            };
        });

} else {
    // make sure we have args for all required parms otherwise error
    if (yargs.p === undefined || yargs.n === undefined || yargs.i === undefined || yargs.s === undefined) {
        console.log('Error: Missing parameter.   Please run compposer-rest-server -h to see usage details');
        process.exit(1);
    } else {
        promise = Promise.resolve({
            connectionProfileName: yargs.p,
            businessNetworkIdentifier: yargs.n,
            participantId: yargs.i,
            participantPwd: yargs.s,
            namespaces: yargs.N,
            port: yargs.P
        });
    }
}

// After we have got the composer configuration...
promise.then((composer) => {

    // Store the composer configuration for the boot script to find
    app.set('composer', composer);

    // boot scripts mount components like REST API
    return new Promise((resolve, reject) => {
        boot(app, __dirname, (error) => {
            if (error) {
                return reject(error);
            }
            resolve(composer);
        });
    });

})
.then((composer) => {

    // Set the port if one was specified.
    if (composer.port) {
        app.set('port', composer.port);
    }

    app.start = function () {
        // start the web server
        return app.listen(function () {
            app.emit('started');
            let baseUrl = app.get('url').replace(/\/$/, '');
            console.log('Web server listening at: %s', baseUrl);
            if (app.get('loopback-component-explorer')) {
                let explorerPath = app.get('loopback-component-explorer').mountPath;
                console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
            }
        });
    };

    // start the server if `$ node server.js`
    if (require.main === module) {
        app.start();
    }

})
.catch((error) => {
    console.error(error);
    process.exit(1);
});
