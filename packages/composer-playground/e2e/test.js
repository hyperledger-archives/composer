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

/* eslint-disable no-control-regex */
/* eslint-disable no-console */

const exec = require('child_process').exec;
const spawn = require('child_process').spawn;

// Note that this script is called via npm run e2e:main/nobuild and consequently all
// paths are relative to that calling location (~/composer-playground)

// Start the target test server as a spawned child process in test mode (no npm connections)
let childServer = spawn('node', ['cli.js', '-p', '3001', '-test']);

// Execute protractor and attach to listeners
let childProtractor = exec('webdriver-manager update && protractor -- protractor.conf.js');
// Log all output of Protractor run
childProtractor.stdout.on('data', function(data) {
    // do not log return characters or 'green dot progress'
    let msg = data.replace(/\n$/, '');
    msg = msg.replace(/\x1b\[32m.\x1b\[0m/, '');
    if (msg.length) {
        console.log(msg);
    }
});
// Log ony error output
childProtractor.stderr.on('data', function(data) {
    console.log('stdErr: ' + data);
});
// Capture Protactor return code
childProtractor.on('close', function(code) {
    console.log('Protractor return code: ', code);
    if(code !== 0) {
        code = 1;
    }
    console.log('Exit return code: ', code);
    childServer.kill();
    process.exit(code);
});
