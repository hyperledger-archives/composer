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
const Util = require('@ibm/ibm-concerto-common').Util;

/**
 * The ModelRegistry is used to manage a set of models.
 * <p><a href="diagrams/modelregistry.svg"><img src="diagrams/modelregistry.svg" style="width:100%;"/></a></p>
 * @extends Registry
 * @private
 */
class ModelRegistry {

    /**
     * Create an model registry.
     *
     * @protected
     * @param {ModelManager} modelManager The ModelManager to use for this model registry.
     */
    constructor(modelManager) {
        if (!modelManager) {
            throw new Error('modelManager not specified');
        }
        this.modelManager = modelManager;
    }

    /**
     * Adds a model to the model registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {ModelFile} model The model to be added to the model registry.
     * @return {Promise} A promise that is resolved when the model is added to
     * the model registry.
     */
    add(securityContext, model) {
        Util.securityCheck(securityContext);
        return Util.invokeChainCode(securityContext, 'addModelToRegistry', [JSON.stringify(model)]);
    }

    /**
     * Unsupported operation; you cannot add a list of models to a model
     * registry. Call {@link ModelRegistry.add} for each model instead.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {ModelFile} model The model to be added to the model registry.
     */
    addAll(securityContext, model) {
        throw new Error('cannot bulk add models to a model registry');
    }

    /**
     * Updates an model in the model registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {ModelFile} model The model to be updated in the model registry.
     * @return {Promise} A promise that is resolved when the model is updated
     * in the model registry.
     */
    update(securityContext, model) {
        Util.securityCheck(securityContext);
        return Util.invokeChainCode(securityContext, 'updateModelInRegistry', [JSON.stringify(model)]);
    }

    /**
     * Unsupported operation; you cannot update a list of models in a model
     * registry. Call {@link ModelRegistry.update} for each model instead.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {ModelFile} model The model to be added to the model registry.
     */
    updateAll(securityContext, model) {
        throw new Error('cannot bulk update models in a model registry');
    }

    /**
     * Remove an model with a given type and id from the model registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {(ModelFile|string)} model The model, or the unique identifier of the model.
     * @return {Promise} A promise that is resolved when the element is removed
     * from the registry.
     */
    remove(securityContext, model) {
        Util.securityCheck(securityContext);
        let id;
        if (model instanceof ModelFile) {
            id = model.getNamespace();
        } else {
            id = model;
        }
        return Util.invokeChainCode(securityContext, 'removeModelFromRegistry', [id]);
    }

    /**
     * Unsupported operation; you cannot remove a list of models from a model
     * registry. Call {@link ModelRegistry.remove} for each model instead.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {ModelFile} model The model to be added to the model registry.
     */
    removeAll(securityContext, model) {
        throw new Error('cannot bulk remove models from a model registry');
    }

    /**
     * Get all of the models in the registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @return {Promise} A promise that will be resolved with an array of {@link
     * ModelFile} instances representing the models.
     */
    getAll(securityContext) {
        Util.securityCheck(securityContext);
        return Util.queryChainCode(securityContext, 'getAllModelsInRegistry', [])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            })
            .then((resources) => {
                return resources.map((resource) => {
                    return ModelFile.fromJSON(this.modelManager, resource);
                });
            });
    }

    /**
     * Get a specific model in the registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the model.
     * @return {Promise} A promise that will be resolved with a {@link ModelFile}
     * instance representing the model.
     */
    get(securityContext, id) {
        Util.securityCheck(securityContext);
        if (!id) {
            throw new Error('id not specified');
        }
        return Util.queryChainCode(securityContext, 'getModelInRegistry', [id])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            })
            .then((resource) => {
                return ModelFile.fromJSON(this.modelManager, resource);
            });
    }

}

module.exports = ModelRegistry;
