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

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const parentDirectory = path.resolve(__dirname, '..');
const apiSignatureFile = path.resolve(parentDirectory, 'api.txt');

if (fs.existsSync(apiSignatureFile)) {
    fs.unlinkSync(apiSignatureFile);
}

return Promise.resolve()
.then(() => {
    return new Promise((resolve, reject) => {
        const parsejs = require.resolve('composer-common/lib/codegen/parsejs.js');
        const command = child_process.fork(parsejs, ['--format', 'APISignature', '--inputDir', path.resolve(parentDirectory, 'lib'), '--outputDir', parentDirectory]);
        command.on('exit', (code) => {
            if (code !== 0) {
                process.exit(code);
            }
            resolve();
        });
    });
})
.then(() => {
    return new Promise((resolve, reject) => {
        const changelog = require.resolve('composer-common/lib/tools/changelog.js');
        const command = child_process.fork(changelog, ['--api', apiSignatureFile, '--changelog', path.resolve(parentDirectory, 'changelog.txt')]);
        command.on('exit', (code) => {
            if (code !== 0) {
                process.exit(code);
            }
            resolve();
        });
    });
})
.catch((error) => {
    console.error(error);
    process.exit(1);
});
