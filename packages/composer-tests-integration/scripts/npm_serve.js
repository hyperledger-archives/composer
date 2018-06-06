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
const version = require('../../../lerna.json').version;

const NPM_RETRIES = 10;

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
                return reject(new Error(`Failed to execute "${cmd}" with return code ${code}`));
            }
            resolve();
        });
    });
}

// Required packages for serving
const packages = [
    'composer-runtime',
    'composer-common',
    'composer-runtime-hlfv1',
    'composer-connector-hlfv1',
    'composer-runtime-pouchdb',
    'composer-runtime-embedded',
    'composer-connector-embedded',
    'composer-connector-proxy',
    'composer-admin',
    'composer-client',
    'loopback-connector-composer',
    'composer-rest-server',
    'composer-report',
    'composer-cucumber-steps',
    'composer-cli',
    'composer-wallet-inmemory',
    'composer-wallet-filesystem',
    'generator-hyperledger-composer',
    'composer-documentation'];

// Packages to be installed in integration test(s)
const testPackages = [
    'composer-cli',
    'composer-rest-server',
    'generator-hyperledger-composer'
];

// Third party packages.
const thirdPartyPackages = [
    // Required for running the generators.
    'yo',
    // Required for REST server authentication.
    'passport-ldapauth',
    // Required for REST server persistence.
    'loopback-connector-mongodb'
];

(async function () {

    try {

        // Set registry and publish
        for (const p of packages) {
            let published = false;
            for (let i = 0; i < NPM_RETRIES; i++) {
                console.log(`Publishing package ${p} to local npm server (attempt ${i+1}/${NPM_RETRIES})`);
                try {
                    await invokeCmd(`npm publish --registry http://localhost:4873 ../${p}`);
                    console.log(`Published package ${p} to local npm server (attempt ${i+1}/${NPM_RETRIES})`);
                    published = true;
                    break;
                } catch (error) {
                    console.error(`Failed to publish package ${p} to local npm server (attempt ${i+1}/${NPM_RETRIES})`);
                    console.error(error);
                }
            }
            if (!published) {
                console.error(`Aborting, could not publish package ${p} to local npm server`);
                process.exit(1);
            }
        }

        // Globally install test packages
        for (const p of testPackages) {
            let published = false;
            for (let i = 0; i < NPM_RETRIES; i++) {
                console.log(`Installing test package ${p}@${version} from local npm server (attempt ${i+1}/${NPM_RETRIES})`);
                try {
                    await invokeCmd(`npm install --registry http://localhost:4873 -g ${p}@${version}`);
                    console.log(`Installed test package ${p} from local npm server (attempt ${i+1}/${NPM_RETRIES})`);
                    published = true;
                    break;
                } catch (error) {
                    console.error(`Failed to install test package ${p} from local npm server (attempt ${i+1}/${NPM_RETRIES})`);
                    console.error(error);
                }
            }
            if (!published) {
                console.error(`Aborting, could not install test package ${p} from local npm server`);
                process.exit(1);
            }
        }

        // Globally install third party packages
        for (const p of thirdPartyPackages) {
            let published = false;
            for (let i = 0; i < NPM_RETRIES; i++) {
                console.log(`Installing third party package ${p} from public npm server (attempt ${i+1}/${NPM_RETRIES})`);
                try {
                    await invokeCmd(`npm install -g ${p}`);
                    console.log(`Installed third party package ${p} from public npm server (attempt ${i+1}/${NPM_RETRIES})`);
                    published = true;
                    break;
                } catch (error) {
                    console.error(`Failed to install third party package ${p} from public npm server (attempt ${i+1}/${NPM_RETRIES})`);
                    console.error(error);
                }
            }
            if (!published) {
                console.error(`Aborting, could not install third party package ${p} from public npm server`);
                process.exit(1);
            }
        }

    } catch (error) {
        console.error(error);
        process.exit(1);
    }

})();
