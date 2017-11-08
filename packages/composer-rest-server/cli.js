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

const version = 'v' + require('./package.json').version;

const path = require('path');
const server = require('./server/server');
const Util = require('./lib/util');

const defaultTlsCertificate = path.resolve(__dirname, 'cert.pem');
const defaultTlsKey = path.resolve(__dirname, 'key.pem');

const yargs = require('yargs')
    .wrap(null)
    .usage('Usage: $0 [options]')
    .option('c', { alias: 'card', describe: 'The name of the business network card to use', type: 'string', default: process.env.COMPOSER_CARD || undefined })
    .option('n', { alias: 'namespaces', describe: 'Use namespaces if conflicting types exist', type: 'string', default: process.env.COMPOSER_NAMESPACES || 'always', choices: ['always', 'required', 'never'] })
    .option('p', { alias: 'port', describe: 'The port to serve the REST API on', type: 'number', default: process.env.COMPOSER_PORT || undefined })
    .option('a', { alias: 'authentication', describe: 'Enable authentication for the REST API using Passport', type: 'boolean', default: process.env.COMPOSER_AUTHENTICATION || false })
    .option('m', { alias: 'multiuser', describe: 'Enable multiple user and identity management using wallets (implies -a)', type: 'boolean', default: process.env.COMPOSER_MULTIUSER || false })
    .option('w', { alias: 'websockets', describe: 'Enable event publication over WebSockets', type: 'boolean', default: process.env.COMPOSER_WEBSOCKETS || true })
    .option('t', { alias: 'tls', describe: 'Enable TLS security for the REST API', type: 'boolean', default: process.env.COMPOSER_TLS || false })
    .option('e', { alias: 'tlscert', describe: 'File containing the TLS certificate', type: 'string', default: process.env.COMPOSER_TLS_CERTIFICATE || defaultTlsCertificate })
    .option('k', { alias: 'tlskey', describe: 'File containing the TLS private key', type: 'string', default: process.env.COMPOSER_TLS_KEY || defaultTlsKey })
    .alias('v', 'version')
    .version(version)
    .help('h')
    .alias('h', 'help')
    .argv;

// See if we need to run interactively.
// We check to see if no command line arguments have been supplied,
// and then check to see that none of the required arguments have
// been supplied via environment variables have been specified either.
const interactive = process.argv.slice(2).length === 0 && // No command line arguments supplied.
                    ['c'].every((flag) => {
                        return yargs[flag] === undefined;
                    });
let promise;
if (interactive) {
    // Get details of the server that we want to run
    promise = Util.getConnectionSettings()
        .then((answers) => {
            // augment the app with the extra config that we've just collected
            const composer = {
                card: answers.card,
                namespaces: answers.namespaces,
                authentication: answers.authentication,
                multiuser: answers.multiuser,
                websockets: answers.websockets,
                tls: answers.tls,
                tlscert: answers.tlscert,
                tlskey: answers.tlskey
            };
            console.log('\nTo restart the REST server using the same options, issue the following command:');
            let cmd = [ 'composer-rest-server' ];
            const args = {
                '-c': 'card',
                '-n': 'namespaces',
                '-p': 'port',
                '-a': 'authentication',
                '-m': 'multiuser',
                '-w': 'websockets',
                '-t': 'tls',
                '-e': 'tlscert',
                '-k': 'tlskey'
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

    // if -m (multiuser) was specified, it implies -a (authentication)
    if (yargs.m) {
        yargs.a = true;
    }

    // make sure we have args for all required parms otherwise error
    if (yargs.c === undefined) {
        promise = Promise.reject('Missing parameter. Please run composer-rest-server -h to see usage details');
    } else {
        promise = Promise.resolve({
            card: yargs.c,
            namespaces: yargs.n,
            port: yargs.p,
            authentication: yargs.a,
            multiuser: yargs.m,
            websockets: yargs.w,
            tls: yargs.t,
            tlscert: yargs.e,
            tlskey: yargs.k
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
