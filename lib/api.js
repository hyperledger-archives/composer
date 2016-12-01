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

const Logger = require('@ibm/ibm-concerto-common').Logger;

const LOG = Logger.getLog('Api');

/**
 * The JavaScript Api available to transaction processor functions.
 * @protected
 */
class Api {

    /**
     * Constructor.
     * @param {Factory} factory The factory to use..
     * @param {RegistryManager} registryManager The registry manager to use.
     */
    constructor(factory, registryManager) {
        const method = 'constructor';
        LOG.entry(method, factory, registryManager);
        this.factory = factory;
        this.registryManager = registryManager;
        LOG.exit(method);
    }

    /**
     * Get the factory.
     * @return {Factory} The factory.
     */
    getFactory() {
        const method = 'getFactory';
        LOG.entry(method);
        LOG.exit(method, this.factory);
        return this.factory;
    }

    /**
     * Get the specified asset registry.
     * @param {string} id The ID of the asset registry.
     * @return {Promise} A promise that is resolved with the asset registry, or
     * rejected with an error.
     */
    getAssetRegistry(id) {
        const method = 'getAssetRegistry';
        LOG.entry(method, id);
        return this.registryManager.get('Asset', id)
            .then((registry) => {
                LOG.exit(method, registry);
                return registry;
            });
    }

}

module.exports = Api;
