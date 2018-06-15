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

exports.command = 'generator <subcommand>';
exports.desc = 'Composer generator command to convert a Business Network Definition to code';
exports.builder = function (yargs) {
   // apply commands in subdirectories, throws an error if an incorrect command is entered
    return yargs.demandCommand(1, 'Incorrect command. Please see the list of commands above, or enter "composer generator --help".')
   .commandDir('generator');
};
exports.handler = function (argv) {};

module.exports.Create = require('./generator/lib/createCode');
