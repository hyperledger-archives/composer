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

const DefaultModelFileLoader = require('./introspect/loaders/defaultmodelfileloader');
const Factory = require('./factory');
const Globalize = require('./globalize');
const IllegalModelException = require('./introspect/illegalmodelexception');
const Logger = require('./log/logger');
const ModelFile = require('./introspect/modelfile');
const ModelFileDownloader = require('./introspect/loaders/modelfiledownloader');
const ModelUtil = require('./modelutil');
const Serializer = require('./serializer');
const SYSTEM_MODELS = require('./systemmodel');
const TypeNotFoundException = require('./typenotfoundexception');

const LOG = Logger.getLog('ModelManager');

/**
 * Manages the Composer model files.
 *
 *
 * The structure of {@link Resource}s (Assets, Transactions, Participants) is modelled
 * in a set of Composer files. The contents of these files are managed
 * by the {@link ModelManager}. Each Composer file has a single namespace and contains
 * a set of asset, transaction and participant type definitions.
 *
 *
 * Composer applications load their Composer files and then call the {@link ModelManager#addModelFile addModelFile}
 * method to register the Composer file(s) with the ModelManager. The ModelManager
 * parses the text of the Composer file and will make all defined types available
 * to other Composer services, such as the {@link Serializer} (to convert instances to/from JSON)
 * and {@link Factory} (to create instances).
 *
 *
 *
 * @class
 * @memberof module:composer-common
 */
class ModelManager {
    /**
     * Create the ModelManager.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link BusinessNetworkDefinition}</strong>
     * </p>
     * @private
     */
    constructor() {
        LOG.entry('constructor');
        this.modelFiles = {};
        this.factory = new Factory(this);
        this.serializer = new Serializer(this.factory, this);
        this.decoratorFactories = [];
        this.addSystemModels();
        LOG.exit('constructor');
    }

    /**
     * Add the system models to the model manager
     * @private
     */
    addSystemModels() {
        const method = 'addSystemModels';
        LOG.entry(method);

        // add the system model
        SYSTEM_MODELS.forEach((SYSTEM_MODEL) => {
            LOG.info(method, SYSTEM_MODEL);
            let m = new ModelFile(this, SYSTEM_MODEL.contents, SYSTEM_MODEL.fileName);
            this.modelFiles[m.getNamespace()] = m;
        });

        // now validate all the models
        this.validateModelFiles();

        LOG.exit(method);
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
     * Throws an error with details about the existing namespace.
     * @param {ModelFile} modelFile The model file that is trying to declare an existing namespace
     * @private
     */
    _throwAlreadyExists(modelFile) {
        const existingModelFileName = this.modelFiles[modelFile.getNamespace()].getName();
        const postfix = existingModelFileName ? ` in file ${existingModelFileName}` : '';
        const prefix = modelFile.getName() ? ` specified in file ${modelFile.getName()}` : '';
        let errMsg = `Namespace ${modelFile.getNamespace()}${prefix} is already declared${postfix}`;
        throw new Error(errMsg);
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
     * @param {boolean} [disableValidation] - If true then the model files are not validated
     * @throws {IllegalModelException}
     * @return {Object} The newly added model file (internal).
     */
    addModelFile(modelFile, fileName, disableValidation) {
        const NAME = 'addModelFile';
        LOG.info(NAME, 'addModelFile', modelFile, fileName);

        let m = null;

        if (typeof modelFile === 'string') {
            m = new ModelFile(this, modelFile, fileName);
        } else {
            m = modelFile;
        }

        if (m.isSystemModelFile()) {
            throw new Error('Cannot add a model file with the reserved system namespace: ' + m.getNamespace());
        }

        if (!this.modelFiles[m.getNamespace()]) {
            if (!disableValidation) {
                m.validate();
            }
            this.modelFiles[m.getNamespace()] = m;
        } else {
            this._throwAlreadyExists(m);
        }

        return m;
    }

    /**
     * Updates a Composer file (as a string) on the ModelManager.
     * Composer files have a single namespace. If a Composer file with the
     * same namespace has already been added to the ModelManager then it
     * will be replaced.
     * @param {string} modelFile - The Composer file as a string
     * @param {string} fileName - an optional file name to associate with the model file
     * @param {boolean} [disableValidation] - If true then the model files are not validated
     * @throws {IllegalModelException}
     * @returns {Object} The newly added model file (internal).
     */
    updateModelFile(modelFile, fileName, disableValidation) {
        const NAME = 'updateModelFile';
        LOG.info(NAME, 'updateModelFile', modelFile, fileName);
        if (typeof modelFile === 'string') {
            let m = new ModelFile(this, modelFile, fileName);
            return this.updateModelFile(m,fileName,disableValidation);
        } else {
            let existing = this.modelFiles[modelFile.getNamespace()];
            if (!existing) {
                throw new Error('model file does not exist');
            } else if (existing.isSystemModelFile()) {
                throw new Error('System namespace can not be updated');
            }
            if (!disableValidation) {
                modelFile.validate();
            }
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
        } else if (namespace === ModelUtil.getSystemNamespace()) {
            throw new Error('Cannot delete system namespace');
        } else {
            delete this.modelFiles[namespace];
        }
    }

    /**
     * Add a set of Composer files to the model manager.
     * @param {string[]} modelFiles - An array of Composer files as
     * strings.
     * @param {string[]} [fileNames] - An optional array of file names to
     * associate with the model files
     * @param {boolean} [disableValidation] - If true then the model files are not validated
     * @returns {Object[]} The newly added model files (internal).
     */
    addModelFiles(modelFiles, fileNames, disableValidation) {
        const NAME = 'addModelFiles';
        LOG.entry(NAME, 'addModelFiles', modelFiles, fileNames);
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
                    if (m.isSystemModelFile()) {
                        throw new Error('System namespace can not be updated');
                    }
                    if (!this.modelFiles[m.getNamespace()]) {
                        this.modelFiles[m.getNamespace()] = m;
                        newModelFiles.push(m);
                    } else {
                        this._throwAlreadyExists(m);
                    }
                } else {
                    if (modelFile.isSystemModelFile()) {
                        throw new Error('System namespace can not be updated');
                    }
                    if (!this.modelFiles[modelFile.getNamespace()]) {
                        this.modelFiles[modelFile.getNamespace()] = modelFile;
                        newModelFiles.push(modelFile);
                    } else {
                        this._throwAlreadyExists(modelFile);
                    }
                }
            }

            // re-validate all the model files
            if (!disableValidation) {
                this.validateModelFiles();
            }

            // return the model files.
            return newModelFiles;
        } catch (err) {
            this.modelFiles = {};
            Object.assign(this.modelFiles, originalModelFiles);
            throw err;
        } finally {
            LOG.exit(NAME, newModelFiles);
        }
    }


    /**
     * Validates all models files in this model manager
     */
    validateModelFiles() {
        for (let ns in this.modelFiles) {
            this.modelFiles[ns].validate();
        }
    }

    /**
     * Downloads all ModelFiles that are external dependencies and adds or
     * updates them in this ModelManager.
     * @param {Object} [options] - Options object passed to ModelFileLoaders
     * @param {ModelFileDownloader} [modelFileDownloader] - an optional ModelFileDownloader
     * @throws {IllegalModelException} if the models fail validation
     * @return {Promise} a promise when the download and update operation is completed.
     */
    updateExternalModels(options, modelFileDownloader) {

        const NAME = 'updateExternalModels';
        LOG.info(NAME, 'updateExternalModels', options);

        if(!modelFileDownloader) {
            modelFileDownloader = new ModelFileDownloader(new DefaultModelFileLoader(this));
        }

        return modelFileDownloader.downloadExternalDependencies(this.getModelFiles(), options)
                .then((externalModelFiles) => {
                    const originalModelFiles = {};
                    Object.assign(originalModelFiles, this.modelFiles);

                    try {
                        externalModelFiles.forEach((mf) => {
                            const existing = this.modelFiles[mf.getNamespace()];

                            if (existing) {
                                this.updateModelFile(mf, mf.getName(), true); // disable validation
                            } else {
                                this.addModelFile(mf, mf.getName(), true); // disable validation
                            }
                        });

                        // now everything is applied, we need to revalidate all models
                        this.validateModelFiles();
                    } catch (err) {
                        this.modelFiles = {};
                        Object.assign(this.modelFiles, originalModelFiles);
                        throw err;
                    }
                });
    }

    /**
     * Get the array of model file instances
     * Note - this is an internal method and therefore will return the system model
     * as well as any network defined models.
     *
     * It is the callers responsibility to remove this before the data leaves an external API
     *
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
     * @param {string} type - fully qualified type name
     * @return {string} - the resolved type name (fully qualified)
     * @throws {IllegalModelException} - if the type is not defined
     * @private
     */
    resolveType(context, type) {
        // is the type a primitive?
        if (ModelUtil.isPrimitiveType(type)) {
            return type;
        }

        let ns = ModelUtil.getNamespace(type);
        let modelFile = this.getModelFile(ns);
        if (!modelFile) {
            let formatter = Globalize.messageFormatter('modelmanager-resolvetype-nonsfortype');
            throw new IllegalModelException(formatter({
                type: type,
                context: context
            }));
        }

        if (modelFile.isLocalType(type)) {
            return type;
        }

        let formatter = Globalize.messageFormatter('modelmanager-resolvetype-notypeinnsforcontext');
        throw new IllegalModelException(formatter({
            context: context,
            type: type,
            namespace: modelFile.getNamespace()
        }));
    }

    /**
     * Remove all registered Composer files
     */
    clearModelFiles() {
        this.modelFiles = {};
        this.addSystemModels();
    }

    /**
     * Get the ModelFile associated with a namespace
     * Note - this is an internal method and therefore will return the system model
     * as well as any network defined models.
     *
     * It is the callers responsibility to remove this before the data leaves an external API
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
     * @param {string} qualifiedName - fully qualified type name.
     * @return {ClassDeclaration} - the class declaration for the specified type.
     * @throws {TypeNotFoundException} - if the type cannot be found or is a primitive type.
     * @private
     */
    getType(qualifiedName) {

        const namespace = ModelUtil.getNamespace(qualifiedName);

        const modelFile = this.getModelFile(namespace);
        if (!modelFile) {
            const formatter = Globalize.messageFormatter('modelmanager-gettype-noregisteredns');
            throw new TypeNotFoundException(qualifiedName, formatter({
                type: qualifiedName
            }));
        }

        const classDecl = modelFile.getType(qualifiedName);
        if (!classDecl) {
            const formatter = Globalize.messageFormatter('modelmanager-gettype-notypeinns');
            throw new TypeNotFoundException(qualifiedName, formatter({
                type: ModelUtil.getShortName(qualifiedName),
                namespace: namespace
            }));
        }

        return classDecl;
    }


    /**
     * Get all class declarations from system namespaces
     * @return {ClassDeclaration[]} the ClassDeclarations from system namespaces
     */
    getSystemTypes() {
        return this.getModelFiles()
            .filter((modelFile) => {
                return modelFile.isSystemModelFile();
            })
            .reduce((classDeclarations, modelFile) => {
                return classDeclarations.concat(modelFile.getAllDeclarations());
            }, [])
            .filter((classDeclaration) => {
                return classDeclaration.isSystemCoreType();
            });
    }

    /**
     * Get the AssetDeclarations defined in this model manager
     * @param {Boolean} includeSystemType - Include the decalarations of system type in returned data
     * @return {AssetDeclaration[]} the AssetDeclarations defined in the model manager
     */
    getAssetDeclarations(includeSystemType = true) {
        return this.getModelFiles().reduce((prev, cur) => {
            return prev.concat(cur.getAssetDeclarations(includeSystemType));
        }, []);
    }

    /**
     * Get the TransactionDeclarations defined in this model manager
     * @param {Boolean} includeSystemType - Include the decalarations of system type in returned data
     * @return {TransactionDeclaration[]} the TransactionDeclarations defined in the model manager
     */
    getTransactionDeclarations(includeSystemType = true) {
        return this.getModelFiles().reduce((prev, cur) => {
            return prev.concat(cur.getTransactionDeclarations(includeSystemType));
        }, []);
    }

    /**
     * Get the EventDeclarations defined in this model manager
     * @param {Boolean} includeSystemType - Include the decalarations of system type in returned data
     * @return {EventDeclaration[]} the EventDeclaration defined in the model manager
     */
    getEventDeclarations(includeSystemType = true) {
        return this.getModelFiles().reduce((prev, cur) => {
            return prev.concat(cur.getEventDeclarations(includeSystemType));
        }, []);
    }

    /**
     * Get the ParticipantDeclarations defined in this model manager
     * @param {Boolean} includeSystemType - Include the decalarations of system type in returned data
     * @return {ParticipantDeclaration[]} the ParticipantDeclaration defined in the model manager
     */
    getParticipantDeclarations(includeSystemType = true) {
        return this.getModelFiles().reduce((prev, cur) => {
            return prev.concat(cur.getParticipantDeclarations(includeSystemType));
        }, []);
    }

    /**
     * Get the EnumDeclarations defined in this model manager
     * @param {Boolean} includeSystemType - Include the decalarations of system type in returned data
     * @return {EnumDeclaration[]} the EnumDeclaration defined in the model manager
     */
    getEnumDeclarations(includeSystemType = true) {
        return this.getModelFiles().reduce((prev, cur) => {
            return prev.concat(cur.getEnumDeclarations(includeSystemType));
        }, []);
    }

    /**
     * Get the Concepts defined in this model manager
     * @param {Boolean} includeSystemType - Include the decalarations of system type in returned data
     * @return {ConceptDeclaration[]} the ConceptDeclaration defined in the model manager
     */
    getConceptDeclarations(includeSystemType = true) {
        return this.getModelFiles().reduce((prev, cur) => {
            return prev.concat(cur.getConceptDeclarations(includeSystemType));
        }, []);
    }

    /**
     * Get a factory for creating new instances of types defined in this model manager.
     * @return {Factory} A factory for creating new instances of types defined in this model manager.
     */
    getFactory() {
        return this.factory;
    }

    /**
     * Get a serializer for serializing instances of types defined in this model manager.
     * @return {Serializer} A serializer for serializing instances of types defined in this model manager.
     */
    getSerializer() {
        return this.serializer;
    }

    /**
     * Get the decorator factories for this model manager.
     * @return {DecoratorFactory[]} The decorator factories for this model manager.
     */
    getDecoratorFactories() {
        return this.decoratorFactories;
    }

    /**
     * Add a decorator factory to this model manager.
     * @param {DecoratorFactory} factory The decorator factory to add to this model manager.
     */
    addDecoratorFactory(factory) {
        this.decoratorFactories.push(factory);
    }

}

module.exports = ModelManager;
