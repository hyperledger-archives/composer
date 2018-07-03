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

const parser = require('./parser');
const AssetDeclaration = require('./assetdeclaration');
const EnumDeclaration = require('./enumdeclaration');
const ConceptDeclaration = require('./conceptdeclaration');
const ParticipantDeclaration = require('./participantdeclaration');
const TransactionDeclaration = require('./transactiondeclaration');
const EventDeclaration = require('./eventdeclaration');
const IllegalModelException = require('./illegalmodelexception');
const ParseException = require('./parseexception');
const ModelUtil = require('../modelutil');
const Globalize = require('../globalize');

/**
 * Class representing a Model File. A Model File contains a single namespace
 * and a set of model elements: assets, transactions etc.
 *
 * @class
 * @memberof module:composer-common
 */
class ModelFile {

    /**
     * Create a ModelFile. This should only be called by framework code.
     * Use the ModelManager to manage ModelFiles.
     * @private
     * @param {ModelManager} modelManager - the ModelManager that manages this
     * ModelFile
     * @param {string} definitions - The DSL model as a string.
     * @param {string} [fileName] - The optional filename for this modelfile
     * @param {boolean} [external] - The optional external attribute for this modelfile
     * @throws {IllegalModelException}
     */
    constructor(modelManager, definitions, fileName) {
        this.modelManager = modelManager;
        this.external = false;
        this.declarations = [];
        this.localTypes = new Map();
        this.imports = [];
        this.importShortNames = new Map();
        this.importWildcardNamespaces = [];
        this.importUriMap = {};
        this.fileName = 'UNKNOWN';

        if(!definitions || typeof definitions !== 'string') {
            throw new Error('ModelFile expects a Composer model as a string as input.');
        }
        this.definitions = definitions;

        if(fileName && typeof fileName !== 'string') {
            throw new Error('ModelFile expects an (optional) filename as a string.');
        }
        this.fileName = fileName;

        if(fileName) {
            this.external = fileName.startsWith('@');
        }

        try {
            this.ast = parser.parse(definitions);
        }
        catch(err) {
            if(err.location && err.location.start) {
                throw new ParseException(err.message, err.location, fileName);
            }
            else {
                throw err;
            }
        }

        this.namespace = this.ast.namespace;
        this.systemModelFile = (this.namespace === ModelUtil.getSystemNamespace());

        if(this.ast.imports) {
            this.ast.imports.forEach((imp) => {
                this.imports.push(imp.namespace);
                this.importShortNames.set(ModelUtil.getShortName(imp.namespace), imp.namespace);
                if (ModelUtil.isWildcardName(imp.namespace)) {
                    const wildcardNamespace = ModelUtil.getNamespace(imp.namespace);
                    this.importWildcardNamespaces.push(wildcardNamespace);
                }
                if(imp.uri) {
                    this.importUriMap[imp.namespace] = imp.uri;
                }
            });
        }

        // if we are not in the system namespace we add imports to all the system types
        if(!this.isSystemModelFile()) {
            const systemTypes = this.modelManager.getSystemTypes();
            for(let index in systemTypes) {
                let fqn = systemTypes[index].getFullyQualifiedName();
                this.imports.unshift(fqn);
                this.importShortNames.set(ModelUtil.getShortName(fqn), fqn);
            }
        }

        for(let n=0; n < this.ast.body.length; n++ ) {
            let thing = this.ast.body[n];

            if(thing.type === 'AssetDeclaration') {
                this.declarations.push( new AssetDeclaration(this, thing) );
            }
            else if(thing.type === 'TransactionDeclaration') {
                this.declarations.push( new TransactionDeclaration(this, thing) );
            }
            else if(thing.type === 'EventDeclaration') {
                this.declarations.push( new EventDeclaration(this, thing) );
            }
            else if(thing.type === 'ParticipantDeclaration') {
                this.declarations.push( new ParticipantDeclaration(this, thing) );
            }
            else if(thing.type === 'EnumDeclaration') {
                this.declarations.push( new EnumDeclaration(this, thing) );
            }
            else if(thing.type === 'ConceptDeclaration') {
                this.declarations.push( new ConceptDeclaration(this, thing) );
            }
            else {
                let formatter = Globalize('en').messageFormatter('modelfile-constructor-unrecmodelelem');

                throw new IllegalModelException(formatter({
                    'type': thing.type,
                }),this.modelFile);
            }
        }

        // Now build local types from Declarations
        for(let index in this.declarations) {
            let classDeclaration = this.declarations[index];
            let localType = this.getNamespace() + '.' + classDeclaration.getName();
            this.localTypes.set(localType, this.declarations[index]);
        }
    }

    /**
     * Returns true if this ModelFile was downloaded from an external URI.
     * @return {boolean} true iff this ModelFile was downloaded from an external URI
     */
    isExternal() {
        return this.external;
    }

    /**
     * Returns the URI for an import, or null if the namespace was not associated with a URI.
     * @param {string} namespace - the namespace for the import
     * @return {string} the URI or null if the namespace was not associated with a URI.
     * @private
     */
    getImportURI(namespace) {
        const result = this.importUriMap[namespace];
        if(result) {
            return result;
        }
        else {
            return null;
        }
    }

    /**
     * Returns an object that maps from the import declarations to the URIs specified
     * @return {Object} keys are import declarations, values are URIs
     * @private
     */
    getExternalImports() {
        return this.importUriMap;
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
     * Returns the ModelManager associated with this ModelFile
     *
     * @return {ModelManager} The ModelManager for this ModelFile
     */
    getModelManager() {
        return this.modelManager;
    }

    /**
     * Returns the types that have been imported into this ModelFile.
     *
     * @return {string[]} The array of imports for this ModelFile
     */
    getImports() {
        return this.imports;
    }

    /**
     * Validates the ModelFile.
     *
     * @throws {IllegalModelException} if the model is invalid
     * @private
     */
    validate() {

        // Validate all of the imports to check that they reference
        // namespaces or types that actually exist.
        this.imports.forEach((importName) => {
            const importNamespace = ModelUtil.getNamespace(importName);
            const modelFile = this.getModelManager().getModelFile(importNamespace);
            if (!modelFile) {
                let formatter = Globalize.messageFormatter('modelmanager-gettype-noregisteredns');
                throw new IllegalModelException(formatter({
                    type: importName
                }), this);
            }
            if (ModelUtil.isWildcardName(importName)) {
                // This is a wildcard import, org.acme.*
                // Doesn't matter if 0 or 100 types in the namespace.
                return;
            }
            const importShortName = ModelUtil.getShortName(importName);
            if (!modelFile.isLocalType(importShortName)) {
                let formatter = Globalize.messageFormatter('modelmanager-gettype-notypeinns');
                throw new IllegalModelException(formatter({
                    type: importShortName,
                    namespace: importNamespace
                }), this);
            }
        });

        // Validate all of the types in this model file.
        for(let n=0; n < this.declarations.length; n++) {
            let classDeclaration = this.declarations[n];
            classDeclaration.validate();
        }

    }

    /**
     * Check that the type is valid.
     * @param {string} context - error reporting context
     * @param {string} type - a short type name
     * @param {Object} [fileLocation] - location details of the error within the model file.
     * @param {String} fileLocation.start.line - start line of the error location.
     * @param {String} fileLocation.start.column - start column of the error location.
     * @param {String} fileLocation.end.line - end line of the error location.
     * @param {String} fileLocation.end.column - end column of the error location.
     * @throws {IllegalModelException} - if the type is not defined
     * @private
     */
    resolveType(context,type,fileLocation) {
        // is the type a primitive?
        if(!ModelUtil.isPrimitiveType(type)) {
            // is it an imported type?
            if(!this.isImportedType(type)) {
                // is the type declared locally?
                if(!this.isLocalType(type)) {
                    let formatter = Globalize('en').messageFormatter('modelfile-resolvetype-undecltype');
                    throw new IllegalModelException(formatter({
                        'type': type,
                        'context': context,
                    }),this.modelFile,fileLocation);
                }
            }
            else {
                // check whether type is defined in another file
                this.getModelManager().resolveType(context,this.resolveImport(type));
            }
        }
    }

    /**
     * Returns true if the type is defined in this namespace.
     * @param {string} type - the short name of the type
     * @return {boolean} - true if the type is defined in this ModelFile
     * @private
     */
    isLocalType(type) {
        let result = (type !== null && this.getLocalType(type) !== null);
        //console.log('isLocalType ' + this.getNamespace() + ' ' + type + '=' + result );
        return result;
    }

    /**
     * Returns true if the type is imported from another namespace
     * @param {string} type - the short name of the type
     * @return {boolean} - true if the type is imported from another namespace
     * @private
     */
    isImportedType(type) {
        if (this.importShortNames.has(type)) {
            return true;
        } else {
            for(let index in this.importWildcardNamespaces) {
                let wildcardNamespace = this.importWildcardNamespaces[index];
                const modelFile = this.getModelManager().getModelFile(wildcardNamespace);
                if (modelFile && modelFile.isLocalType(type)) {
                    return true;
                }
            }
            return false;
        }
    }

    /**
     * Returns the FQN for a type that is imported from another namespace
     * @param {string} type - the short name of the type
     * @return {string} - the FQN of the resolved import
     * @throws {Error} - if the type is not imported
     * @private
     */
    resolveImport(type) {
        if (this.importShortNames.has(type)) {
            return this.importShortNames.get(type);
        } else {
            for(let index in this.importWildcardNamespaces) {
                let wildcardNamespace = this.importWildcardNamespaces[index];
                const modelFile = this.getModelManager().getModelFile(wildcardNamespace);
                if (modelFile && modelFile.isLocalType(type)) {
                    return wildcardNamespace + '.' + type;
                }
            }
        }

        let formatter = Globalize('en').messageFormatter('modelfile-resolveimport-failfindimp');

        throw new IllegalModelException(formatter({
            'type': type,
            'imports': this.imports,
            'namespace': this.getNamespace()
        }),this.modelFile);
    }

    /**
     * Returns true if the type is defined in the model file
     * @param {string} type the name of the type
     * @return {boolean} true if the type (asset or transaction) is defined
     */
    isDefined(type) {
        return ModelUtil.isPrimitiveType(type) || this.getLocalType(type) !== null;
    }

    /**
     * Returns the FQN of the type or null if the type could not be resolved.
     * For primitive types the type name is returned.
     * @param {string} type - a FQN or short type name
     * @return {string | ClassDeclaration} the class declaration for the type or null.
     * @private
     */
    getType(type) {
        // is the type a primitive?
        if(!ModelUtil.isPrimitiveType(type)) {
            // is it an imported type?
            if(!this.isImportedType(type)) {
                // is the type declared locally?
                if(!this.isLocalType(type)) {
                    return null;
                }
                else {
                    return this.getLocalType(type);
                }
            }
            else {
                // check whether type is defined in another file
                const fqn = this.resolveImport(type);
                const modelFile = this.getModelManager().getModelFile(ModelUtil.getNamespace(fqn));
                if (!modelFile) {
                    return null;
                } else {
                    return modelFile.getLocalType(fqn);
                }
            }
        }
        else {
            // for primitive types we just return the name
            return type;
        }
    }

    /**
     * Returns the FQN of the type or null if the type could not be resolved.
     * For primitive types the short type name is returned.
     * @param {string} type - a FQN or short type name
     * @return {string} the FQN type name or null
     * @private
     */
    getFullyQualifiedTypeName(type) {
        // is the type a primitive?
        if(!ModelUtil.isPrimitiveType(type)) {
            // is it an imported type?
            if(!this.isImportedType(type)) {
                // is the type declared locally?
                if(!this.isLocalType(type)) {
                    return null;
                }
                else {
                    return this.getLocalType(type).getFullyQualifiedName();
                }
            }
            else {
                // check whether type is defined in another file
                const fqn = this.resolveImport(type);
                const modelFile = this.getModelManager().getModelFile(ModelUtil.getNamespace(fqn));
                return modelFile.getLocalType(fqn).getFullyQualifiedName();
            }
        }
        else {
            // for primitive types we just return the name
            return type;
        }
    }

    /**
     * Returns the type with the specified name or null
     * @param {string} type the short OR FQN name of the type
     * @return {ClassDeclaration} the ClassDeclaration, or null if the type does not exist
     */
    getLocalType(type) {
        if(!type.startsWith(this.getNamespace())) {
            type = this.getNamespace() + '.' + type;
        }

        if (this.localTypes.has(type)) {
            return this.localTypes.get(type);
        } else {
            return null;
        }
    }

    /**
     * Get the AssetDeclarations defined in this ModelFile or null
     * @param {string} name the name of the type
     * @return {AssetDeclaration} the AssetDeclaration with the given short name
     */
    getAssetDeclaration(name) {
        let classDeclaration = this.getLocalType(name);
        if(classDeclaration instanceof AssetDeclaration) {
            return classDeclaration;
        }

        return null;
    }

    /**
     * Get the TransactionDeclaration defined in this ModelFile or null
     * @param {string} name the name of the type
     * @return {TransactionDeclaration} the TransactionDeclaration with the given short name
     */
    getTransactionDeclaration(name) {
        let classDeclaration = this.getLocalType(name);
        if(classDeclaration instanceof TransactionDeclaration) {
            return classDeclaration;
        }

        return null;
    }

    /**
     * Get the EventDeclaration defined in this ModelFile or null
     * @param {string} name the name of the type
     * @return {EventDeclaration} the EventDeclaration with the given short name
     */
    getEventDeclaration(name) {
        let classDeclaration = this.getLocalType(name);
        if(classDeclaration instanceof EventDeclaration) {
            return classDeclaration;
        }

        return null;
    }

    /**
     * Get the ParticipantDeclaration defined in this ModelFile or null
     * @param {string} name the name of the type
     * @return {ParticipantDeclaration} the ParticipantDeclaration with the given short name
     */
    getParticipantDeclaration(name) {
        let classDeclaration = this.getLocalType(name);
        if(classDeclaration instanceof ParticipantDeclaration) {
            return classDeclaration;
        }

        return null;
    }


    /**
     * Get the Namespace for this model file.
     * @return {string} The Namespace for this model file
     */
    getNamespace() {
        return this.namespace;
    }

    /**
     * Get the filename for this model file. Note that this may be null.
     * @return {string} The filename for this model file
     */
    getName() {
        return this.fileName;
    }

    /**
     * Get the AssetDeclarations defined in this ModelFile
     * @param {Boolean} includeSystemType - Include the decalarations of system type in returned data
     * @return {AssetDeclaration[]} the AssetDeclarations defined in the model file
     */
    getAssetDeclarations(includeSystemType = true) {
        return this.getDeclarations(AssetDeclaration, includeSystemType);
    }

    /**
     * Get the TransactionDeclarations defined in this ModelFile
     * @param {Boolean} includeSystemType - Include the decalarations of system type in returned data
     * @return {TransactionDeclaration[]} the TransactionDeclarations defined in the model file
     */
    getTransactionDeclarations(includeSystemType = true) {
        return this.getDeclarations(TransactionDeclaration, includeSystemType);
    }

    /**
     * Get the EventDeclarations defined in this ModelFile
     * @param {Boolean} includeSystemType - Include the decalarations of system type in returned data
     * @return {EventDeclaration[]} the EventDeclarations defined in the model file
     */
    getEventDeclarations(includeSystemType = true) {
        return this.getDeclarations(EventDeclaration, includeSystemType);
    }

    /**
     * Get the ParticipantDeclarations defined in this ModelFile
     * @param {Boolean} includeSystemType - Include the decalarations of system type in returned data
     * @return {ParticipantDeclaration[]} the ParticipantDeclaration defined in the model file
     */
    getParticipantDeclarations(includeSystemType = true) {
        return this.getDeclarations(ParticipantDeclaration, includeSystemType);
    }

    /**
     * Get the ConceptDeclarations defined in this ModelFile
     * @param {Boolean} includeSystemType - Include the decalarations of system type in returned data
     * @return {ConceptDeclaration[]} the ParticipantDeclaration defined in the model file
     */
    getConceptDeclarations(includeSystemType = true) {
        return this.getDeclarations(ConceptDeclaration, includeSystemType);
    }

    /**
     * Get the EnumDeclarations defined in this ModelFile
     * @param {Boolean} includeSystemType - Include the decalarations of system type in returned data
     * @return {EnumDeclaration[]} the EnumDeclaration defined in the model file
     */
    getEnumDeclarations(includeSystemType = true) {
        return this.getDeclarations(EnumDeclaration, includeSystemType);
    }

    /**
     * Get the instances of a given type in this ModelFile
     * @param {Function} type - the type of the declaration
     * @param {Boolean} includeSystemType - Include the decalarations of system type in returned data
     * @return {ClassDeclaration[]} the ClassDeclaration defined in the model file
     */
    getDeclarations(type, includeSystemType = true) {
        let result = [];
        for(let n=0; n < this.declarations.length; n++) {
            let classDeclaration = this.declarations[n];
            if(classDeclaration instanceof type && (includeSystemType || !classDeclaration.isSystemType())) {
                result.push(classDeclaration);
            }
        }
        return result;
    }

    /**
     * Get all declarations in this ModelFile
     * @return {ClassDeclaration[]} the ClassDeclarations defined in the model file
     */
    getAllDeclarations() {
        return this.declarations;
    }

    /**
     * Get the definitions for this model.
     * @return {string} The definitions for this model.
     */
    getDefinitions() {
        return this.definitions;
    }

    /**
     * Returns true if this ModelFile is a system model
     * @return {boolean} true of this ModelFile is a system model
     */
    isSystemModelFile() {
        return this.systemModelFile;
    }
}

module.exports = ModelFile;
