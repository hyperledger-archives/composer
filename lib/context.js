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

const Factory = require('@ibm/ibm-concerto-common').Factory;
const ModelManager = require('@ibm/ibm-concerto-common').ModelManager;
const ModelRegistry = require('./modelregistry');
const RegistryManager = require('./registrymanager');
const Serializer = require('@ibm/ibm-concerto-common').Serializer;

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
    }

    /**
     * Initialize the context for use.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    initialize() {

        // Load all of the models from the model registry into the model manager.
        let modelManager = this.getModelManager();
        let modelRegistry = this.getModelRegistry();
        return modelRegistry.getAll()
            .then((modelFiles) => {
                modelFiles.forEach((modelFile) => {
                    modelManager.addModelFile(modelFile);
                });
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
        if (!this.modelManager) {
            this.modelManager = new ModelManager();
        }
        return this.modelManager;
    }

    /**
     * Get the model registry.
     * @return {ModelRegistry} The model registry.
     */
    getModelRegistry() {
        if (!this.modelRegistry) {
            this.modelRegistry = new ModelRegistry(this.getDataService(), this.getModelManager());
        }
        return this.modelRegistry;
    }

    /**
     * Get the factory.
     * @return {Factory} The factory.
     */
    getFactory() {
        if (!this.factory) {
            this.factory = new Factory(this.getModelManager());
        }
        return this.factory;
    }

    /**
     * Get the serializer.
     * @return {Serializer} The serializer.
     */
    getSerializer() {
        if (!this.serializer) {
            this.serializer = new Serializer(this.getFactory(), this.getModelManager());
        }
        return this.serializer;
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
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

}

module.exports = Context;
