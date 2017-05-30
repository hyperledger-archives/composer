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
const path = require('path');
const fs = require('fs');
const Table = require('cli-table');

const PROFILE_ROOT = path.resolve(homedir(),'.composer-connection-profiles');


/**
 * <p>
 * Composer network list command
 * </p>
 * <p><a href="diagrams/List.svg"><img src="diagrams/list.svg" style="width:100%;"/></a></p>
 * @private
 */
class List {

  /**
    * Command process for network list command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        // let listOutput;
        // let spinner;
        let profilesDir = path.resolve(homedir(),'.composer-connection-profiles');

        let listPromise = new Promise(

          function (resolve,reject){

              let table = new Table(
                { head:['Profile name','Type' ,'Description']}
              );
              let contents = fs.readdirSync(profilesDir);


              let arrayLength = contents.length;
              for (let i=0; i<arrayLength;i++){
                  let data = [];
                  let profilePath = path.resolve(PROFILE_ROOT,contents[i],'connection.json');

                  if (!fs.existsSync(profilePath)){
                      data.push(path.basename(profilePath),'-','Missing connection.json');
                  }else {
                      let profile = require(profilePath);
                      data.push(profile.name,profile.type,profile.description);
                  }
                  table.push(data);

              }
              console.log(table);
              resolve(table);
          }


        );

        return listPromise;


    }




}

module.exports = List;
