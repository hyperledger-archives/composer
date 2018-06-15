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

module.exports.version = require('./package.json');

/**
 * The command line interface for Hyperledger Composer.
 *
 * Composer is a framework for creating blockchain backed digital networks and
 * exchanging assets between participants via processing transactions.
 * @module composer-cli
 */
module.exports.Archive = require('./lib/cmds/archive');
module.exports.Card = require('./lib/cmds/card');
module.exports.Generator = require('./lib/cmds/generator');
module.exports.Identity = require('./lib/cmds/identity');
module.exports.Network = require('./lib/cmds/network');
module.exports.Participant = require('./lib/cmds/participant');
module.exports.Report = require('./lib/cmds/report');
module.exports.Transaction = require('./lib/cmds/transaction');
