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
const cmdUtil = require('../../utils/cmdutils');
const chalk = require('chalk');
const moment = require('moment');
const nodereport = require('node-report');
const tar = require('tar');

/**
 * Composer "capture" command
 * @private
 */
class Report {
  /**
    * Command implementation.
    * @param {Object} args argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(args) {
        return this.report(args.file);
    }

    /**
     * Get the current environment data
     * @return {Promise} resolved/rejected promise when the command is complete
     */
    static report() {
        cmdUtil.log(chalk.blue.bold('Creating Composer report\n'));
        let tmpDirectory = this._setupReportDir();
        this._createNodeReport(tmpDirectory);
        return this._archiveReportDir(tmpDirectory);
    }

    /**
     * Sets up the temp directory for the report
     * @return {String} the Path to the temporary directory
     */
    static _setupReportDir() {
        const tmpDir = os.tmpdir();
        return fs.mkdtempSync(`${tmpDir}${sep}`);
    }

    /**
     * Trigger node-report to write report in the temp directory
     * @param {String} tmpDirectory the temporary directory for collecting report output
     */
    static _createNodeReport(tmpDirectory) {
        cmdUtil.log(chalk.blue('Triggering node report...'));
        nodereport.setDirectory(tmpDirectory);
        nodereport.triggerReport();
    }

   /**
     * Creates an archive of the temp directory for the report
     * @param {String} tmpDirectory the temporary directory for collecting report output
     * @param {String} outputFilename the name of the file that was optionally passed in on the command line
     * @return {Promise} resolved/rejected promise when the archive has been created
     */
    static _archiveReportDir(tmpDirectory) {
        let timestamp = moment().format('YYYYMMDD[T]HHmmss');
        let prefix = 'composer-report-' + timestamp;
        let filename = prefix + '.tgz';
        return tar.c(
            {
                cwd: tmpDirectory+'/',
                prefix: prefix,
                gzip: true,
                file: filename
            },
            ['.']
        ).then(() => {
            cmdUtil.log(chalk.blue.bold('\nSuccessfully created Composer report file to '));
            cmdUtil.log(chalk.blue('\tOutput file: ')+filename);
        });
    }
}
module.exports = Report;
