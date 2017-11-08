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

/**
 * Composer Create Archive command
 *
 * composer archive create --archiveFile digitialPropertyNetwork.zip --sourceType module --sourceName digitalproperty-network
 *
 * @private
 */
class Create {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from composer command

    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        let inputDir = '';

        console.log(chalk.blue.bold('Creating Business Network Archive\n'));
        if (argv.sourceType === 'module'){
            // using a npm module name
            //
            let moduleName = argv.sourceName;
            const path = require('path');

            let moduleIndexjs;
            try {
                moduleIndexjs=require.resolve(moduleName);
            } catch (err){
                if (err.code==='MODULE_NOT_FOUND'){
                    let localName = process.cwd()+'/node_modules/'+moduleName;
                    console.log(chalk.bold.yellow('Not found in main node_module search path, trying current directory'));
                    console.log(chalk.yellow('\tCurrent Directory: ')+localName);
                    moduleIndexjs=require.resolve(localName);
                }else {
                    console.log(chalk.blue.red('Unable to locate the npm module specified'));
                    return Promise.reject(err);
                }

            }

            inputDir = path.dirname(moduleIndexjs);
            // console.log('Resolved module name '+argv.sourceName+ '  to '+inputDir);
        }else {
          // loading from a file directory given by user
            if (argv.sourceName==='.'){
                inputDir = process.cwd();
            } else {
                inputDir = argv.sourceName;
            }
        }
        console.log(chalk.blue.bold('\nLooking for package.json of Business Network Definition'));
        console.log(chalk.blue('\tInput directory: ')+inputDir);

        return BusinessNetworkDefinition.fromDirectory(inputDir).then( (result)=> {
            console.log(chalk.blue.bold('\nFound:'));
            console.log(chalk.blue('\tDescription: ')+result.getDescription());
            console.log(chalk.blue('\tName: ')+result.getName());
            console.log(chalk.blue('\tIdentifier: ')+result.getIdentifier());


            if (!argv.archiveFile){
                argv.archiveFile = sanitize(result.getIdentifier(),{replacement:'_'})+'.bna';
            }
          // need to write this out to the required file now.
            return result.toArchive().then (
              (result) => {
                //write the buffer to a file
                  fs.writeFileSync(argv.archiveFile,result);
                  console.log(chalk.blue.bold('\nWritten Business Network Definition Archive file to '));
                  console.log(chalk.blue('\tOutput file: ')+argv.archiveFile);
                  return;
              }

            );

        });

    }
}

module.exports = Create;
