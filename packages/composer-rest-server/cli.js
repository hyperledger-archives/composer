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

process.env.SUPPRESS_NO_CONFIG_WARNING = true;

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const server = require('./server/server');
const Util = require('./lib/util');
let _ = require('lodash');

const yargs = require('yargs')
    .wrap(null)
    .usage('Usage: $0 [options]')
    .option('p', { alias: 'connectionProfileName', describe: 'The connection profile name', type: 'string', default: process.env.COMPOSER_CONNECTION_PROFILE })
    .option('n', { alias: 'businessNetworkName', describe: 'The business network identifier', type: 'string', default: process.env.COMPOSER_BUSINESS_NETWORK })
    .option('i', { alias: 'enrollId', describe: 'The enrollment ID of the user', type: 'string', default: process.env.COMPOSER_ENROLLMENT_ID })
    .option('s', { alias: 'enrollSecret', describe: 'The enrollment secret of the user', type: 'string', default: process.env.COMPOSER_ENROLLMENT_SECRET })
    .option('N', { alias: 'namespaces', describe: 'Use namespaces if conflicting types exist', type: 'string', default: process.env.COMPOSER_NAMESPACES || 'always', choices: ['always', 'required', 'never'] })
    .option('P', { alias: 'port', describe: 'The port to serve the REST API on', type: 'number', default: process.env.COMPOSER_PORT || undefined })
    .option('S', { alias: 'security', describe: 'Enable security for the REST API', type: 'boolean', default: process.env.COMPOSER_SECURITY || false })
    .option('w', { alias: 'websockets', describe: 'Enable event publication over WebSockets', type: 'boolean', default: process.env.COMPOSER_WEBSOCKETS || true })
    .alias('v', 'version')
    .version(() => {
        return getInfo('composer-rest-server')+
          getInfo('composer-admin')+getInfo('composer-client')+
          getInfo('composer-common')+getInfo('composer-runtime-hlf')+
          getInfo('composer-connector-hlf')+getInfo('composer-runtime-hlfv1')+
          getInfo('composer-connector-hlfv1');
    })
    .help('h')
    .alias('h', 'help')
    .argv;

// See if we need to run interactively.
// We check to see if no command line arguments have been supplied,
// and then check to see that none of the required arguments have
// been supplied via environment variables have been specified either.
const interactive = process.argv.slice(2).length === 0 && // No command line arguments supplied.
                    ['n', 'p', 'i', 's'].every((flag) => {
                        return yargs[flag] === undefined;
                    });
let promise;
if (interactive) {
    // Gather some args interactively
    clear();
    console.log(
        chalk.yellow(
            figlet.textSync('Hyperledger-Composer', { horizontalLayout: 'full' })
        )
    );
    // Get details of the server that we want to run
    promise = Util.getConnectionSettings()
        .then((answers) => {
            // augment the app with the extra config that we've just collected
            const composer = {
                connectionProfileName: answers.profilename,
                businessNetworkIdentifier: answers.businessNetworkId,
                participantId: answers.userid,
                participantPwd: answers.secret,
                namespaces: answers.namespaces,
                security: answers.security,
                websockets: answers.websockets
            };
            console.log('\nTo restart the REST server using the same options, issue the following command:');
            let cmd = [ 'composer-rest-server' ];
            const args = {
                '-p': 'connectionProfileName',
                '-n': 'businessNetworkIdentifier',
                '-i': 'participantId',
                '-s': 'participantPwd',
                '-N': 'namespaces',
                '-P': 'port',
                '-S': 'security',
                '-w': 'websockets'
            };
            for (let arg in args) {
                const propName = args[arg];
                if (composer[propName]) {
                    cmd.push(arg, composer[propName]);
                }
            }
            console.log('  ', cmd.join(' '));
            console.log();
            return composer;
        });

} else {
    // make sure we have args for all required parms otherwise error
    if (yargs.p === undefined || yargs.n === undefined || yargs.i === undefined || yargs.s === undefined) {
        promise = Promise.reject('Missing parameter. Please run composer-rest-server -h to see usage details');
    } else {
        promise = Promise.resolve({
            connectionProfileName: yargs.p,
            businessNetworkIdentifier: yargs.n,
            participantId: yargs.i,
            participantPwd: yargs.s,
            namespaces: yargs.N,
            port: yargs.P,
            security: yargs.S,
            websockets: yargs.w
        });
    }
}

// Now start the REST server.
module.exports = promise.then((composer) => {

    // Create the LoopBack application.
    return server(composer);

})
.then((result) => {

    // Start the LoopBack application.
    const app = result.app, server = result.server;
    return server.listen(app.get('port'), () => {
        app.emit('started');
        let baseUrl = app.get('url').replace(/\/$/, '');
        console.log('Web server listening at: %s', baseUrl);
        if (app.get('loopback-component-explorer')) {
            let explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
    });

})
.catch((error) => {
    console.error(error);
    process.exit(1);
});

/**
 * [getInfo description]
 * @param  {[type]} moduleName [description]
 * @return {[type]}            [description]
 */
function getInfo(moduleName) {

    try{
        let pjson = ((moduleName=== 'composer-rest-server') ? require('./package.json') : require(moduleName).version);
        return _.padEnd(pjson.name,30) + ' v'+pjson.version+'\n';
    }
    catch (error){
      // oh well - we'll just return a blank string
        return '';
    }

}