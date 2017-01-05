/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const Logger = require('@ibm/concerto-common').Logger;
const util = require('util');

const LOG = Logger.getLog('EngineIdentities');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 * @memberof module:ibm-concerto-runtime
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
