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

const exec = require('child_process').exec;

const lernaFile = require('../../../lerna.json');
let version = lernaFile.version;

/**
 * Invoke a promisified exec
 * @param {String} cmd - the command to be run
 * @returns {Promise} - a Promise that is resolved or rejected
 */
function invokeCmd(cmd) {
    return new Promise((resolve, reject) => {
        let proc = exec(cmd);
        // Log all output
        proc.stdout.on('data', function(data) {
            // eslint-disable-next-line no-console
            console.log(data);
        });
        // Log ony error output
        proc.stderr.on('data', function(data) {
            // eslint-disable-next-line no-console
            console.log('stdErr: ' + data);
        });
        // Capture Protactor return code
        proc.on('close', function(code) {
            if(code !== 0) {
                reject();
            }
            resolve();
        });
    });
}

// Required packages for serving
let packages = [
    'composer-runtime',
    'composer-common',
    'composer-runtime-hlfv1',
    'composer-connector-hlfv1',
    'composer-admin',
    'composer-client',
    'loopback-connector-composer',
    'composer-rest-server',
    'composer-report',
    'composer-cli',
    'composer-wallet-inmemory',
    'composer-wallet-filesystem',
    'generator-hyperledger-composer'];

// Packages to be installed in integration test(s)
let testPackages = [
    'composer-cli',
    'generator-hyperledger-composer'
];

return packages.reduce((promiseChain, p) => {
    // Set registry and publish
    return promiseChain.then(() => {
        // eslint-disable-next-line no-console
        console.log('Publishing package ' + p + ' to local npm server');
        return invokeCmd('npm publish --registry http://localhost:4873 ../' + p);
    });
}, Promise.resolve())
.then(() => {
    // Globally install test packages
    return testPackages.reduce((promiseChain, p) => {
        return promiseChain.then(() => {
            // eslint-disable-next-line no-console
            console.log('installing package ' + p + '@' + version + ' from npm server');
            return invokeCmd('npm install --registry http://localhost:4873 -g ' + p + '@' + version);
        });
    }, Promise.resolve());
});
