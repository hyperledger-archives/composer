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

const ModelUtil = require('../modelutil');

/**
 * Property representing an attribute of a class declaration,
 * either a Field or a Relationship.
 * @private
 * @class
 * @memberof module:ibm-concerto-common
 */
class Property {

    /**
     * Create a Property.
     * @param {ClassDeclaration} parent - the owner of this property
     * @param {Object} ast - The AST created by the parser
     * @throws {InvalidModelException}
     */
    constructor(parent, ast) {
        this.ast = ast;
        this.parent = parent;
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
     * Returns the owner of this property
     * @return {ClassDeclaration} the parent class declaration
     */
    getParent() {
        return this.parent;
    }

     /**
     * Process the AST and build the model
     * @throws {InvalidModelException}
     * @private
     */
    process() {
        this.name = this.ast.id.name;

        if(!this.name) {
            throw new Error('No name for type ' + this.ast );
        }

        if(this.ast.propertyType) {
            this.type = this.ast.propertyType.name;
        }
        else {
            this.type = null;
        }
        this.array = false;

        if(this.ast.array) {
            this.array = true;
        }

        if(this.ast.optional) {
            this.optional = true;
        }
        else {
            this.optional = false;
        }
    }

    /**
     * Validate the property
     * @param {ClassDeclaration} classDecl the class declaration of the property
     * @throws {InvalidModelException}
     * @private
     */
    validate(classDecl) {
        if(this.type) {
            classDecl.getModelFile().resolveType('Property type ' + this.name, this.type);
        }
    }


    /**
     * Returns the name of a property
     * @return {string} the name of this field
     */
    getName() {
        return this.name;
    }

    /**
     * Returns the type of a property
     * @return {string} the type of this field
     */
    getType() {
        return this.type;
    }

    /**
     * Returns true if the field is optional
     * @return {boolean} true if the field is optional
     */
    isOptional() {
        return this.optional;
    }

    /**
     * Returns the fully qualified type name of a property
     * @return {string} the fully qualified type of this property
     */
    getFullyQualifiedTypeName() {
        if(this.isPrimitive()) {
            return this.type;
        }

        const parent = this.getParent();
        if(!parent) {
            throw new Error('Property ' + this.name + ' does not have a parent.');
        }
        const modelFile = parent.getModelFile();
        if(!modelFile) {
            throw new Error('Parent of property ' + this.name + ' does not have a ModelFile!');
        }

        const result = modelFile.getFullyQualifiedTypeName(this.type);
        if(!result) {
            throw new Error('Failed to find fully qualified type name for property ' + this.name + ' with type ' + this.type );
        }

        return result;
    }


    /**
     * Returns the namespace of the parent of this property
     * @return {string} the namespace of the parent of this property
     */
    getNamespace() {
        return this.getParent().getModelFile().getNamespace();
    }

    /**
     * Returns true if the field is declared as an array type
     * @return {boolean} true if the property is an array type
     */
    isArray() {
        return this.array;
    }


    /**
     * Returns true if the field is declared as an enumerated value
     * @return {boolean} true if the property is an enumerated value
     */
    isTypeEnum() {
        if(this.isPrimitive()) {
            return false;
        }
        else {
            const type = this.getParent().getModelFile().getType(this.getType());
            return type.isEnum();
        }
    }

    /**
     *  Returns true if this property is a primitive type.
     *@return {boolean} true if the property is a primitive type.
     */
    isPrimitive() {
        return ModelUtil.isPrimitiveType(this.getType());
    }

    /**
     * Returns a new object representing this function declaration that is
     * suitable for serializing as JSON.
     * @return {Object} A new object suitable for serializing as JSON.
     */
    toJSON() {
        return {
            name: this.name,
            type: this.type,
            array: this.array,
            'enum': (this.type === null)
        };
    }

}

module.exports = Property;
