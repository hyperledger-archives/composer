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
