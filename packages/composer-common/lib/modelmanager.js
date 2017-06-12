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

const Globalize = require('./globalize');
const IllegalModelException = require('./introspect/illegalmodelexception');
const ModelUtil = require('./modelutil');
const ModelFile = require('./introspect/modelfile');

/**
 * <p>
 * The structure of {@link Resource}s (Assets, Transactions, Participants) is modelled
 * in a set of Composer files. The contents of these files are managed
 * by the {@link ModelManager}. Each Composer file has a single namespace and contains
 * a set of asset, transaction and participant type definitions.
 * </p>
 * <p>
 * Composer applications load their Composer files and then call the {@link ModelManager#addModelFile addModelFile}
 * method to register the Composer file(s) with the ModelManager. The ModelManager
 * parses the text of the Composer file and will make all defined types available
 * to other Composer services, such as the {@link Serializer} (to convert instances to/from JSON)
 * and {@link Factory} (to create instances).
 * </p>
 * <p><a href="./diagrams-private/modelmanager.svg"><img src="./diagrams-private/modelmanager.svg" style="height:100%;"/></a></p>
 * @private
 * @class
 * @memberof module:composer-common
 */
class ModelManager {
    /**
     * Create the ModelManager.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link Composer}</strong>
     * </p>
     */
    constructor() {
        this.modelFiles = {};
    }

    /**
     * Visitor design pattern
     * @param {Object} visitor - the visitor
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    accept(visitor, parameters) {
        return visitor.visit(this, parameters);
    }

    /**
     * Validates a Composer file (as a string) to the ModelManager.
     * Composer files have a single namespace.
     *
     * Note that if there are dependencies between multiple files the files
     * must be added in dependency order, or the addModelFiles method can be
     * used to add a set of files irrespective of dependencies.
     * @param {string} modelFile - The Composer file as a string
     * @param {string} fileName - an optional file name to associate with the model file
     * @throws {IllegalModelException}
     */
    validateModelFile(modelFile, fileName) {
        if (typeof modelFile === 'string') {
            let m = new ModelFile(this, modelFile, fileName);
            m.validate();
        } else {
            modelFile.validate();
        }
    }

    /**
     * Adds a Composer file (as a string) to the ModelManager.
     * Composer files have a single namespace. If a Composer file with the
     * same namespace has already been added to the ModelManager then it
     * will be replaced.
     * Note that if there are dependencies between multiple files the files
     * must be added in dependency order, or the addModelFiles method can be
     * used to add a set of files irrespective of dependencies.
     * @param {string} modelFile - The Composer file as a string
     * @param {string} fileName - an optional file name to associate with the model file
     * @throws {IllegalModelException}
     * @return {Object} The newly added model file (internal).
     */
    addModelFile(modelFile, fileName) {
        if (typeof modelFile === 'string') {
            let m = new ModelFile(this, modelFile, fileName);
            m.validate();
            m.retrofit();
            this.modelFiles[m.getNamespace()] = m;
            return m;
        } else {
            modelFile.validate();
            modelFile.retrofit();
            this.modelFiles[modelFile.getNamespace()] = modelFile;
            return modelFile;
        }
    }

    /**
     * Updates a Composer file (as a string) on the ModelManager.
     * Composer files have a single namespace. If a Composer file with the
     * same namespace has already been added to the ModelManager then it
     * will be replaced.
     * @param {string} modelFile - The Composer file as a string
     * @param {string} fileName - an optional file name to associate with the model file
     * @throws {IllegalModelException}
     * @returns {Object} The newly added model file (internal).
     */
    updateModelFile(modelFile, fileName) {
        if (typeof modelFile === 'string') {
            let m = new ModelFile(this, modelFile, fileName);
            if (!this.modelFiles[m.getNamespace()]) {
                throw new Error('model file does not exist');
            }
            m.validate();
            m.retrofit();
            this.modelFiles[m.getNamespace()] = m;
            return m;
        } else {
            if (!this.modelFiles[modelFile.getNamespace()]) {
                throw new Error('model file does not exist');
            }
            modelFile.validate();
            modelFile.retrofit();
            this.modelFiles[modelFile.getNamespace()] = modelFile;
            return modelFile;
        }
    }

    /**
     * Remove the Composer file for a given namespace
     * @param {string} namespace - The namespace of the model file to
     * delete.
     */
    deleteModelFile(namespace) {
        if (!this.modelFiles[namespace]) {
            throw new Error('model file does not exist');
        }
        delete this.modelFiles[namespace];
    }

    /**
     * Add a set of Composer files to the model manager.
     * @param {string[]} modelFiles - An array of Composer files as
     * strings.
     * @param {string[]} fileNames - An optional array of file names to
     * associate with the model files
     * @returns {Object[]} The newly added model files (internal).
     */
    addModelFiles(modelFiles, fileNames) {
        const originalModelFiles = {};
        Object.assign(originalModelFiles, this.modelFiles);
        let newModelFiles = [];

        try {
            // create the model files
            for (let n = 0; n < modelFiles.length; n++) {
                const modelFile = modelFiles[n];
                let fileName = null;

                if (fileNames) {
                    fileName = fileNames[n];
                }

                if (typeof modelFile === 'string') {
                    let m = new ModelFile(this, modelFile, fileName);
                    this.modelFiles[m.getNamespace()] = m;
                    newModelFiles.push(m);
                } else {
                    this.modelFiles[modelFile.getNamespace()] = modelFile;
                    newModelFiles.push(modelFile);
                }
            }

            // re-validate all the model files
            for (let ns in this.modelFiles) {
                this.modelFiles[ns].validate();
            }

            // let's go and retrofit the model to make sure all is good
            // make sure that models are all correctly/
            // temp workaround until system models in place
            for (let ns in this.modelFiles) {
                if (! this.modelFiles[ns] === undefined) {
                    this.modelFiles[ns].retrofit();
                }
            }


            // return the model files.
            return newModelFiles;
        }
        catch (err) {
            this.modelFiles = {};
            Object.assign(this.modelFiles, originalModelFiles);
            throw err;
        }
    }

    /**
     * Get the array of model file instances
     * @return {ModelFile[]} The ModelFiles registered
     * @private
     */
    getModelFiles() {
        let keys = Object.keys(this.modelFiles);
        let result = [];

        for (let n = 0; n < keys.length; n++) {
            result.push(this.modelFiles[keys[n]]);
        }

        return result;
    }

    /**
     * Check that the type is valid and returns the FQN of the type.
     * @param {string} context - error reporting context
     * @param {string} type - a short type name
     * @return {string} - the resolved type name (fully qualified)
     * @throws {IllegalModelException} - if the type is not defined
     * @private
     */
    resolveType(context, type) {
        // is the type a primitive?
        if (!ModelUtil.isPrimitiveType(type)) {

            let ns = ModelUtil.getNamespace(type);
            let modelFile = this.getModelFile(ns);

            if (!modelFile) {
                let formatter = Globalize.messageFormatter('modelmanager-resolvetype-nonsfortype');
                throw new IllegalModelException(formatter({
                    type: type,
                    context: context
                }));
            }

            if (!modelFile.isLocalType(type)) {
                let formatter = Globalize.messageFormatter('modelmanager-resolvetype-notypeinnsforcontext');
                throw new IllegalModelException(formatter({
                    context: context,
                    type: type,
                    namespace: modelFile.getNamespace()
                }));
            }
            else {
                return type;
            }
        }
        else {
            return type;
        }
    }

    /**
     * Remove all registered Composer files
     */
    clearModelFiles() {
        this.modelFiles = {};
    }

    /**
     * Get the ModelFile associated with a namespace
     * @param {string} namespace - the namespace containing the ModelFile
     * @return {ModelFile} registered ModelFile for the namespace or null
     * @private
     */
    getModelFile(namespace) {
        return this.modelFiles[namespace];
    }

    /**
     * Get the namespaces registered with the ModelManager.
     * @return {string[]} namespaces - the namespaces that have been registered.
     */
    getNamespaces() {
        return Object.keys(this.modelFiles);
    }

    /**
     * Look up a type in all registered namespaces.
     *
     * @param {string} type - the fully qualified name of a type
     * @return {ClassDeclaration} - the class declaration or null for primitive types
     * @throws {Error} - if the type cannot be found
     * @private
     */
    getType(type) {
        // is the type a primitive?
        if (!ModelUtil.isPrimitiveType(type)) {
            let ns = ModelUtil.getNamespace(type);
            let modelFile = this.getModelFile(ns);

            if (!modelFile) {
                let formatter = Globalize.messageFormatter('modelmanager-gettype-noregisteredns');
                throw new Error(formatter({
                    type: type
                }));
            }

            let classDecl = modelFile.getType(type);

            if (!classDecl) {
                throw new Error('No type ' + type + ' in namespace ' + modelFile.getNamespace());
            }

            return classDecl;
        }
        else {
            return null;
        }
    }

    /**
     * Get the AssetDeclarations defined in this model manager
     * @return {AssetDeclaration[]} the AssetDeclarations defined in the model manager
     */
    getAssetDeclarations() {
        return this.getModelFiles().reduce((prev, cur) => {
            return prev.concat(cur.getAssetDeclarations());
        }, []);
    }

    /**
     * Get the TransactionDeclarations defined in this model manager
     * @return {TransactionDeclaration[]} the TransactionDeclarations defined in the model manager
     */
    getTransactionDeclarations() {
        return this.getModelFiles().reduce((prev, cur) => {
            return prev.concat(cur.getTransactionDeclarations());
        }, []);
    }

    /**
     * Get the EventDeclarations defined in this model manager
     * @return {EventDeclaration[]} the EventDeclaration defined in the model manager
     */
    getEventDeclarations() {
        return this.getModelFiles().reduce((prev, cur) => {
            return prev.concat(cur.getEventDeclarations());
        }, []);
    }

    /**
     * Get the ParticipantDeclarations defined in this model manager
     * @return {ParticipantDeclaration[]} the ParticipantDeclaration defined in the model manager
     */
    getParticipantDeclarations() {
        return this.getModelFiles().reduce((prev, cur) => {
            return prev.concat(cur.getParticipantDeclarations());
        }, []);
    }

    /**
     * Get the EnumDeclarations defined in this model manager
     * @return {EnumDeclaration[]} the EnumDeclaration defined in the model manager
     */
    getEnumDeclarations() {
        return this.getModelFiles().reduce((prev, cur) => {
            return prev.concat(cur.getEnumDeclarations());
        }, []);
    }

    /**
     * Get the Concepts defined in this model manager
     * @return {ConceptDeclaration[]} the ConceptDeclaration defined in the model manager
     */
    getConceptDeclarations() {
        return this.getModelFiles().reduce((prev, cur) => {
            return prev.concat(cur.getConceptDeclarations());
        }, []);
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

}

module.exports = ModelManager;
