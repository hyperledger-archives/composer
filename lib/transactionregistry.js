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

const REGISTRY_TYPE = 'Transaction';

/**
 * The TransactionRegistry is used to store a set of transactions on the blockchain.
 * <p><a href="diagrams/transactionregistry.svg"><img src="diagrams/transactionregistry.svg" style="width:100%;"/></a></p>
 * @extends Registry
 */
class TransactionRegistry extends Registry {

    /**
     * Get a list of all existing transaction registries.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {ModelManager} modelManager The ModelManager to use for this transaction registry.
     * @param {Factory} factory The factory to use for this transaction registry.
     * @param {Serializer} serializer The Serializer to use for this transaction registry.
     * @return {Promise} A promise that will be resolved with a list of {@link TransactionRegistry}
     * instances representing the transaction registries.
     */
    static getAllTransactionRegistries(securityContext, modelManager, factory, serializer) {
        Util.securityCheck(securityContext);
        if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        return Registry.getAllRegistries(securityContext, REGISTRY_TYPE)
            .then(function (transactionRegistries) {
                return transactionRegistries.map(function (transactionRegistry) {
                    return new TransactionRegistry(transactionRegistry.id, transactionRegistry.name, modelManager, factory, serializer);
                });
            });
    }

    /**
     * Get an existing transaction registry.
     *
     * @protected
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
            .then(function (registry) {
                return new TransactionRegistry(registry.id, registry.name, modelManager, factory, serializer);
            });
    }

    /**
     * Add a new transaction registry.
     *
     * @protected
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
            .then(function () {
                return new TransactionRegistry(id, name, modelManager, factory, serializer);
            });
    }

    /**
     * Create an transaction registry.
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link Concerto}</strong>
     * </p>
     *
     * @protected
     * @param {string} id The unique identifier of the transaction registry.
     * @param {string} name The display name for the transaction registry.
     * @param {ModelManager} modelManager The ModelManager to use for this transaction registry.
     * @param {Factory} factory The factory to use for this transaction registry.
     * @param {Serializer} serializer The Serializer to use for this transaction registry.
     */
    constructor(id, name, modelManager, factory, serializer) {
        super(REGISTRY_TYPE, id, name);
        if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        this.modelManager = modelManager;
        this.factory = factory;
        this.serializer = serializer;
    }

    /**
     * Unsupported operation; you cannot add a transaction to a transaction
     * registry. Call {@link Concerto.submitTransaction} to submit a transaction.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the resource.
     * @param {string} data The data for the resource.
     */
    add(securityContext, id, data) {
        throw new Error('cannot add transactions to a transaction registry');
    }

    /**
     * Unsupported operation; you cannot add a transaction to a transaction
     * registry. Call {@link Concerto.submitTransaction} to submit a transaction.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {Object[]} data The data for the resource.
     */
    addAll(securityContext, data) {
        throw new Error('cannot add transactions to a transaction registry');
    }

    /**
     * Unsupported operation; you cannot update a transaction in a transaction
     * registry. This method will always throw an exception when called.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the resource.
     * @param {string} data The data for the resource.
     */
    update(securityContext, id, data) {
        throw new Error('cannot update transactions in a transaction registry');
    }

    /**
     * Unsupported operation; you cannot update a transaction in a transaction
     * registry. Call {@link Concerto.submitTransaction} to submit a transaction.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {Object[]} data The data for the resource.
     */
    updateAll(securityContext, data) {
        throw new Error('cannot update transactions in a transaction registry');
    }

    /**
     * Unsupported operation; you cannot remove a transaction from a transaction
     * registry. This method will always throw an exception when called.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the resource.
     */
    remove(securityContext, id) {
        throw new Error('cannot remove transactions from a transaction registry');
    }

    /**
     * Unsupported operation; you cannot remove a transaction from a transaction
     * registry. This method will always throw an exception when called.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {(Object[]|string[])} ids The unique identifier of the resource.
     */
    removeAll(securityContext, ids) {
        throw new Error('cannot remove transactions from a transaction registry');
    }

    /**
     * Get all of the transactions in the registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @return {Promise} A promise that will be resolved with an array of {@link
     * Resource} instances representing the transactions.
     */
    getAll(securityContext) {
        let self = this;
        Util.securityCheck(securityContext);
        return super.getAll(securityContext)
            .then(function (resources) {
                return resources.map(function (resource) {
                    return self.serializer.fromJSON(resource);
                });
            });
    }

    /**
     * Get a specific transaction in the registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the transaction.
     * @return {Promise} A promise that will be resolved with a {@link Resource}
     * instance representing the transaction.
     */
    get(securityContext, id) {
        let self = this;
        Util.securityCheck(securityContext);
        return super.get(securityContext, id)
            .then(function (resource) {
                return self.serializer.fromJSON(resource);
            });
    }

}

module.exports = TransactionRegistry;
