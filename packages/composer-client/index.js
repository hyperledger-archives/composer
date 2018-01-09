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
 * The composer-common module cannot load connector modules from parent modules
 * when the dependencies are linked together using npm link or lerna. To work
 * around this, the packages that require the connectors register themselves as
 * modules that can load connection managers.
 */
require('composer-common').ConnectionProfileManager.registerConnectionManagerLoader(module);

/**
* <p>
* The composer-client module. Defines the client API for Composer.
* </p>
* <p>
* Composer is a framework for creating blockchain backed digital networks and
* exchanging assets between participants via processing transactions.
* </p>
* <p>
* Applications interact with the framework by instantiating the {@link BusinessNetworkConnection}
* class.
* </p>
* @module composer-client
*/

module.exports.AssetRegistry = require('./lib/assetregistry');
module.exports.BusinessNetworkConnection = require('./lib/businessnetworkconnection');
module.exports.Historian = require('./lib/historian');
module.exports.IdentityRegistry = require('./lib/identityregistry');
module.exports.ParticipantRegistry = require('./lib/participantregistry');
module.exports.TransactionRegistry = require('./lib/transactionregistry');

/**
 * Expose key composer-common classes to simplify client application dependencies
 * @ignore
 */
module.exports.Logger = require('composer-common').Logger;
module.exports.version = require('./package.json');
