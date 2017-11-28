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

const Registry = require('./registry');
const Util = require('composer-common').Util;

const REGISTRY_TYPE = 'Participant';

/**
 * The ParticipantRegistry is used to manage a set of participants stored on the blockchain.
 *
 * @extends Registry
 * @see See {@link Registry}
 * @class
 * @memberof module:composer-client
 */
class ParticipantRegistry extends Registry {

    /**
     * Get a list of all existing participant registries.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {ModelManager} modelManager The ModelManager to use for this participant registry.
     * @param {Factory} factory The factory to use for this participant registry.
     * @param {Serializer} serializer The Serializer to use for this participant registry.
     * @param {BusinessNetworkConnection} bnc BusinessNetworkConnection to use
     * @param {Boolean} [includeSystem] Should system registries be included? (optional, default to false)
     * @return {Promise} A promise that will be resolved with a list of {@link ParticipantRegistry}
     * instances representing the participant registries.
     */
    static getAllParticipantRegistries(securityContext, modelManager, factory, serializer, bnc, includeSystem) {
        Util.securityCheck(securityContext);
        if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        return Registry.getAllRegistries(securityContext, REGISTRY_TYPE,includeSystem)
            .then((participantRegistries) => {
                return participantRegistries.map((participantRegistry) => {
                    return new ParticipantRegistry(participantRegistry.id, participantRegistry.name, securityContext, modelManager, factory, serializer, bnc);
                });
            });
    }

    /**
     * Get an existing participant registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the participant registry.
     * @param {ModelManager} modelManager The ModelManager to use for this participant registry.
     * @param {Factory} factory The factory to use for this participant registry.
     * @param {Serializer} serializer The Serializer to use for this participant registry.
     * @param {BusinessNetworkConnection} bnc BusinessNetworkConnection to use
     * @return {Promise} A promise that will be resolved with a {@link ParticipantRegistry}
     * instance representing the participant registry.
     */
    static getParticipantRegistry(securityContext, id, modelManager, factory, serializer, bnc) {
        Util.securityCheck(securityContext);
        if (!id) {
            throw new Error('id not specified');
        } else if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        return Registry.getRegistry(securityContext, REGISTRY_TYPE, id)
            .then((registry) => {
                return new ParticipantRegistry(registry.id, registry.name, securityContext, modelManager, factory, serializer, bnc);
            });
    }

    /**
     * Determine whether a participant registry exists.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the asset registry.
     * @param {ModelManager} modelManager The ModelManager to use for this asset registry.
     * @param {Factory} factory The factory to use for this asset registry.
     * @param {Serializer} serializer The Serializer to use for this asset registry.
     * @param {BusinessNetworkConnection} bnc BusinessNetworkConnection to use
     * @return {Promise} A promise that will be resolved with a boolean indicating whether the asset registry exists
     */
    static participantRegistryExists(securityContext, id, modelManager, factory, serializer, bnc) {
        Util.securityCheck(securityContext);
        if (!id) {
            throw new Error('id not specified');
        } else if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        return Registry.existsRegistry(securityContext, REGISTRY_TYPE, id);
    }

    /**
     * Add a new participant registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the participant registry.
     * @param {string} name The name of the participant registry.
     * @param {ModelManager} modelManager The ModelManager to use for this participant registry.
     * @param {Factory} factory The factory to use for this participant registry.
     * @param {Serializer} serializer The Serializer to use for this participant registry.
     * @param {BusinessNetworkConnection} bnc BusinessNetworkConnection to use
     * @return {Promise} A promise that will be resolved with a {@link ParticipantRegistry}
     * instance representing the new participant registry.
     */
    static addParticipantRegistry(securityContext, id, name, modelManager, factory, serializer, bnc) {
        Util.securityCheck(securityContext);
        if (!id) {
            throw new Error('id not specified');
        } else if (!name) {
            throw new Error('name not specified');
        } else if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        return Registry.addRegistry(securityContext, REGISTRY_TYPE, id, name)
            .then(() => {
                return new ParticipantRegistry(id, name, securityContext, modelManager, factory, serializer, bnc);
            });
    }

    /**
     * Create an participant registry.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link BusinessNetworkConnection}</strong>
     * </p>
     * @protected
     * @param {string} id The unique identifier of the participant registry.
     * @param {string} name The display name for the participant registry.
     * @param {SecurityContext} securityContext The security context to use for this participant registry.
     * @param {ModelManager} modelManager The ModelManager to use for this participant registry.
     * @param {Factory} factory The factory to use for this participant registry.
     * @param {Serializer} serializer The Serializer to use for this participant registry.
     * @param {BusinessNetworkConnection} bnc BusinessNetworkConnection to use
     */
    constructor(id, name, securityContext, modelManager, factory, serializer,bnc) {
        super(REGISTRY_TYPE, id, name, securityContext, modelManager, factory, serializer, bnc);
    }

}

module.exports = ParticipantRegistry;
