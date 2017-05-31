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

const assetSteps = require('./lib/assetsteps');
const businessNetworkSteps = require('./lib/businessnetworksteps');
const errorSteps = require('./lib/errorsteps');
const eventSteps = require('./lib/eventsteps');
const hooks = require('./lib/hooks');
const identitySteps = require('./lib/identitysteps');
const participantSteps = require('./lib/participantsteps');
const transactionSteps = require('./lib/transactionsteps');

module.exports = function () {
    assetSteps.call(this);
    businessNetworkSteps.call(this);
    errorSteps.call(this);
    eventSteps.call(this);
    hooks.call(this);
    identitySteps.call(this);
    participantSteps.call(this);
    transactionSteps.call(this);
};
