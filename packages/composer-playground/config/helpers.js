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
/**
 * @author: @AngularClass
 */

'use strict';

let path = require('path');

// Helper functions
let ROOT = path.resolve(__dirname, '..');


/**
 * @param  {string} flag flag to find
 * @returns {Boolean} whether the flag is found in process.argv or not
 */
function hasProcessFlag(flag) {
    return process.argv.join('').indexOf(flag) > -1;
}


/**
 * @returns {Boolean} whether webpack-dev-server is in process.argv
 */
function isWebpackDevServer() {
    return process.argv[1] && !!(/webpack-dev-server/.exec(process.argv[1]));
}

/**
 * Takes paths relative to composer-playground and appends them to the location of composer-playground to get the full qualified path
 * @example
 * when root directory is /users/user/Documents
 * root('animals', 'dog.js')
 * // returns /users/user/Documents/animals/dog.js
 * @arg  {arguments} args 1 or more parts of a path
 * @return {string} paths passed joined together with the root in format root/arg1/arg2 etc
 */
function root(args) {
    args = Array.prototype.slice.call(arguments, 0);
    return path.join.apply(path, [ROOT].concat(args));
}

exports.hasProcessFlag = hasProcessFlag;
exports.isWebpackDevServer = isWebpackDevServer;
exports.root = root;
