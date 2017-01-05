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
