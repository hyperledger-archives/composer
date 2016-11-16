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
const util = require('util');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 */
class EngineModels {

    /**
     * Get all model files in the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    getAllModelsInRegistry(context, args) {
        if (args.length !== 0) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getAllModelsInRegistry', []));
        }
        return context.getModelRegistry().getAll()
            .then((modelFiles) => {
                return modelFiles.map((modelFile) => {
                    return modelFile.toJSON();
                });
            });
    }

    /**
     * Get the specified model file in the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    getModelInRegistry(context, args) {
        if (args.length !== 1) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getModelInRegistry', ['namespace']));
        }
        let namespace = args[0];
        return context.getModelRegistry().get(namespace)
            .then((modelFile) => {
                return modelFile.toJSON();
            });
    }

    /**
     * Add a new model file to the specified model registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    addModelToRegistry(context, args) {
        if (args.length !== 1) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'addModelToRegistry', ['modelFile']));
        }
        let modelManager = context.getModelManager();
        let modelFile = ModelFile.fromJSON(modelManager, JSON.parse(args[0]));
        modelManager.addModelFile(modelFile);
        let modelRegistry = context.getModelRegistry();
        let registryManager = context.getRegistryManager();
        return modelRegistry.add(modelFile)
            .then(() => {
                return modelManager.getAssetDeclarations().reduce((result, declaration) => {
                    return result.then(() => {
                        return registryManager.get('Asset', declaration.getFullyQualifiedName())
                            .catch(() => {
                                return registryManager.add('Asset', declaration.getFullyQualifiedName(), `Asset registry for ${declaration.getFullyQualifiedName()}`);
                            });
                    });
                }, Promise.resolve());
            }).then(() => {
                return modelManager.getParticipantDeclarations().reduce((result, declaration) => {
                    return result.then(() => {
                        return registryManager.get('Participant', declaration.getFullyQualifiedName())
                            .catch(() => {
                                return registryManager.add('Participant', declaration.getFullyQualifiedName(), `Participant registry for ${declaration.getFullyQualifiedName()}`);
                            });
                    });
                }, Promise.resolve());
            });
    }

    /**
     * Update an existing model file to the specified model registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    updateModelInRegistry(context, args) {
        if (args.length !== 1) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'updateModelInRegistry', ['modelFile']));
        }
        let modelManager = context.getModelManager();
        let modelFile = ModelFile.fromJSON(modelManager, JSON.parse(args[0]));
        modelManager.updateModelFile(modelFile);
        let modelRegistry = context.getModelRegistry();
        return modelRegistry.update(modelFile);
    }

    /**
     * Remove an existing model file from the specified model registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    removeModelFromRegistry(context, args) {
        if (args.length !== 1) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'updateModelInRegistry', ['namespace']));
        }
        let namespace = args[0];
        let modelManager = context.getModelManager();
        modelManager.deleteModelFile(namespace);
        let modelRegistry = context.getModelRegistry();
        return modelRegistry.remove(namespace);
    }

}

module.exports = EngineModels;
