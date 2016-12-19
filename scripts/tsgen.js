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
if (typeof sourceModule === 'function') {
    // console.log('Source module is a function (single class)');
    let key = sourceModule.name;
    fileContents = `declare const ${key}: any;\nexport default ${key};\n`;
} else {
    // console.log('Source module is an object (multiple or named classes)');
    let keys = Object.keys(sourceModule).sort();
    keys.forEach((key) => {
        // console.log('Adding key', key);
        fileContents += `export const ${key}: any;\n`;
    });
}

fs.writeFileSync(targetFile, fileContents, { encoding: 'utf8' });
