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
const path = require('path');
const { sep } = require('path');
const moment = require('moment');
const nodereport = require('node-report');
const tar = require('tar');

/**
 * Creates a report identifer for use in filenames etc.
 * @return {String} the report identifier
 * @private
 */
function _createReportId() {
    let timestamp = moment().utc().format('YYYYMMDD[T]HHmmss');
    return 'composer-report-' + timestamp;
}

/**
 * Sets up the temp directory for the report
 * @return {String} the Path to the temporary directory
 * @private
 */
function _setupReportDir() {
    const tmpDir = os.tmpdir();
    return fs.mkdtempSync(`${tmpDir}${sep}`);
}

/**
 * Write simple composer report in the temp directory
 * @param {String} reportId report identifier
 * @param {String} tmpDirectory the temporary directory for collecting report output
 * @private
 */
function _createComposerReport(reportId, tmpDirectory) {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const composerReportVersion = 'composer-report version: ' + packageJson.version;

    const reportPath = path.join(tmpDirectory, reportId + '.txt');
    fs.writeFileSync(reportPath, composerReportVersion);
}

/**
 * Trigger node-report to write report in the temp directory
 * @param {String} tmpDirectory the temporary directory for collecting report output
 * @private
 */
function _createNodeReport(tmpDirectory) {
    nodereport.setDirectory(tmpDirectory);
    nodereport.triggerReport();
}

/**
 * Prepares a report ID and temporary ready to begin collecting
 * diagnostic data
 * @return {Object} the report ID and temporary directory
 * @throws {Error} DirectoryAccessError if the current directory is not writeable
 */
function beginReport() {
    // Make sure the current directory is writeable for when we get to creating
    // the report archive
    const currentDirectory = process.cwd();
    try {
        fs.accessSync(currentDirectory, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
        if (err.code === 'EACCES') {
            let reportError = new Error('Cannot create report in current directory: permission denied');
            reportError.name = 'DirectoryAccessError';
            throw reportError;
        } else {
            throw err;
        }
    }

    const reportId = _createReportId();
    const reportDir = _setupReportDir();

    return {
        reportId: reportId,
        reportDir: reportDir
    };
}

/**
 * Collects diagnostic data into the temp directory for the report
 * @param {String} reportId report identifier
 * @param {String} tmpDirectory the temporary directory for collecting report output
 */
function collectBasicDiagnostics(reportId, tmpDirectory) {
    _createComposerReport(reportId, tmpDirectory);
    _createNodeReport(tmpDirectory);
}

/**
 * Creates an archive of the temp directory for the report in the current directory
 * @param {String} reportId report identifier
 * @param {String} tmpDirectory the temporary directory for collecting report output
 * @return {String} the name of the archive file that has been created.
 */
function completeReport(reportId, tmpDirectory) {
    let filename = reportId + '.tgz';
    tar.c(
        {
            cwd: tmpDirectory+'/',
            prefix: reportId,
            gzip: true,
            file: filename,
            sync: true
        },
        ['.']
    );
    return filename;
}

module.exports = { beginReport, collectBasicDiagnostics, completeReport } ;
