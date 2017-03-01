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

const chalk       = require('chalk');
const clear       = require('clear');
const figlet      = require('figlet');
const util        = require('../lib/util');
const loopback = require('loopback');
const boot = require('loopback-boot');
const app = module.exports = loopback();
process.env.SUPPRESS_NO_CONFIG_WARNING = true;

app.start = function() {

    // start the web server
    return app.listen(function() {
        app.emit('started');
        let baseUrl = app.get('url').replace(/\/$/, '');
        if (app.get('loopback-component-explorer')) {
            let explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
    });
};


const yargs = require( 'yargs' )
    .wrap(null)
    .usage( 'Usage: $0 -p connection profile -b business network identifier -u participant id -s participant password' )
    .option( 'c', { alias: 'connectionProfile', describe: 'connection profile Name', type: 'string' } )
    .option( 'b', { alias: 'businessNetwork', describe: 'business network identifier', type: 'string' } )
    .option( 'i', { alias: 'participantId', describe: 'participant id', type: 'string' } )
    .option( 'p', { alias: 'participantPwd', describe: 'participant password', type: 'string' } )
    .help( 'h' )
    .alias( 'h', 'help' )
    .argv;

// see if we need to run interactively
if(yargs.c === undefined && yargs.b === undefined && yargs.i === undefined && yargs.p === undefined) {
    // Gather some args interactively
    clear();
    console.log(
        chalk.yellow(
            figlet.textSync('Fabric-Composer', { horizontalLayout: 'full' })
        )
    );
    // Get details of the server that we want to run
    util.getFabricDetails(function(answers)  {
        // augment the app with the extra config that we've just collected
        let ds = {
            'name' : 'Composer',    // not sure this matters
            'connectionProfileName' : answers.profilename,
            'businessNetworkIdentifier' : answers.businessNetworkId,
            'participantId' : answers.userid,
            'participantPwd' : answers.secret
        };
        app.cfg = ds;
        boot(app, __dirname, function(err) {
            if(err) {
                throw err;
            }
            // start the server if `$ node server.js`
            if (require.main === module) {
                app.start();
            }
        });
    });

} else {
    // make sure we have args for all required parms otherwise error
    if(yargs.c === undefined || yargs.b === undefined || yargs.i === undefined || yargs.p === undefined) {
        console.log('Error: Missing parameter.   Please run compposer-rest-server -h to see usage details');
    } else {
        let ds = {
            'name' : 'Composer',    // not sure this matters
            'connectionProfileName' : yargs.c,
            'businessNetworkIdentifier' : yargs.b,
            'participantId' : yargs.i,
            'participantPwd' : yargs.p
        };
        app.cfg = ds;
        boot(app, __dirname, function(err) {
            if(err) {
                throw err;
            }
            // start the server if `$ node server.js`
            if (require.main === module) {
                app.start();
            }
        });
    }
}