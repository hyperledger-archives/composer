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

/** Prefix to use for all the config names
 * @prvate
*/
const PREFIX='composer.';

/**
 * Mediates beween the NPM config module and the codebase
 * Enables our isomorphic codebase to work in webpack
 *
 * @private
 */
class ConfigMediator {

    /**
     * Get a value with the 'name', giving back the acceptable 'init' value if the name is not present
     * @param {String} name key of config value to look up, this will have the defined prefix added to it
     * @param {Object} init if the config doesn't have the value (or can't be found for whatever reason) the default value to return
     *
     * @return {Object} supplied object or the init value if needed
     */
    static get(name, init) {
        let key = PREFIX+name;
        try {
            // This weird code is needed to trick browserify (and webpack)
            process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
            const mod = 'config';
            const req = require;
            const config = req(mod);
            if (config.has(key)) {
                return config.get(key);
            }
        } catch (e) {
            let msg = e.message;
            if (msg && msg.match(/Cannot parse config file/)){
                throw e;
            }
            // We don't care if we can't find the config module, it won't be
            // there when the code is running inside a webpacked or similar environment
        }
        return init;
    }

}

module.exports = ConfigMediator;