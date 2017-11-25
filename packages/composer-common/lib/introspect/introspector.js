/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 *
 * Provides access to the structure of transactions, assets and participants.
 *
 * @class
 * @memberof module:composer-common
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
