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
const path = require('path');
const Logger = require('../log/logger');
const LOG = Logger.getLog('LoadModule');

/**
 * Helper class to support loading NPM modules
 * @private
 */
class LoadModule{

    /**
     * Path to be searched is that returned from 'npm-paths' in addition to any specified in the options
     * Immediate node_modules subdirectories will searched as well.. (i.e. if any dir in the search path doesn't
     * end with node_modules, node_modules will be added to the dir and search in-addition)
     * @private
     *
     * @param {String} nameToLoad name of the module to load
     * @param {Object} options options to use
     * @param {String[]} options.paths Array of additional paths to search (node_modules subdirectories will be searched as well. )
     * @param {boolean}  options.errorNotFound Should an error be thrown on not found, otherwise resolves with null (default)
     * @return {Object} resolved with the value of require(..). Or null if errorNotFound set.
     */
    static loadModule(nameToLoad,options = {}) {
        // put this in the fn to avoid webpkacing issues
        const npmpaths = require('npm-paths');
        let finalLocation;
        let searchPath;
        if (options.paths){
            searchPath = npmpaths().concat(options.paths);
        }else {
            searchPath = npmpaths();
        }
        LOG.debug('loadModule',`${nameToLoad} -- ${searchPath} -- ${options.paths}`);
        for (let p of searchPath) {
        // add on node_modules

            if (path.basename(p) !== 'node_modules'){
                searchPath.push(path.join(p,'node_modules'));
            }

            let p2 = path.resolve(p, nameToLoad);
            LOG.debug('loadModule',`checking path ${p2}`);
            let found = fs.existsSync(p2);
            if (found){
                finalLocation = p2;
                break;
            }
        }

        if (finalLocation){
            LOG.info('loadModule',`Loading ${nameToLoad} from ${finalLocation}`);
            const req = require;
            let module = req(finalLocation);
            return module;
        } else {
            if (options.errorNotFound && options.errorNotFound===true){
                let err = new Error(`Unable to load ${nameToLoad} from ${searchPath}`);
                throw err;
            } else {
                LOG.info(`Unable to load ${nameToLoad} from ${searchPath}`);
                return null;
            }
        }
    }

}
module.exports = LoadModule;