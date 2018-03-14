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
 * The Historian records the history of actions taken using Composer.
 * It is a registry that stores HistorianRecords; each record is created in response
 * to a transaction being executred.
 *
 * As well as the transactions that are defined in the Network model other actions such
 * as adding assets are treated as transactions so are therefore recorded.
 *
 * Details of these are in the system model.
 *
 * **Applications should retrieve instances from {@link BusinessNetworkConnection}**
 * @extends Registry
 * @see See {@link Registry}
 * @class
 * @memberof module:composer-client
 */
class Historian extends Registry {

    /**
     * Get an existing historian.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {ModelManager} modelManager The ModelManager to use for this historian.
     * @param {Factory} factory The factory to use for this historian.
     * @param {Serializer} serializer The Serializer to use for this historian.
     * @return {Promise} A promise that will be resolved with a {@link Historian}
     * instance representing the historian.
     */
    static getHistorian(securityContext, modelManager, factory, serializer) {
        Util.securityCheck(securityContext);
        if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        return Registry.getRegistry(securityContext, REGISTRY_TYPE, 'org.hyperledger.composer.system.HistorianRecord')
            .then((registry) => {
                // Hardcoded name for display purposes.
                return new Historian(registry.id, 'Historian', securityContext, modelManager, factory, serializer);
            });
    }

    /**
     * Create a historian.
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link BusinessNetworkConnection}</strong>
     * </p>
     *
     * @param {string} id The unique identifier of the transaction registry.
     * @param {string} name The display name for the transaction registry.
     * @param {SecurityContext} securityContext The security context to use for this asset registry.
     * @param {ModelManager} modelManager The ModelManager to use for this transaction registry.
     * @param {Factory} factory The factory to use for this transaction registry.
     * @param {Serializer} serializer The Serializer to use for this transaction registry.
     * @private
     */
    constructor(id, name, securityContext, modelManager, factory, serializer) {
        super(REGISTRY_TYPE, id, name, securityContext, modelManager, factory, serializer);
    }

    /**
     * Unsupported operation; you cannot add a historian record to the historian.
     * This method will always throw an exception when called.
     *
     * @param {Resource} resource The resource to be added to the registry.
     */
    add(resource) {
        throw new Error('cannot add historian records to the historian');
    }

    /**
     * Unsupported operation; you cannot add a historian record to the historian.
     * This method will always throw an exception when called.
     *
     * @param {Resource[]} resources The resources to be added to the registry.
     *
     */
    addAll(resources) {
        throw new Error('cannot add historian records to the historian');
    }

    /**
     * Unsupported operation; you cannot update a historian record in the historian.
     * This method will always throw an exception when called.
     *
     * @param {Resource} resource The resource to be updated in the registry.
     *
     */
    update(resource) {
        throw new Error('cannot update historian records in the historian');
    }

    /**
     * Unsupported operation; you cannot update a historian record in the historian.
     * This method will always throw an exception when called.
     *
     * @param {Resource[]} resources The resources to be updated in the asset registry.
     *
     */
    updateAll(resources) {
        throw new Error('cannot update historian records in the historian');
    }

    /**
     * Unsupported operation; you cannot remove a historian record from the historian.
     * This method will always throw an exception when called.
     *
     * @param {(Resource|string)} resource The resource, or the unique identifier of the resource.
     *
     */
    remove(resource) {
        throw new Error('cannot remove historian records from the historian');
    }

    /**
     * Unsupported operation; you cannot remove a historian record from the historian.
     * This method will always throw an exception when called.
     *
     * @param {(Resource[]|string[])} resources The resources, or the unique identifiers of the resources.
     *
     */
    removeAll(resources) {
        throw new Error('cannot remove historian records from the historian');
    }

}

module.exports = Historian;
