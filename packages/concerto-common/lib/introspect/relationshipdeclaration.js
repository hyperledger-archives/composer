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

const Property = require('./property');
const IllegalModelException = require('./illegalmodelexception');
const ModelUtil = require('../modelutil');

/**
 * Class representing a relationship between model elements
 * @extends Property
 * @see See [Property]{@link module:ibm-concerto-common.Property}
 * @private
 * @class
 * @memberof module:ibm-concerto-common
 */
class RelationshipDeclaration extends Property {

    /**
     * Create a Relationship.
     * @param {ClassDeclaration} parent - The owner of this property
     * @param {Object} ast - The AST created by the parser
     * @throws {InvalidModelException}
     */
    constructor(parent, ast) {
        super(parent, ast);
    }

    /**
     * Validate the property
     * @param {ClassDeclaration} classDecl the class declaration of the property
     * @throws {InvalidModelException}
     * @private
     */
    validate(classDecl) {
        super.validate(classDecl);
        // relationship cannot point to primitive types
        if(!this.getType()) {
            throw new IllegalModelException('Relationship must have a type');
        }

        let classDeclaration = null;

        // you can't have a relationship with a primitive...
        if(ModelUtil.isPrimitiveType(this.getType())) {
            throw new IllegalModelException('Relationship ' + this.getName() + ' cannot be to the primitive type ' + this.getType() );
        }
        else {
            // we first try to get the type from our own model file
            // because during validate we have not yet been added to the model manager
            if(this.getParent().getModelFile().getNamespace() === ModelUtil.getNamespace(this.getFullyQualifiedTypeName())) {
                classDeclaration = this.getParent().getModelFile().getType(this.getType());
            }
            else {
              // otherwise we have to use the modelmanager to try to load
                classDeclaration = this.getParent().getModelFile().getModelManager().getType(this.getFullyQualifiedTypeName());
            }

            if(classDeclaration === null) {
                throw new IllegalModelException('Relationship ' + this.getName() + ' points to a missing type ' + this.getFullyQualifiedTypeName());
            }

            if(classDeclaration.isRelationshipTarget() === false) {
                throw new IllegalModelException('Relationship ' + this.getName() + ' must be to an asset or participant, but is to ' + this.getFullyQualifiedTypeName());
            }
        }
    }

    /**
     * Returns a string representation of this property§
     * @return {String} the string version of the property.
     */
    toString() {
        return 'RelationshipDeclaration {name=' + this.name + ', type=' + this.getFullyQualifiedTypeName() + ', array=' + this.array + ', optional=' + this.optional +'}';
    }}

module.exports = RelationshipDeclaration;
