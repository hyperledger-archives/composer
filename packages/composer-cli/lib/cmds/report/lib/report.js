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
const cmdUtil = require('../../utils/cmdutils');
const report = require('composer-report');
const chalk = require('chalk');

/**
 * Composer "capture" command
 * @private
 */
class Report {
  /**
    * Command process for report command
    * @param {Object} args argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(args) {
        return Promise.resolve(this.createReport(args.file));
    }

    /**
     * Get the current environment data
     * @return {Promise} Resolved when report completed
     */
    static createReport() {
        try {
            cmdUtil.log(chalk.bold.blue('Creating Composer report'));
            const {reportId, reportDir} = report.beginReport();

            cmdUtil.log(chalk.blue('Collecting diagnostic data...'));
            report.collectBasicDiagnostics(reportId, reportDir);

            const archiveName = report.completeReport(reportId, reportDir);
            cmdUtil.log(chalk.bold.blue('\nCreated archive file: ') + archiveName);

        } catch (err) {
            if (err.name === 'DirectoryAccessError') {
                return Promise.reject(err);
            } else {
                throw err;
            }
        }

        return Promise.resolve();
    }
}
module.exports = Report;
