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
const path = require('path');
const sourceModule = require('..');

const targetFile = path.resolve(__dirname, '..', 'index.d.ts');

let fileContents = '';

/**
 * Render the specified constructor.
 * @param {string} key The name of the constructor.
 * @param {function} clazz The constructor.
 */
function renderClass(key, clazz) {
    fileContents += `export class ${key} {\n`;
    let statics = Object.getOwnPropertyNames(clazz);
    statics.forEach((statick) => {
        let func = clazz[statick];
        if (typeof func === 'function') {
            const args = new Array(func.length).fill('temp');
            args.forEach((value, index, array) => {
                args[index] = `arg${index}?: any`;
            });
            const insert = args.join(', ');
            fileContents += `  static ${statick}(${insert}): any;\n`;
        }
    });
    let members = Object.getOwnPropertyNames(clazz.prototype);
    members.forEach((member) => {
        let func = clazz.prototype[member];
        if (typeof func === 'function') {
            const args = new Array(func.length).fill('temp');
            args.forEach((value, index, array) => {
                args[index] = `arg${index}?: any`;
            });
            const insert = args.join(', ');
            if (member === 'constructor') {
                fileContents += `  ${member}(${insert});\n`;
            } else {
                fileContents += `  ${member}(${insert}): any;\n`;
            }
        }
    });
    fileContents += '}\n';
}

if (typeof sourceModule === 'function') {
    // console.log('Source module is a function (single class)');
    let key = sourceModule.name;
    renderClass(key, sourceModule);
    fileContents += `export default ${key};\n`;
} else {
    // console.log('Source module is an object (multiple or named classes)');
    let keys = Object.keys(sourceModule).sort();
    keys.forEach((key) => {
        if (typeof sourceModule[key] === 'function') {
            let ctor = sourceModule[key];
            renderClass(key, ctor);
        }
    });
}

fs.writeFileSync(targetFile, fileContents, { encoding: 'utf8' });
