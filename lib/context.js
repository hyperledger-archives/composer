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

const BusinessNetworkDefinition = require('@ibm/ibm-concerto-common').BusinessNetworkDefinition;
const RegistryManager = require('./registrymanager');
const Resolver = require('./resolver');

/**
 * A class representing the current request being handled by the JavaScript engine.
 * @protected
 * @abstract
 */
class Context {

    /**
     * Constructor.
     * @param {Engine} engine The chaincode engine that owns this context.
     */
    constructor(engine) {
        this.engine = engine;
        this.businessNetworkDefinition = null;
    }

    /**
     * Initialize the context for use.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    initialize() {

        // Load the business network from the archive.
        return this.getDataService().getCollection('$sysdata')
            .then((collection) => {
                return collection.get('businessnetwork');
            })
            .then((object) => {
                let businessNetworkArchive = Buffer.from(object.data, 'base64');
                return BusinessNetworkDefinition.fromArchive(businessNetworkArchive);
            })
            .then((businessNetworkDefinition) => {
                this.businessNetworkDefinition = businessNetworkDefinition;
            });

    }

    /**
     * Get the data service provided by the chaincode container.
     * @abstract
     * @return {DataService} The data service provided by the chaincode container.
     */
    getDataService() {
        throw new Error('abstract function called');
    }

    /**
     * Get the model manager.
     * @return {ModelManager} The model manager.
     */
    getModelManager() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getModelManager();
    }

    /**
     * Get the script manager.
     * @return {ScriptManager} The script manager.
     */
    getScriptManager() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getScriptManager();
    }

    /**
     * Get the factory.
     * @return {Factory} The factory.
     */
    getFactory() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getFactory();
    }

    /**
     * Get the serializer.
     * @return {Serializer} The serializer.
     */
    getSerializer() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getSerializer();
    }

    /**
     * Get the introspector.
     * @return {Introspector} The serializer.
     */
    getIntrospector() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getIntrospector();
    }

    /**
     * Get the registry manager.
     * @return {RegistryManager} The registry manager.
     */
    getRegistryManager() {
        if (!this.registryManager) {
            this.registryManager = new RegistryManager(this.getDataService(), this.getIntrospector(), this.getSerializer());
        }
        return this.registryManager;
    }

    /**
     * Get the resolver.
     * @return {Resolver} The resolver.
     */
    getResolver() {
        if (!this.resolver) {
            this.resolver = new Resolver(this.getRegistryManager());
        }
        return this.resolver;
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

}

module.exports = Context;
