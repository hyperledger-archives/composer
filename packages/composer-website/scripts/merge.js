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

const fs = require('fs-extra');
const path = require('path');

let masterData = {};

// Loop through all the files in the input directory
processDirectory('./jsondata/');

/**
 * Processes all the Javascript files within a directory.
 *
 * @param {string} path - the path to process
 * @private
 */
function processDirectory(path) {
    let items = [];
    fs.walk(path)
        .on('readable', function (item) {
            while ((item = this.read())) {
                if (item.stats.isFile()) {
                    items.push(item.path);
                }
            }
        })
        .on('end', () => {
            items.sort();
            items.forEach((item) => {
                processFile(item);
            });

            fs.writeFileSync('allData.json',JSON.stringify(masterData),'utf8');
        });
}

/**
 * Processes a single Javascript file (.js extension)
 *
 * @param {string} file - the file to process
 * @private
 */
function processFile(file, fileProcessor) {
    let filePath = path.parse(file);
    if (filePath.ext === '.json') {
        console.log('%s is a file.', file);
        let fileContents = fs.readFileSync(file, 'utf8');
        let data = JSON.parse(fileContents);
        let m = data.module;

        if (!masterData.hasOwnProperty(m)){
            masterData[m] = [];
        }
        masterData[m].push(data);
    }
}
