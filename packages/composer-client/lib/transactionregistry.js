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

const REGISTRY_TYPE = 'Transaction';

/**
 * The TransactionRegistry is used to store a set of transactions on the blockchain.
 *
 * **Applications should retrieve instances from {@link BusinessNetworkConnection}**
 * @extends Registry
 * @see See {@link Registry}
 * @class
 * @memberof module:composer-client
 */
class TransactionRegistry extends Registry {

    /**
     * Get a list of all existing transaction registries.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {ModelManager} modelManager The ModelManager to use for this transaction registry.
     * @param {Factory} factory The factory to use for this transaction registry.
     * @param {Serializer} serializer The Serializer to use for this transaction registry.
     * @param {BusinessNetworkConnection} bnc BusinessNetworkConnection to use
     * @param {Boolean} systemRegistry True if system transaction registries should be included in the list.
     * @return {Promise} A promise that will be resolved with a list of {@link TransactionRegistry}
     * instances representing the transaction registries.
     */
    static getAllTransactionRegistries(securityContext, modelManager, factory, serializer,bnc,systemRegistry) {
        Util.securityCheck(securityContext);
        if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        return Registry.getAllRegistries(securityContext, REGISTRY_TYPE,systemRegistry)
            .then((transactionRegistries) => {
                return transactionRegistries.map((transactionRegistry) => {
                    return new TransactionRegistry(transactionRegistry.id, transactionRegistry.name, securityContext, modelManager, factory, serializer);
                });
            });
    }

    /**
     * Get an existing transaction registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the transaction registry.
     * @param {ModelManager} modelManager The ModelManager to use for this transaction registry.
     * @param {Factory} factory The factory to use for this transaction registry.
     * @param {Serializer} serializer The Serializer to use for this transaction registry.
     * @return {Promise} A promise that will be resolved with a {@link TransactionRegistry}
     * instance representing the transaction registry.
     */
    static getTransactionRegistry(securityContext, id, modelManager, factory, serializer) {
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
                return new TransactionRegistry(registry.id, registry.name, securityContext, modelManager, factory, serializer);
            });
    }

    /**
     * Add a new transaction registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the transaction registry.
     * @param {string} name The name of the transaction registry.
     * @param {ModelManager} modelManager The ModelManager to use for this transaction registry.
     * @param {Factory} factory The factory to use for this transaction registry.
     * @param {Serializer} serializer The Serializer to use for this transaction registry.
     * @return {Promise} A promise that will be resolved with a {@link TransactionRegistry}
     * instance representing the new transaction registry.
     */
    static addTransactionRegistry(securityContext, id, name, modelManager, factory, serializer) {
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
                return new TransactionRegistry(id, name, securityContext, modelManager, factory, serializer);
            });
    }

    /**
     * Determine whether an registry exists.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the asset registry.
     * @param {ModelManager} modelManager The ModelManager to use for this asset registry.
     * @param {Factory} factory The factory to use for this asset registry.
     * @param {Serializer} serializer The Serializer to use for this asset registry.
     * @return {Promise} A promise that will be resolved with a boolean indicating whether the asset registry exists
     */
    static transactionRegistryExists(securityContext, id, modelManager, factory, serializer) {
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
     * Create an transaction registry.
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
     * Unsupported operation; you cannot add a transaction to a transaction
     * registry. Call {@link BusinessNetworkConnection.submitTransaction} to submit a transaction.
     *
     * @param {Resource} resource The resource to be added to the registry.
     * @param {string} data The data for the resource.
     * @private
     */
    add(resource) {
        throw new Error('cannot add transactions to a transaction registry');
    }

    /**
     * Unsupported operation; you cannot add a transaction to a transaction
     * registry. Call {@link BusinessNetworkConnection.submitTransaction} to submit a transaction.
     *
     * @param {Resource[]} resources The resources to be added to the registry.
     * @private
     */
    addAll(resources) {
        throw new Error('cannot add transactions to a transaction registry');
    }

    /**
     * Unsupported operation; you cannot update a transaction in a transaction
     * registry. This method will always throw an exception when called.
     *
     * @param {Resource} resource The resource to be updated in the registry.
     * @private
     */
    update(resource) {
        throw new Error('cannot update transactions in a transaction registry');
    }

    /**
     * Unsupported operation; you cannot update a transaction in a transaction
     * registry. Call {@link BusinessNetworkConnection.submitTransaction} to submit a transaction.
     *
     * @param {Resource[]} resources The resources to be updated in the asset registry.
     * @private
     */
    updateAll(resources) {
        throw new Error('cannot update transactions in a transaction registry');
    }

    /**
     * Unsupported operation; you cannot remove a transaction from a transaction
     * registry. This method will always throw an exception when called.
     *
     * @param {(Resource|string)} resource The resource, or the unique identifier of the resource.
     * @private
     */
    remove(resource) {
        throw new Error('cannot remove transactions from a transaction registry');
    }

    /**
     * Unsupported operation; you cannot remove a transaction from a transaction
     * registry. This method will always throw an exception when called.
     *
     * @param {(Resource[]|string[])} resources The resources, or the unique identifiers of the resources.
     * @private
     */
    removeAll(resources) {
        throw new Error('cannot remove transactions from a transaction registry');
    }

}

module.exports = TransactionRegistry;
