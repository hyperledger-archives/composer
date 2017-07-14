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
     * Issue a new identity to a participant in the business network.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    issueIdentity(context, args) {
        const method = 'issueIdentity';
        LOG.entry(method, context, args);
        if (args.length !== 2) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'issueIdentity', ['participantFQI', 'identityName']));
        }
        let participantFQI = args[0];
        let identityName = args[1];
        let identityManager = context.getIdentityManager();
        return identityManager.issueIdentity(participantFQI, identityName)
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Bind an existing identity to a participant in the business network.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    bindIdentity(context, args) {
        const method = 'bindIdentity';
        LOG.entry(method, context, args);
        if (args.length !== 2) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'bindIdentity', ['participantFQI', 'certificate']));
        }
        let participantFQI = args[0];
        let certificate = args[1];
        let identityManager = context.getIdentityManager();
        return identityManager.bindIdentity(participantFQI, certificate)
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Activate the current identity in the business network.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    activateIdentity(context, args) {
        const method = 'activateIdentity';
        LOG.entry(method, context, args);
        if (args.length !== 0) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'activateIdentity', []));
        }
        let identityManager = context.getIdentityManager();
        return identityManager.activateIdentity()
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Revoke an identity in the business network.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    revokeIdentity(context, args) {
        const method = 'revokeIdentity';
        LOG.entry(method, context, args);
        if (args.length !== 1) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'revokeIdentity', ['identityId']));
        }
        let identityId = args[0];
        let identityManager = context.getIdentityManager();
        return identityManager.revokeIdentity(identityId)
            .then(() => {
                LOG.exit(method);
            });
    }

}

module.exports = EngineIdentities;
