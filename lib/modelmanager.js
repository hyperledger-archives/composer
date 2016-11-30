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

const Globalize = require('./globalize');
const IllegalModelException = require('./introspect/illegalmodelexception');
const ModelUtil = require('./modelutil');
const ModelFile = require('./introspect/modelfile');

/**
 * <p>
 * The structure of {@link Resource}s (Assets, Transactions, Participants) is modelled
 * in a set of Concerto files. The contents of these files are managed
 * by the {@link ModelManager}. Each Concerto file has a single namespace and contains
 * a set of asset, transaction and participant type definitions.
 * </p>
 * <p>
 * Concerto applications load their Concerto files and then call the {@link ModelManager#addModelFile addModelFile}
 * method to register the Concerto file(s) with the ModelManager. The ModelManager
 * parses the text of the Concerto file and will make all defined types available
 * to other Concerto services, such as the {@link Serializer} (to convert instances to/from JSON)
 * and {@link Factory} (to create instances).
 * </p>
 * <p><a href="diagrams/modelmanager.svg"><img src="diagrams/modelmanager.svg" style="width:100%;"/></a></p>
 * @private
 * @class
 * @memberof module:ibm-concerto-common
 */
class ModelManager {
    /**
     * Create the ModelManager.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link Concerto}</strong>
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
    accept(visitor,parameters) {
        return visitor.visit(this, parameters);
    }

    /**
     * Adds a Concerto file (as a string) to the ModelManager.
     * Concerto files have a single namespace. If a Concerto file with the
     * same namespace has already been added to the ModelManager then it
     * will be replaced.
     * Note that if there are dependencies between multiple files the files
     * must be added in dependency order, or the addModelFiles method can be
     * used to add a set of files irrespective of dependencies.
     * @param {string} modelFile - The Concerto file as a string
     * @throws {InvalidModelException}
     * @return {Object} The newly added model file (internal).
     */
    addModelFile(modelFile) {
        if (typeof modelFile === 'string') {
            let m = new ModelFile(this, modelFile);
            m.validate();
            this.modelFiles[m.getNamespace()] = m;
            return m;
        } else {
            modelFile.validate();
            this.modelFiles[modelFile.getNamespace()] = modelFile;
            return modelFile;
        }
    }

    /**
     * Updates a Concerto file (as a string) on the ModelManager.
     * Concerto files have a single namespace. If a Concerto file with the
     * same namespace has already been added to the ModelManager then it
     * will be replaced.
     * @param {string} modelFile - The Concerto file as a string
     * @throws {InvalidModelException}
     * @returns {Object} The newly added model file (internal).
     */
    updateModelFile(modelFile) {
        if (typeof modelFile === 'string') {
            let m = new ModelFile(this, modelFile);
            if (!this.modelFiles[m.getNamespace()]) {
                throw new Error('model file does not exist');
            }
            m.validate();
            this.modelFiles[m.getNamespace()] = m;
            return m;
        } else {
            if (!this.modelFiles[modelFile.getNamespace()]) {
                throw new Error('model file does not exist');
            }
            modelFile.validate();
            this.modelFiles[modelFile.getNamespace()] = modelFile;
            return modelFile;
        }
    }

    /**
     * Remove the Concerto file for a given namespace
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
     * Add a set of Concerto files to the model manager.
     * @param {string[]} modelFiles - An array of Concerto files as
     * strings.
     * @returns {Object[]} The newly added model files (internal).
     */
    addModelFiles(modelFiles) {
        const originalModelFiles = {};
        Object.assign(originalModelFiles, this.modelFiles);
        let newModelFiles = [];

        try {
            // create the model files
            modelFiles.forEach((modelFile) => {
                if (typeof modelFile === 'string') {
                    let m = new ModelFile(this, modelFile);
                    this.modelFiles[m.getNamespace()] = m;
                    newModelFiles.push(m);
                } else {
                    this.modelFiles[modelFile.getNamespace()] = modelFile;
                    newModelFiles.push(modelFile);
                }
            });

            // re-validate all the model files
            for (let ns in this.modelFiles) {
                this.modelFiles[ns].validate();
            }

            // return the model files.
            return newModelFiles;
        }
        catch(err) {
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

        for(let n=0; n < keys.length;n++) {
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
    resolveType(context,type) {
        // is the type a primitive?
        if(!ModelUtil.isPrimitiveType(type)) {

            let ns = ModelUtil.getNamespace(type);
            let modelFile = this.getModelFile(ns);

            if(!modelFile) {
                let formatter = Globalize.messageFormatter('modelmanager-resolvetype-nonsfortype');
                throw new IllegalModelException(formatter({
                    type: type,
                    context: context
                }));
            }

            if(!modelFile.isLocalType(type)) {
                let formatter = Globalize.messageFormatter('modelmanager-resolvetype-notypeinnsforcontext');
                throw new IllegalModelException(formatter({
                    context: context,
                    type: type,
                    namespace: modelFile.getNamespace()
                }));
            }
            else {
                return modelFile.getNamespace() + '.' + type;
            }
        }
        else {
            return type;
        }
    }

    /**
     * Remove all registered Concerto files
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
        if(!ModelUtil.isPrimitiveType(type)) {
            let ns = ModelUtil.getNamespace(type);
            let modelFile = this.getModelFile(ns);

            if(!modelFile) {
                let formatter = Globalize.messageFormatter('modelmanager-gettype-noregisteredns');
                throw new Error(formatter({
                    type: type
                }));
            }

            let classDecl = modelFile.getType(type);

            if(!classDecl) {
                throw new Error( 'No type ' + type + ' in namespace ' + modelFile.getNamespace() );
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

}

module.exports = ModelManager;
