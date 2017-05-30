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




const homedir = require('homedir');
// const cmdUtil = require('../../utils/cmdutils');
const sanitize = require('sanitize-filename');
const fs = require('fs');
const path = require('path');
const Pretty = require('prettyjson');
const chalk = require('chalk');
const PROFILE_ROOT = path.resolve(homedir(),'.composer-connection-profiles');

/**
 * <p>
 * Composer deploy command
 * </p>
 * <p><a href="diagrams/Deploy.svg"><img src="diagrams/deploy.svg" style="width:100%;"/></a></p>
 * @private
 */
class Export {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from composer command
    * @param {boolean} updateOption true if the network is to be updated
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        let profileName = argv.p;
        let dir = argv.d;

        console.log(chalk.bold.blue('Exporting connection profile'));
        console.log(chalk.blue('\t'+profileName));

        let listPromise = new Promise(

          function (resolve,reject){

              try {
                  let profilePath = path.resolve(PROFILE_ROOT,profileName,'connection.json');
                  let destPath = path.resolve(dir);
                  if (!fs.existsSync(profilePath)){
                      reject('Profile Path does not exist:' + profilePath);
                  }
                  if (!fs.existsSync(destPath)){
                      reject('Destination directory does not exist:' + profilePath);
                  }

                  let profile = require(profilePath);
              // create the name of the exported profile
                  let filename = path.resolve(destPath,sanitize(profile.name,{replacement:'_'})+'_profile.json');

                  let s  = fs.readFileSync(profilePath,'UTF8');
                  console.log(Pretty.render(s,{
                      keysColor: 'blue',
                      dashColor: 'blue',
                      stringColor: 'white'
                  }));
                  fs.writeFileSync(filename,s);

                  resolve();
              } catch (error){
                  reject(error);
              }
          }


        );

        return listPromise;
    }





}

module.exports = Export;
