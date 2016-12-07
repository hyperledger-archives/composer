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
 * <p>
 * Provides access to the structure of transactions, assets and participants.
 * </p>
 * @class
 * @memberof module:ibm-concerto-common
 */
class Introspector {
    /**
     * Create the Introspector.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link BusinessNetworkDefinition}</strong>
     * </p>
     * @param {ModelManager} modelManager - the ModelManager that backs this Introspector
     */
    constructor(modelManager) {
        this.modelManager = modelManager;
    }

    /**
     * Visitor design pattern
     * @param {Object} visitor - the visitor
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    accept(visitor,parameters) {
        return visitor.visit(this, parameters);
    }

    /**
     * Returns all the class declarations for the business network.
     * @return {ClassDeclaration[]} the array of class declarations
     */
    getClassDeclarations() {
        let result = [];
        const modelFiles = this.modelManager.getModelFiles();
        for(let n=0; n < modelFiles.length; n++) {
            const modelFile = modelFiles[n];
            result = result.concat(modelFile.getAllDeclarations());
        }
        return result;
    }

    /**
     * Returns the class declaration with the given fully qualified name.
     * Throws an error if the class declaration does not exist.
     * @param {String} fullyQualifiedTypeName  - the fully qualified name of the type
     * @return {ClassDeclaration} the class declaration
     * @throws {Error} if the class declaration does not exist
     */
    getClassDeclaration(fullyQualifiedTypeName) {
        return this.modelManager.getType(fullyQualifiedTypeName);
    }

    /**
     * Returns the backing ModelManager
     * @return {ModelManager} the backing ModelManager
     * @private
     */
    getModelManager() {
        return this.modelManager;
    }
}

module.exports = Introspector;
