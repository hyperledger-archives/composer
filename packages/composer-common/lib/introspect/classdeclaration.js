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

const Field = require('./field');
const EnumValueDeclaration = require('./enumvaluedeclaration');
const RelationshipDeclaration = require('./relationshipdeclaration');
const IllegalModelException = require('./illegalmodelexception');
const Globalize = require('../globalize');
const Introspector = require('./introspector');
const ModelUtil = require('../modelutil');

/**
 * ClassDeclaration defines the structure (model/schema) of composite data.
 * It is composed of a set of Properties, may have an identifying field, and may
 * have a super-type.
 * A ClassDeclaration is conceptually owned by a ModelFile which
 * defines all the classes that are part of a namespace.
 *
 * @private
 * @abstract
 * @class
 * @memberof module:composer-common
 */
class ClassDeclaration {

    /**
     * Create a ClassDeclaration from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {ModelFile} modelFile - the ModelFile for this class
     * @param {string} ast - the AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(modelFile, ast) {
        if(!modelFile || !ast) {
            throw new IllegalModelException(Globalize.formatMessage('classdeclaration-constructor-modelastreq'));
        }

        this.ast = ast;
        this.modelFile = modelFile;
        this.process();
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
     * Returns the ModelFile that defines this class.
     *
     * @return {ModelFile} the owning ModelFile
     */
    getModelFile() {
        return this.modelFile;
    }

    /**
     * Process the AST and build the model
     *
     * @throws {IllegalModelException}
     * @private
     */
    process() {
        this.name = this.ast.id.name;
        this.properties = [];
        this.superType = null;
        this.idField = null;
        this.abstract = false;

        if(this.ast.abstract) {
            this.abstract = true;
        }

        if(this.ast.classExtension) {
            this.superType = this.ast.classExtension.class.name;
        }
        else {
            // if we are not a system type, then we should set the
            // super type to the system type for this class declaration
            if(!this.isSystemCoreType()) {
                this.superType = this.getSystemType();
            }
        }

        if(this.ast.idField) {
            this.idField = this.ast.idField.name;
        }

        for(let n=0; n < this.ast.body.declarations.length; n++ ) {
            let thing = this.ast.body.declarations[n];

            if(thing.type === 'FieldDeclaration') {
                this.properties.push( new Field(this, thing) );
            }
            else if(thing.type === 'RelationshipDeclaration') {
                this.properties.push( new RelationshipDeclaration(this, thing) );
            }
            else if(thing.type === 'EnumPropertyDeclaration') {
                this.properties.push( new EnumValueDeclaration(this, thing) );
            }
            else {
                let formatter = Globalize.messageFormatter('classdeclaration-process-unrecmodelelem');
                throw new IllegalModelException(formatter({
                    'type': thing.type
                }), this.modelFile, this.ast.location);
            }
        }
    }

    /**
     * Semantic validation of the structure of this class. Subclasses should
     * override this method to impose additional semantic constraints on the
     * contents/relations of fields.
     *
     * @throws {IllegalModelException}
     * @private
     */
    validate() {

        const declarations = this.getModelFile().getAllDeclarations();
        for(let n=0; n < declarations.length; n++) {
            let declaration = declarations[n];

            // check we don't have an asset with the same name
            for(let i=n+1; i < declarations.length; i++) {
                let otherDeclaration = declarations[i];
                if(declaration.getFullyQualifiedName() === otherDeclaration.getFullyQualifiedName()) {
                    throw new IllegalModelException(`Duplicate class name ${declaration.getName()}`);
                }
            }
        }

        // TODO (LG) check that all imported classes exist, rather than just
        // used imports

        // if we have a super type make sure it exists
        if(this.superType!==null) {
            let classDecl = null;
            if(this.getModelFile().isImportedType(this.superType)) {
                let fqnSuper = this.getModelFile().resolveImport(this.superType);
                classDecl = this.modelFile.getModelManager().getType(fqnSuper);
            }
            else {
                classDecl = this.getModelFile().getType(this.superType);
            }

            if(classDecl===null) {
                throw new IllegalModelException('Could not find super type ' + this.superType, this.modelFile, this.ast.location);
            }

            // Prevent extending declaration with different type of declaration
            const supertypeDeclaration = this.getModelFile().getType(this.superType);
            if (supertypeDeclaration) {
                if (this.constructor.name !== supertypeDeclaration.constructor.name) {
                    let typeName = this.getSystemType();
                    let superTypeName = supertypeDeclaration.getSystemType();
                    throw new IllegalModelException(`${typeName} (${this.getName()}) cannot extend ${superTypeName} (${supertypeDeclaration.getName()})`, this.modelFile, this.ast.location);
                }
            }
        }

        if(this.idField) {
            const field = this.getProperty(this.idField);
            if(!field) {
                let formatter = Globalize('en').messageFormatter('classdeclaration-validate-identifiernotproperty');
                throw new IllegalModelException(formatter({
                    'class': this.name,
                    'idField': this.idField
                }), this.modelFile, this.ast.location);
            }
            else {
                // check that identifiers are strings
                if(field.getType() !== 'String') {
                    let formatter = Globalize('en').messageFormatter('classdeclaration-validate-identifiernotstring');
                    throw new IllegalModelException( formatter({
                        'class': this.name,
                        'idField': this.idField
                    }),this.modelFile, this.ast.location);
                }

                if(field.isOptional()) {
                    throw new IllegalModelException('Identifying fields cannot be optional.',this.modelFile, this.ast.location);
                }
            }
        }
        else {
            if( this.isAbstract() === false && this.isEnum() === false && this.isConcept() === false) {
                if( this.getIdentifierFieldName() === null) {
                    let formatter = Globalize('en').messageFormatter('classdeclaration-validate-missingidentifier');
                    throw new IllegalModelException( formatter({
                        'class': this.name
                    }),this.modelFile, this.ast.location);
                }
            }
        }

        // we also have to check fields defined in super classes
        const properties = this.getProperties();
        for(let n=0; n < properties.length; n++) {
            let field = properties[n];

            // check we don't have a field with the same name
            for(let i=n+1; i < properties.length; i++) {
                let otherField = properties[i];
                if(field.getName() === otherField.getName()) {
                    let formatter = Globalize('en').messageFormatter('classdeclaration-validate-duplicatefieldname');
                    throw new IllegalModelException( formatter({
                        'class': this.name,
                        'fieldName': field.getName()
                    }),this.modelFile, this.ast.location);
                }
            }

            // we now validate the field, however to ensure that
            // imports are resolved correctly we validate in the context
            // of the declared type of the field for non-primitives in a different namespace
            if(field.isPrimitive() || this.isEnum() || field.getNamespace() === this.getNamespace() ) {
                field.validate(this);
            }
            else {
                const typeFqn = field.getFullyQualifiedTypeName();
                const classDecl = this.modelFile.getModelManager().getType(typeFqn);
                field.validate(classDecl);
            }
        }
    }

    /**
     * Returns the base system type for this type of class declaration. Override
     * this method in derived classes to specify a base system type.
     *
     * @return {string} the short name of the base system type or null
     */
    getSystemType() {
        return null;
    }

    /**
     * Returns true if this class is declared as abstract in the model file
     *
     * @return {boolean} true if the class is abstract
     */
    isAbstract() {
        return this.abstract;
    }

    /**
     * Returns true if this class is an enumeration.
     *
     * @return {boolean} true if the class is an enumerated type
     */
    isEnum() {
        return false;
    }

    /**
     * Returns true if this class is the definition of a concept.
     *
     * @return {boolean} true if the class is a concept
     */
    isConcept() {
        return false;
    }

     /**
     * Returns true if this class is the definition of an event.
     *
     * @return {boolean} true if the class is an event
     */
    isEvent() {
        return false;
    }

    /**
     * Returns true if this class can be pointed to by a relationship
     *
     * @return {boolean} true if the class may be pointed to by a relationship
     */
    isRelationshipTarget() {
        return false;
    }

     /**
      * Returns true if this class can be pointed to by a relationship in a
      * system model
      *
      * @return {boolean} true if the class may be pointed to by a relationship
      */
    isSystemRelationshipTarget() {
        return this.isRelationshipTarget();
    }

    /**
     * Returns true is this type is in the system namespace
     *
     * @return {boolean} true if the class may be pointed to by a relationship
     */
    isSystemType() {
        return ModelUtil.getSystemNamespace() === this.getNamespace();
    }

    /**
     * Returns true if this class is a system core type - both in the system
     * namespace, and also one of the system core types (Asset, Participant, etc).
     *
     * @return {boolean} true if the class may be pointed to by a relationship
     */
    isSystemCoreType() {
        return this.isSystemType() &&
            this.getSystemType() === this.getName();
    }

    /**
     * Returns the short name of a class. This name does not include the
     * namespace from the owning ModelFile.
     *
     * @return {string} the short name of this class
     */
    getName() {
        return this.name;
    }

    /**
     * Return the namespace of this class.
     * @return {String} namespace - a namespace.
     */
    getNamespace() {
        return this.modelFile.getNamespace();
    }

    /**
     * Returns the fully qualified name of this class.
     * The name will include the namespace if present.
     *
     * @return {string} the fully-qualified name of this class
     */
    getFullyQualifiedName() {
        return this.getNamespace() + '.' + this.name;
    }

    /**
     * Returns the name of the identifying field for this class. Note
     * that the identifying field may come from a super type.
     *
     * @return {string} the name of the id field for this class
     */
    getIdentifierFieldName() {

        if(this.idField) {
            return this.idField;
        }
        else {
            if(this.getSuperType()) {
                // we first check our own modelfile, as we may be called from validate
                // in which case our model file has not yet been added to the model modelManager
                let classDecl = this.getModelFile().getLocalType(this.getSuperType());

                // not a local type, so we try the model manager
                if(!classDecl) {
                    classDecl = this.modelFile.getModelManager().getType(this.getSuperType());
                }
                return classDecl.getIdentifierFieldName();
            }
            else {
                return null;
            }
        }
    }

    /**
     * Returns the field with a given name or null if it does not exist.
     * The field must be directly owned by this class -- the super-type is
     * not introspected.
     *
     * @param {string} name the name of the field
     * @return {Property} the field definition or null if it does not exist.
     */
    getOwnProperty(name) {
        for(let n=0; n < this.properties.length; n++) {
            const field = this.properties[n];
            if(field.getName() === name) {
                return field;
            }
        }

        return null;
    }

    /**
     * Returns the fields directly defined by this class.
     *
     * @return {Property[]} the array of fields
     */
    getOwnProperties() {
        return this.properties;
    }

    /**
     * Returns the FQN of the super type for this class or null if this
     * class does not have a super type.
     *
     * @return {string} the FQN name of the super type or null
     */
    getSuperType() {
        const superTypeDeclaration = this.getSuperTypeDeclaration();
        if (superTypeDeclaration) {
            return superTypeDeclaration.getFullyQualifiedName();
        } else {
            return null;
        }
    }

    /**
     * Get the super type class declaration for this class.
     * @return {ClassDeclaration} the super type declaration, or null if there is no super type.
     */
    getSuperTypeDeclaration() {
        if (!this.superType) {
            return null;
        }

        const supertypeDeclaration = this.getModelFile().getType(this.superType);
        if (!supertypeDeclaration) {
            throw new Error('Could not find super type: ' + this.superType);
        }

        return supertypeDeclaration;
    }

    /**
     * Get the class declarations for all subclasses of this class, including this class.
     * @return {ClassDeclaration[]} subclass declarations.
     */
    getAssignableClassDeclarations() {
        const results = new Set();
        const modelManager = this.getModelFile().getModelManager();
        const introspector = new Introspector(modelManager);
        const allClassDeclarations = introspector.getClassDeclarations();
        const subclassMap = new Map();

        // Build map of all direct subclasses relationships
        allClassDeclarations.forEach((declaration) => {
            const superType = declaration.getSuperType();
            if (superType) {
                const subclasses = subclassMap.get(superType) || new Set();
                subclasses.add(declaration);
                subclassMap.set(superType, subclasses);
            }
        });

        // Recursive function to collect all direct and indirect subclasses of a given (set) of base classes.
        const collectSubclasses = (superclasses) => {
            superclasses.forEach((declaration) => {
                results.add(declaration);
                const superType = declaration.getFullyQualifiedName();
                const subclasses = subclassMap.get(superType);
                if (subclasses) {
                    collectSubclasses(subclasses);
                }
            });
        };

        collectSubclasses([this]);

        return Array.from(results);
    }

    /**
     * Get all the super-type declarations for this type.
     * @return {ClassDeclaration[]} super-type declarations.
     */
    getAllSuperTypeDeclarations() {
        const results = [];
        for (let type = this; (type = type.getSuperTypeDeclaration()); ) {
            results.push(type);
        }

        return results;
    }

    /**
     * Returns the property with a given name or null if it does not exist.
     * Fields defined in super-types are also introspected.
     *
     * @param {string} name the name of the field
     * @return {Property} the field, or null if it does not exist
     */
    getProperty(name) {
        let result = this.getOwnProperty(name);
        let classDecl = null;

        if(result === null && this.superType!==null) {
            if(this.getModelFile().isImportedType(this.superType)) {
                let fqnSuper = this.getModelFile().resolveImport(this.superType);
                classDecl = this.modelFile.getModelManager().getType(fqnSuper);
            }
            else {
                classDecl = this.getModelFile().getType(this.superType);
            }
            result = classDecl.getProperty(name);
        }

        return result;
    }

    /**
     * Returns the properties defined in this class and all super classes.
     *
     * @return {Property[]} the array of fields
     */
    getProperties() {
        let result = this.getOwnProperties();
        let classDecl = null;
        if(this.superType!==null) {
            if(this.getModelFile().isImportedType(this.superType)) {
                let fqnSuper = this.getModelFile().resolveImport(this.superType);
                classDecl = this.modelFile.getModelManager().getType(fqnSuper);
            }
            else {
                classDecl = this.getModelFile().getType(this.superType);
            }

            if(classDecl===null) {
                throw new IllegalModelException('Could not find super type ' + this.superType,this.modelFile, this.ast.location);
            }

            // go get the fields from the super type
            result = result.concat(classDecl.getProperties());
        }
        else {
            // console.log('No super type for ' + this.getName() );
        }

        return result;
    }

    /**
     * Get a nested property using a dotted property path
     * @param {string} propertyPath The property name or name with nested structure e.g a.b.c
     * @returns {Property} the property
     * @throws {IllegalModelException} if the property path is invalid or the property does not exist
     */
    getNestedProperty(propertyPath) {

        const propertyNames = propertyPath.split('.');
        let classDeclaration = this;
        let result = null;

        for (let n = 0; n < propertyNames.length; n++) {

            // get the nth property
            result = classDeclaration.getProperty(propertyNames[n]);

            if (result === null) {
                throw new IllegalModelException('Property ' + propertyNames[n] + ' does not exist on ' + classDeclaration.getFullyQualifiedName(), this.modelFile, this.ast.location);
            }
            // not the last element, get the class of the element
            else if( n < propertyNames.length-1) {
                if(result.isPrimitive() || result.isTypeEnum()) {
                    throw new Error('Property ' + propertyNames[n] + ' is a primitive or enum. Invalid property path: ' + propertyPath );
                }
                else {
                    // get the nested type, this throws if the type is missing or if the type is an enum
                    classDeclaration = classDeclaration.getModelFile().getModelManager().getType(result.getFullyQualifiedTypeName());
                }
            }
        }

        return result;
    }

    /**
     * Returns the string representation of this class
     * @return {String} the string representation of the class
     */
    toString() {
        let superType = '';
        if(this.superType) {
            superType = ' super=' + this.superType;
        }
        return 'ClassDeclaration {id=' + this.getFullyQualifiedName() + superType + ' enum=' + this.isEnum() + ' abstract=' + this.isAbstract() + '}';
    }

}

module.exports = ClassDeclaration;
