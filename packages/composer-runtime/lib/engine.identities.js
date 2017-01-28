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

const Logger = require('composer-common').Logger;
const util = require('util');

const LOG = Logger.getLog('EngineIdentities');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 * @memberof module:composer-runtime
 */
class EngineIdentities {

    /**
     * Add a mapping from the specified identity, or user ID, to the specified
     * participant.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    addParticipantIdentity(context, args) {
        const method = 'addParticipantIdentity';
        LOG.entry(method, context, args);
        if (args.length !== 2) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'addParticipantIdentity', ['participantId', 'userId']));
        }
        let participantId = args[0];
        let userId = args[1];
        let identityManager = context.getIdentityManager();
        return identityManager.addIdentityMapping(participantId, userId)
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Remove any mapping for the specified identity, or user ID.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    removeIdentity(context, args) {
        const method = 'removeIdentity';
        LOG.entry(method, context, args);
        if (args.length !== 1) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'removeIdentity', ['userId']));
        }
        let userId = args[0];
        let identityManager = context.getIdentityManager();
        return identityManager.removeIdentityMapping(userId)
            .then(() => {
                LOG.exit(method);
            });
    }

}

module.exports = EngineIdentities;
