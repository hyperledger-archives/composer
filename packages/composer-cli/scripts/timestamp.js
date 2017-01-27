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
const moment = require('moment');

if (process.argv.length !== 3) {
    console.error('Usage: timestamp.js <package.json>');
    process.exit(1);
}

let fileName = process.argv[2];
let fileContents = fs.readFileSync(fileName, 'utf8');
let file = JSON.parse(fileContents);

let timestamp = moment().format('YYYYMMDDHHmmss');

file.version = file.version.replace(/-.*/, '');
file.version += '-' + timestamp;

fileContents = JSON.stringify(file, null, 2);
fs.writeFileSync(fileName, fileContents, 'utf8');
