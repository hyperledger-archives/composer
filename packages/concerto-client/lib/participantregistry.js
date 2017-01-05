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

const Registry = require('./registry');
const Util = require('@ibm/ibm-concerto-common').Util;

const REGISTRY_TYPE = 'Participant';

/**
 * The ParticipantRegistry is used to manage a set of participants stored on the blockchain.
 * <p><a href="./diagrams/participantregistry.svg"><img src="./diagrams/participantregistry.svg" style="width:100%;"/></a></p>
 * @extends Registry
 * @see See [Registry]{@link module:ibm-concerto-client.Registry}
 * @class
 * @memberof module:ibm-concerto-client
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
     * @return {Promise} A promise that will be resolved with a list of {@link ParticipantRegistry}
     * instances representing the participant registries.
     */
    static getAllParticipantRegistries(securityContext, modelManager, factory, serializer) {
        Util.securityCheck(securityContext);
        if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        return Registry.getAllRegistries(securityContext, REGISTRY_TYPE)
            .then((participantRegistries) => {
                return participantRegistries.map((participantRegistry) => {
                    return new ParticipantRegistry(participantRegistry.id, participantRegistry.name, securityContext, modelManager, factory, serializer);
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
     * @return {Promise} A promise that will be resolved with a {@link ParticipantRegistry}
     * instance representing the participant registry.
     */
    static getParticipantRegistry(securityContext, id, modelManager, factory, serializer) {
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
                return new ParticipantRegistry(registry.id, registry.name, securityContext, modelManager, factory, serializer);
            });
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
     * @return {Promise} A promise that will be resolved with a {@link ParticipantRegistry}
     * instance representing the new participant registry.
     */
    static addParticipantRegistry(securityContext, id, name, modelManager, factory, serializer) {
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
                return new ParticipantRegistry(id, name, securityContext, modelManager, factory, serializer);
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
     */
    constructor(id, name, securityContext, modelManager, factory, serializer) {
        super(REGISTRY_TYPE, id, name, securityContext, modelManager, factory, serializer);
    }

}

module.exports = ParticipantRegistry;
