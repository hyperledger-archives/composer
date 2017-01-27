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
const program = require('commander');
const VersionChecker = require('./versionchecker');

/**
 * Checks the public API is in sync with changelog.txt,
 * package.json and the public API signature
 * @private
 */
program
    .version('0.0.1')
    .description('Checks changelog')
    .usage('[options]')
    .option('-p, --packageJSON <packageJSON>', 'package.json file', 'package.json')
    .option('-c, --changelog <changelog>', 'Changelog file')
    .option('-a, --api <api>', 'API signature file')
    .parse(process.argv);

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
