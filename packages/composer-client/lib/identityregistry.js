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

const REGISTRY_TYPE = 'Asset';

/**
 * The IdentityRegistry is used to store a set of identities on the blockchain.
 *
 * @extends Registry
 * @see See {@link Registry}
 * @class
 * @memberof module:composer-client
 */
class IdentityRegistry extends Registry {

    /**
     * Get an existing identity registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {ModelManager} modelManager The ModelManager to use for this identity registry.
     * @param {Factory} factory The factory to use for this identity registry.
     * @param {Serializer} serializer The Serializer to use for this identity registry.
     * @return {Promise} A promise that will be resolved with a {@link IdentityRegistry}
     * instance representing the identity registry.
     */
    static getIdentityRegistry(securityContext, modelManager, factory, serializer) {
        Util.securityCheck(securityContext);
        if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        return Registry.getRegistry(securityContext, REGISTRY_TYPE, 'org.hyperledger.composer.system.Identity')
            .then((registry) => {
                return new IdentityRegistry(registry.id, registry.name, securityContext, modelManager, factory, serializer);
            });
    }

    /**
     * Create an identity registry.
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link BusinessNetworkConnection}</strong>
     * </p>
     *
     * @param {string} id The unique identifier of the identity registry.
     * @param {string} name The display name for the identity registry.
     * @param {SecurityContext} securityContext The security context to use for this asset registry.
     * @param {ModelManager} modelManager The ModelManager to use for this identity registry.
     * @param {Factory} factory The factory to use for this identity registry.
     * @param {Serializer} serializer The Serializer to use for this identity registry.
     * @private
     */
    constructor(id, name, securityContext, modelManager, factory, serializer) {
        super(REGISTRY_TYPE, id, name, securityContext, modelManager, factory, serializer);
    }

    /**
     * Unsupported operation; you cannot add an identity to an identity
     * registry.
     *
     * @param {Resource} resource The resource to be added to the registry.
     * @param {string} data The data for the resource.
     *
     */
    add(resource) {
        throw new Error('cannot add identity to an identity registry');
    }

    /**
     * Unsupported operation; you cannot add an identity to an identity
     * registry.
     *
     * @param {Resource[]} resources The resources to be added to the registry.
     *
     */
    addAll(resources) {
        throw new Error('cannot add identities to a identity registry');
    }

    /**
     * Unsupported operation; you cannot update an identity in an identity
     * registry. This method will always throw an exception when called.
     *
     * @param {Resource} resource The resource to be updated in the registry.
     *
     */
    update(resource) {
        throw new Error('cannot update identities in an identity registry');
    }

    /**
     * Unsupported operation; you cannot update an identity in an identity
     * registry.
     *
     * @param {Resource[]} resources The resources to be updated in the asset registry.
     *
     */
    updateAll(resources) {
        throw new Error('cannot update identities in an identity registry');
    }

    /**
     * Unsupported operation; you cannot remove an identity from an identity
     * registry. This method will always throw an exception when called.
     *
     * @param {(Resource|string)} resource The resource, or the unique identifier of the resource.
     *
     */
    remove(resource) {
        throw new Error('cannot remove identities from an identity registry');
    }

    /**
     * Unsupported operation; you cannot remove an identity from an identity
     * registry. This method will always throw an exception when called.
     *
     * @param {(Resource[]|string[])} resources The resources, or the unique identifiers of the resources.
     *
     */
    removeAll(resources) {
        throw new Error('cannot remove identities from an identity registry');
    }

}

module.exports = IdentityRegistry;
