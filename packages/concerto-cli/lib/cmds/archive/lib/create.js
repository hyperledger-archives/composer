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

const Admin = require('@ibm/concerto-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const fs = require('fs');
const sanitize = require('sanitize-filename');
/**
 * <p>
 * Concerto Create Archive command
 * </p>
 *
 * @private
 */
class Create {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from concerto command

    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        console.log('Creating Business Network Archive');
        if (!argv.inputDir){
            const path = require('path');



            console.log(process.env.NODE_PATH);
            console.log('About to do the required');
            let moduleIndexjs;
            try {
                moduleIndexjs=require.resolve(argv.moduleName);

            } catch (err){
                if (err.code==='MODULE_NOT_FOUND'){
                    console.log('Main node_module search path empty - trying cwd');
                    moduleIndexjs=require.resolve(process.cwd()+'/node_modules/'+argv.moduleName);
                }else {
                    console.log('Unable to locate the npm moodule specified');
                    throw err;
                }

            }

            argv.inputDir = path.dirname(moduleIndexjs);
            console.log('Resolving module name '+argv.moduleName);
        }else if (argv.inputDir==='.'){
            argv.inputDir = process.cwd();
        }
        console.log('Looking for package.json of Business Network Definition in '+argv.inputDir);

        return BusinessNetworkDefinition.fromDirectory(argv.inputDir).then( (result)=> {
            console.log('\nDescription:'+result.getDescription());
            console.log('Name:'+result.getName());
            console.log('Identifier:'+result.getIdentifier());


            if (!argv.archiveFile){
                argv.archiveFile = sanitize(result.getIdentifier(),{replacement:'_'})+'.bna';
            }
          // need to write this out to the required file now.
            return result.toArchive().then (
              (result) => {
                //write the buffer to a file
                  fs.writeFileSync(argv.archiveFile,result);
                  console.log('\nWritten Business Network Definition Archive file to '+argv.archiveFile);
                  return;
              }

            );

        }).catch(function(e) {
            console.log(e); // "oh, no!"
        });

    }
}

module.exports = Create;
