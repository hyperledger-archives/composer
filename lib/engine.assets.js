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

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 */
class EngineAssets {

    /**
     * Find all of the assets in the specified asset registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    findAssetsInAssetRegistry(context, args) {
        return Promise.reject();
    }

    /**
     * Query all of the assets in the specified asset registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    queryAssetsInAssetRegistry(context, args) {
        return Promise.reject();
    }

    /**
     * Resolve all of the assets in the specified asset registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    resolveAllAssetsInAssetRegistry(context, args) {
        return Promise.reject();
    }

    /**
     * Resolve a specified asset in the specified asset registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    resolveAssetInAssetRegistry(context, args) {
        return Promise.reject();
    }

}

module.exports = EngineAssets;
