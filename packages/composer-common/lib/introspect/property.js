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

const Decorated = require('./decorated');
const ModelUtil = require('../modelutil');

/**
 * Property representing an attribute of a class declaration,
 * either a Field or a Relationship.
 *
 * @class
 * @memberof module:composer-common
 */
class Property extends Decorated {

    /**
     * Create a Property.
     * @param {ClassDeclaration} parent - the owner of this property
     * @param {Object} ast - The AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(parent, ast) {
        super(parent.getModelFile(), ast);
        this.parent = parent;
        this.process();
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
     * @throws {IllegalModelException}
     * @private
     */
    process() {
        super.process();

        this.name = this.ast.id.name;
        this.decorator = null;

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
     * @throws {IllegalModelException}
     * @private
     */
    validate(classDecl) {
        super.validate();

        if(this.type) {
            classDecl.getModelFile().resolveType( 'property ' + this.getFullyQualifiedName(), this.type);
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
     * Returns the fully name of a property (ns + class name + property name)
     * @return {string} the fully qualified name of this property
     */
    getFullyQualifiedName() {
        return this.getParent().getFullyQualifiedName() + '.' + this.getName();
    }

    /**
     * Returns the namespace of the parent of this property
     * @return {string} the namespace of the parent of this property
     */
    getNamespace() {
        return this.getParent().getNamespace();
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

}

module.exports = Property;
