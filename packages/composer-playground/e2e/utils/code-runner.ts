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

import { exec } from 'child_process';
import stripAnsi = require('strip-ansi');

export class CodeRunner {

    /**
     * Command to run a command line command
     * @param {String} cmd -  command with parameters to be run
     * @return {Promise} - Promise that will be resolved or rejected with an error
     */
    static runCode(cmd): Promise<any> {
        if (typeof cmd !== 'string') {
            return Promise.reject('Command passed to function was not a string');
        } else {
            console.log('Running command: ', cmd);

            let stdout;
            let stderr;

            return new Promise((resolve, reject) => {
                let childCliProcess = exec(cmd);

                childCliProcess.stdout.setEncoding('utf8');
                childCliProcess.stderr.setEncoding('utf8');

                childCliProcess.stdout.on('data', (data) => {
                    data = stripAnsi(data);
                    console.log('STDOUT', data);
                    stdout += data;
                });

                childCliProcess.stderr.on('data', (data) => {
                    data = stripAnsi(data);
                    console.log('STDERR', data);
                    stderr += data;
                });

                childCliProcess.on('error', (error) => {
                    error = stripAnsi(error);
                    console.log('ERR', error);
                    reject({ error: error, stdout: stdout, stderr: stderr });
                });

                childCliProcess.on('close', (code) => {
                    if (code && code !== 0 ) {
                        reject({ stdout: stdout, stderr: stderr });
                    } else {
                        resolve(stdout);
                    }
                });
            });
        }
    }
}
