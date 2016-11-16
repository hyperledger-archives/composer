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

const ModelFile = require('@ibm/ibm-concerto-common').ModelFile;

/**
 * A class for managing and persisting model files.
 */
class ModelRegistry {

    /**
     * Constructor.
     * @param {DataService} dataService The data service to use.
     * @param {ModelManager} modelManager The model manager to use.
     */
    constructor(dataService, modelManager) {
        this.dataService = dataService;
        this.modelManager = modelManager;
    }

    /**
     * Get all the model files in this registry.
     * @return {Promise} A promise that will be resolved with an array of {@link
     * ModelFile} objects when complete, or rejected with an error.
     */
    getAll() {
        return this.dataService.getCollection('$sysmodels')
            .then((sysmodels) => {
                return sysmodels.getAll();
            })
            .then((modelFiles) => {
                return modelFiles.map((modelFile) => {
                    return ModelFile.fromJSON(this.modelManager, modelFile);
                });
            });
    }

    /**
     * Get the specified model file in this registry.
     * @param {string} namespace The namespace of the resource.
     * @return {Promise} A promise that will be resolved with a {@link ModelFile}
     * object when complete, or rejected with an error.
     */
    get(namespace) {
        return this.dataService.getCollection('$sysmodels')
            .then((sysmodels) => {
                return sysmodels.get(namespace);
            })
            .then((modelFile) => {
                return ModelFile.fromJSON(this.modelManager, modelFile);
            });
    }

    /**
     * Add all of the specified model files to this registry.
     * @param {ModelFile[]} modelFiles The model files to add to this registry.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    addAll(modelFiles) {
        return this.dataService.getCollection('$sysmodels')
            .then((sysmodels) => {
                return modelFiles.reduce((result, modelFile) => {
                    return result.then(() => {
                        let id = modelFile.getNamespace();
                        let object = modelFile.toJSON();
                        return sysmodels.add(id, object);
                    });
                }, Promise.resolve());
            });
    }

    /**
     * Add the specified model file to this registry.
     * @param {ModelFile} modelFile The model file to add to this registry.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    add(modelFile) {
        let id = modelFile.getNamespace();
        let object = modelFile.toJSON();
        return this.dataService.getCollection('$sysmodels')
            .then((sysmodels) => {
                return sysmodels.add(id, object);
            });
    }

    /**
     * Update all of the specified model files in this registry.
     * @param {ModelFile[]} modelFiles The model files to update in this registry.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    updateAll(modelFiles) {
        return this.dataService.getCollection('$sysmodels')
            .then((sysmodels) => {
                return modelFiles.reduce((result, modelFile) => {
                    return result.then(() => {
                        let id = modelFile.getNamespace();
                        let object = modelFile.toJSON();
                        return sysmodels.update(id, object);
                    });
                }, Promise.resolve());
            });
    }

    /**
     * Update the specified model file in this registry.
     * @param {ModelFile} modelFile The model file to update in this registry.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    update(modelFile) {
        let id = modelFile.getNamespace();
        let object = modelFile.toJSON();
        return this.dataService.getCollection('$sysmodels')
            .then((sysmodels) => {
                return sysmodels.update(id, object);
            });
    }

    /**
     * Remove all of the specified model files from this registry.
     * @param {string[]|ModelFile[]} modelFiles The model files to remove from this registry.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    removeAll(modelFiles) {
        return this.dataService.getCollection('$sysmodels')
            .then((sysmodels) => {
                return modelFiles.reduce((result, modelFile) => {
                    return result.then(() => {
                        if (modelFile instanceof ModelFile) {
                            let id = modelFile.getNamespace();
                            return sysmodels.remove(id);
                        } else {
                            return sysmodels.remove(modelFile);
                        }
                    });
                }, Promise.resolve());
            });
    }

    /**
     * Remove the specified model file from this registry.
     * @param {string|ModelFile} modelFile The model file to remove from this registry.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    remove(modelFile) {
        return this.dataService.getCollection('$sysmodels')
            .then((sysmodels) => {
                if (modelFile instanceof ModelFile) {
                    let id = modelFile.getNamespace();
                    return sysmodels.remove(id);
                } else {
                    return sysmodels.remove(modelFile);
                }
            });
    }

}

module.exports = ModelRegistry;
