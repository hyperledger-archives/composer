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

const fs = require('fs');
const yargs = require('yargs');
const VersionChecker = require('./versionchecker');

/**
 * Checks the public API is in sync with changelog.txt,
 * package.json and the public API signature
 * @private
 */
let program = yargs
.usage('$0 [options]')
.options({
    'packageJSON' : {alias: 'p', required: true, describe: 'Path of the package.json file to check', type: 'string',default:'package.json' },
    'changelog'  : {alias: 'c', required: true, describe:'Path of the chanhgelog file to check', type: 'string'},
    'api'  : {alias: 'a', required: true, describe:'API Signature file',type:'string'}
})
.argv;

const changelog = fs.readFileSync(program.changelog, 'utf8');
const publicApi = fs.readFileSync(program.api, 'utf8');
const packageJson = fs.readFileSync(program.packageJSON, 'utf8');

try {
    VersionChecker.check(changelog, publicApi, packageJson);
}
catch(err) {
    console.log(err);
    process.exit(1);
}
