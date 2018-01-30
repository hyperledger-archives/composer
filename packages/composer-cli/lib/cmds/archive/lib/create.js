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

const Admin = require('composer-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const chalk = require('chalk');
const fs = require('fs');
const sanitize = require('sanitize-filename');
const cmdUtil = require('../../utils/cmdutils');

/**
 * Composer Create Archive command
 * @private
 */
class Create {

    /**
     * Fn to abstract out the module loading
     * Makes the testing a lot eaiser
     *
     * @param {String} moduleName to load
     * @return {Object} loaded modules
     */
    static loadModule(moduleName) {
        return require.resolve(moduleName);
    }

    /**
      * Command process for deploy command
      * @param {string} argv argument list from composer command

      * @return {Promise} promise when command complete
      */
    static handler(argv) {

        let inputDir = '';

        cmdUtil.log(chalk.blue.bold('Creating Business Network Archive\n'));
        if (argv.sourceType === 'module') {
            // using a npm module name
            //
            let moduleName = argv.sourceName;
            const path = require('path');

            let moduleIndexjs;
            try {
                moduleIndexjs = this.loadModule(moduleName);
            } catch (err) {
                console.log(err);
                if (err.code === 'MODULE_NOT_FOUND') {
                    let localName = process.cwd() + '/node_modules/' + moduleName;
                    cmdUtil.log(chalk.bold.yellow('Not found in main node_module search path, trying current directory'));
                    cmdUtil.log(chalk.yellow('\tCurrent Directory: ') + localName);
                    moduleIndexjs = this.loadModule(localName);
                } else {
                    cmdUtil.log(chalk.blue.red('Unable to locate the npm module specified'));
                    return Promise.reject(err);
                }

            }

            inputDir = path.dirname(moduleIndexjs);

        } else {
            // loading from a file directory given by user
            if (argv.sourceName === '.') {
                inputDir = process.cwd();
            } else {
                inputDir = argv.sourceName;
            }
        }
        cmdUtil.log(chalk.blue.bold('\nLooking for package.json of Business Network Definition'));
        cmdUtil.log(chalk.blue('\tInput directory: ') + inputDir);
        let createOptions = cmdUtil.parseOptions(argv);
        createOptions.updateExternalModels = argv.updateExternalModels;

        return BusinessNetworkDefinition.fromDirectory(inputDir, createOptions).then((result) => {
            cmdUtil.log(chalk.blue.bold('\nFound:'));
            cmdUtil.log(chalk.blue('\tDescription: ') + result.getDescription());
            cmdUtil.log(chalk.blue('\tName: ') + result.getName());
            cmdUtil.log(chalk.blue('\tIdentifier: ') + result.getIdentifier());

            if (!argv.archiveFile) {
                argv.archiveFile = sanitize(result.getIdentifier(), {
                    replacement: '_'
                }) + '.bna';
            }
            // need to write this out to the required file now.
            return result.toArchive()
                .then((result) => {
                    //write the buffer to a file
                    fs.writeFileSync(argv.archiveFile, result);
                    cmdUtil.log(chalk.blue.bold('\nWritten Business Network Definition Archive file to '));
                    cmdUtil.log(chalk.blue('\tOutput file: ') + argv.archiveFile);
                    return;
                });
        });

    }
}

module.exports = Create;
