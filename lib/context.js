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

const BusinessNetwork = require('@ibm/ibm-concerto-common').BusinessNetwork;
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
        this.businessNetwork = null;
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
                return BusinessNetwork.fromArchive(businessNetworkArchive);
            })
            .then((businessNetwork) => {
                this.businessNetwork = businessNetwork;
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
        if (!this.businessNetwork) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetwork.getModelManager();
    }

    /**
     * Get the script manager.
     * @return {ScriptManager} The script manager.
     */
    getScriptManager() {
        if (!this.businessNetwork) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetwork.getScriptManager();
    }

    /**
     * Get the factory.
     * @return {Factory} The factory.
     */
    getFactory() {
        if (!this.businessNetwork) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetwork.getFactory();
    }

    /**
     * Get the serializer.
     * @return {Serializer} The serializer.
     */
    getSerializer() {
        if (!this.businessNetwork) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetwork.getSerializer();
    }

    /**
     * Get the introspector.
     * @return {Introspector} The serializer.
     */
    getIntrospector() {
        if (!this.businessNetwork) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetwork.getIntrospector();
    }

    /**
     * Get the registry manager.
     * @return {RegistryManager} The registry manager.
     */
    getRegistryManager() {
        if (!this.registryManager) {
            this.registryManager = new RegistryManager(this.getDataService(), this.getSerializer());
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
