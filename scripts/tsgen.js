/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
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
