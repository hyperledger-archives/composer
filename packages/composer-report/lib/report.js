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
const os = require('os');
const { sep } = require('path');
const moment = require('moment');
const nodereport = require('node-report');
const tar = require('tar');

/**
 * Main API called from cmd and composer report.
 * @return {String} the name of the archive file that was created.
 */
function report() {
    let tmpDirectory = setupReportDir();

    // TODO write readme file inc. version of the composer-report module
    // Plus versions of the other composer modules?

    createNodeReport(tmpDirectory);
    return archiveReport(tmpDirectory);
}

/**
 * Sets up the temp directory for the report
 * @return {String} the Path to the temporary directory
 */
function setupReportDir() {
    const tmpDir = os.tmpdir();
    return fs.mkdtempSync(`${tmpDir}${sep}`);
}

/**
 * Trigger node-report to write report in the temp directory
 * @param {String} tmpDirectory the temporary directory for collecting report output
 */
function createNodeReport(tmpDirectory) {
    nodereport.setDirectory(tmpDirectory);
    nodereport.triggerReport();
}

/**
 * Creates an archive of the temp directory for the report
 * @param {String} tmpDirectory the temporary directory for collecting report output
 * @return {String} the name of the archive file that has been created.
 */
function archiveReport(tmpDirectory) {
    let timestamp = moment().utc().format('YYYYMMDD[T]HHmmss');
    let prefix = 'composer-report-' + timestamp;
    let filename = prefix + '.tgz';
    tar.c(
        {
            cwd: tmpDirectory+'/',
            prefix: prefix,
            gzip: true,
            file: filename,
            sync: true
        },
        ['.']
    );
    return filename;
}

module.exports = { report, setupReportDir, createNodeReport, archiveReport } ;
