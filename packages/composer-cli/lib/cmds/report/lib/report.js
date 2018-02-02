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
    * Command implementation.
    * @param {Object} args argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(args) {
        return Promise.resolve(this.createReport(args.file));
    }

    /**
     * Get the current environment data
     */
    static createReport() {
        cmdUtil.log(chalk.bold.blue('Creating Composer report'));
        let tmpDirectory = report.setupReportDir();
        cmdUtil.log(chalk.blue('Triggering node report...'));
        report.createNodeReport(tmpDirectory);
        let outputFile = report.archiveReport(tmpDirectory);
        cmdUtil.log(chalk.bold.blue('Created archive file: '+outputFile));
    }
}
module.exports = Report;
