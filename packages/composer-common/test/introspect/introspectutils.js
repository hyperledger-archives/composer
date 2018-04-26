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
const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const fs = require('fs');

/**
 * Some useful utils
 *
 * @class IntrospectUtils
 */
class IntrospectUtils {

    /**
     * Creates an instance of IntrospectUtils.
     * @param {ModelManager} modelManager optional modelManager
     */
    constructor(modelManager) {
        if (!modelManager) {
            this.modelManager = new ModelManager();
        } else {
            this.modelManager = modelManager;
        }
    }

    /**
     * Load an arbitrary number of model files.
     * @param {String[]} modelFileNames array of model file names.
     * @param {ModelManager} modelManager the model manager to which the created model files will be registered.
     * @return {ModelFile[]} array of loaded model files, matching the supplied arguments.
     */
    loadModelFiles(modelFileNames) {
        const modelFiles = [];
        for (let modelFileName of modelFileNames) {
            const modelDefinitions = fs.readFileSync(modelFileName, 'utf8');
            const modelFile = new ModelFile(this.modelManager, modelDefinitions);
            modelFiles.push(modelFile);
        }
        return modelFiles;
    }

    /**
     * load a specific model file
     * @param {String} modelFileName the name of te model file
     * @returns {ModelFile} a model file
     */
    loadModelFile(modelFileName) {
        return this.loadModelFiles([modelFileName], this.modelManager)[0];
    }

    /**
     * load the last declaration in a model file
     * @param {String} modelFileName the name of the model file
     * @param {type} type the type of declaration
     * @returns {type} the declaration
     */
    loadLastDeclaration(modelFileName, type) {
        const modelFile = this.loadModelFile(modelFileName);
        const declarations = modelFile.getDeclarations(type);
        return declarations[declarations.length - 1];
    }
}
module.exports = IntrospectUtils;
