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

/**
 * The runtime module provides the API that is made available to transaction
 * processing functions.
 * @module composer-runtime
 */

module.exports.Container = require('./lib/container');
module.exports.Context = require('./lib/context');
module.exports.DataCollection = require('./lib/datacollection');
module.exports.DataService = require('./lib/dataservice');
module.exports.Engine = require('./lib/engine');
module.exports.HTTPService = require('./lib/httpservice');
module.exports.EventService = require('./lib/eventservice');
module.exports.IdentityService = require('./lib/identityservice');
module.exports.InstalledBusinessNetwork = require('./lib/installedbusinessnetwork');
module.exports.Logger = require('composer-common').Logger;
module.exports.LoggingService = require('./lib/loggingservice');
module.exports.ScriptCompiler = require('./lib/scriptcompiler');
module.exports.QueryCompiler = require('./lib/querycompiler');
