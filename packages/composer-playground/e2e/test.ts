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

import { exec, spawn } from 'child_process';
import path = require('path');
import fs = require('fs');

import { FabricHelper } from './utils/fabric-helper';
import { CodeRunner } from './utils/code-runner';
import { Constants } from './constants';
import { ComposerUtils } from './utils/composer-utils';

// Build test BNAs from sample networks and then proceed with test
let networks = Constants.sampleNetworks;
networks.reduce((chainPromise, network) => {
    return chainPromise.then(() => {
        let networkPath = path.join(Constants.sampleNetworkDir, network);
        let bnaFile = path.join(Constants.tempDir, network) + '.bna';

        if (fs.existsSync(bnaFile)) {
            return Promise.resolve();
        } else {
            return ComposerUtils.buildArchive(networkPath, bnaFile);
        }
    });
}, Promise.resolve())
.then(() => {
    // Are we running against fabric?
    const args = process.argv;
    if (args.indexOf('--fabric') !== -1 || args.indexOf('-f') !== -1) {
        return runFabric();
    } else {
        return runTests('web');
    }
})
.catch((err) => {
    console.log('Error in test runner: ', err);
    process.exit(1);
});

function runFabric() {
    console.log('Setting up fabric, one moment...');
    return FabricHelper.createPeerAdmin()
    .then (() => {
        return runTests('fabric');
    });
}

function runTests(connection) {
    let childServer;
    // Start the target test server as a spawned child process in test mode (no npm connections)
    if (connection.localeCompare('web') === 0) {
        // Standard test, use cli.js
        console.log('Targetting local build Playground with web connector');
        childServer = spawn('node', ['cli.js', '-p', Constants.webPlaygroundPort.toString(), '-test']);
    } else if (connection.localeCompare('fabric') === 0) {
        // Integration test, use npm module
        console.log('Targetting npm Playground with fabric connector');

        // set the npmrc file to the one created by configureGateway.sh
        process.env.NPMRC_FILE='/tmp/npmrc';
        childServer = spawn('composer-playground', ['-p', Constants.fabricPlaygroundPort.toString(), '-test']);
    } else {
        console.log('Unspecified or invalid parameter passed to runTests() method ' + connection + '] exiting.');
        process.exit(1);
    }

    // Execute protractor and attach to listeners
    let childProtractor = exec(`webdriver-manager update --gecko false && protractor -- protractor.${connection}.conf.js`);
    // Log all output of Protractor run
    childProtractor.stdout.on('data', (data) => {
        // do not log return characters or 'green dot progress'
        let msg = data.toString();
        msg.replace(/\n$/, '');
        msg = msg.replace(/\x1b\[32m.\x1b\[0m/, '');
        if (msg.length) {
            console.log(msg);
        }
    });
    // Log ony error output
    childProtractor.stderr.on('data', (data) => {
        console.log('stdErr: ' + data);
    });
    // Capture Protactor return code
    childProtractor.on('close', (code) => {
        console.log('Protractor return code: ', code);
        if (code !== 0) {
            code = 1;
        }
        console.log('Exit return code: ', code);
        childServer.kill();
        if (connection === 'fabric') {
            console.log('Cleaning up fabric, one moment\n');
            return FabricHelper.stop()
            .then(() => {
                process.exit(code);
            });
        } else {
            process.exit(code);
        }
    });
}
