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


// const shell = require('shelljs');
const restserver = require('composer-rest-server');

/**
 * Composer dev hlf command
 *
 *
 *
 * @private
 */
class rest {

    /**
    * Command process for deploy command
    * @param {string} argv argument list from composer command

    * @return {Promise} resolved when command has completed
    */
    static handler(argv) {
        return restserver.startRestServer(argv,false);
    }
}

module.exports = rest;
