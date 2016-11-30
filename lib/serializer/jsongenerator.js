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

const ClassDeclaration = require('../introspect/classdeclaration');
const Field = require('../introspect/field');
const RelationshipDeclaration = require('../introspect/relationshipdeclaration');
const Resource = require('../model/resource');
const Relationship = require('../model/relationship');
const ModelUtil = require('../modelutil');
const Util = require('../util');

/**
 * Converts the contents of a Resource to JSON. The parameters
 * object should contain the keys
 * 'writer' - the JSONWriter instance to use to accumulate the JSON text.
 * 'stack' - the TypedStack of objects being processed. It should
 * start with a Resource.
 * 'modelManager' - the ModelManager to use.
 * @private
 */
class JSONGenerator {

    /**
     * Constructor.
     * @param {boolean} [convertResourcesToRelationships] Convert resources that
     * are specified for relationship fields into relationships, false by default.
     * @param {boolean} [permitResourcesForRelationships] Permit resources in the
     * place of relationships (serializing them as resources), false by default.
     */
    constructor(convertResourcesToRelationships, permitResourcesForRelationships) {
        this.convertResourcesToRelationships = convertResourcesToRelationships;
        this.permitResourcesForRelationships = permitResourcesForRelationships;
    }

    /**
     * Visitor design pattern
     * @param {Object} thing - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visit(thing, parameters) {
        if (thing instanceof ClassDeclaration) {
            return this.visitClassDeclaration(thing, parameters);
        } else if (thing instanceof RelationshipDeclaration) {
            return this.visitRelationshipDeclaration(thing, parameters);
        } else if (thing instanceof Field) {
            return this.visitField(thing, parameters);
        } else {
            throw new Error('Unrecognised ' + JSON.stringify(thing) );
        }
    }

    /**
     * Visitor design pattern
     * @param {ClassDeclaration} classDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitClassDeclaration(classDeclaration, parameters) {
        parameters.writer.openObject();
        parameters.writer.writeKeyStringValue('$class', classDeclaration.getFullyQualifiedName());

        const obj = parameters.stack.pop(Resource);
        const properties = classDeclaration.getProperties();
        for(let n=0; n < properties.length; n++) {
            const property = properties[n];
            const value = obj[property.getName()];
            if(!Util.isNull(value)) {
                parameters.stack.push(value);
                property.accept(this,parameters);
            }
        }

        parameters.writer.closeObject();
        return null;
    }

    /**
     * Visitor design pattern
     * @param {Field} field - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitField(field, parameters) {
        const obj = parameters.stack.pop();
        parameters.writer.writeKey(field.getName());

        if(field.isArray()) {
            parameters.writer.openArray();
            for(let n=0; n < obj.length; n++) {
                const item = obj[n];
                if(!field.isPrimitive() && !ModelUtil.isEnum(field)) {
                    parameters.writer.writeComma();
                    parameters.stack.push(item, Resource);
                    const classDecl = parameters.modelManager.getType(item.getFullyQualifiedType());
                    classDecl.accept(this, parameters);
                }
                else {
                    parameters.writer.writeArrayValue(this.convertToJSON(field,item));
                }
            }
            parameters.writer.closeArray();
        }
        else if(field.isPrimitive() || ModelUtil.isEnum(field)) {
            parameters.writer.writeValue(this.convertToJSON(field,obj));
        }
        else {
            parameters.stack.push(obj);
            const classDeclaration = parameters.modelManager.getType(field.getFullyQualifiedTypeName());
            classDeclaration.accept(this, parameters);
        }

        return null;
    }

    /**
     * Converts a primtive object to JSON text.
     *
     * @param {Field} field - the field declaration of the object
     * @param {Object} obj - the object to convert to text
     * @return {string} the text representation
     */
    convertToJSON(field, obj) {
        switch(field.getType()) {
        case 'DateTime': {
            return `"${obj.toISOString()}"`;
        }
        case 'Integer':
        case 'Long':
        case 'Double':
        case 'Boolean':{
            return `${obj.toString()}`;
        }
        default: {
            return `"${obj.toString()}"`;
        }
        }
    }

    /**
     * Visitor design pattern
     * @param {RelationshipDeclaration} relationshipDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitRelationshipDeclaration(relationshipDeclaration, parameters) {
        const obj = parameters.stack.pop();
        parameters.writer.writeKey(relationshipDeclaration.getName());

        if(relationshipDeclaration.isArray()) {
            parameters.writer.openArray();
            for(let n=0; n < obj.length; n++) {
                const item = obj[n];
                if (this.permitResourcesForRelationships && item instanceof Resource) {
                    parameters.writer.writeComma();
                    parameters.stack.push(item, Resource);
                    const classDecl = parameters.modelManager.getType(relationshipDeclaration.getFullyQualifiedTypeName());
                    classDecl.accept(this, parameters);
                } else {
                    let relationshipText = this.getRelationshipText(relationshipDeclaration, item );
                    parameters.writer.writeArrayStringValue(relationshipText);
                }
            }
            parameters.writer.closeArray();
        }
        else if (this.permitResourcesForRelationships && obj instanceof Resource) {
            parameters.stack.push(obj, Resource);
            const classDecl = parameters.modelManager.getType(relationshipDeclaration.getFullyQualifiedTypeName());
            classDecl.accept(this, parameters);
        } else {
            let relationshipText = this.getRelationshipText(relationshipDeclaration, obj );
            parameters.writer.writeStringValue(relationshipText);
        }
        return null;
    }

    /**
    *
    * Returns the persistent format for a relationship.
    * @param {RelationshipDeclaration} relationshipDeclaration - the relationship being persisted
    * @param {Relationship} relationship - the text for the item
    * @returns {string} the text to use to persist the relationship
    */
    getRelationshipText(relationshipDeclaration, relationship) {
        let identifiable;
        if(relationship instanceof Relationship) {
            identifiable = relationship;
        } else {
            if (this.convertResourcesToRelationships && relationship instanceof Resource) {
                identifiable = relationship;
            } else {
                throw new Error('Did not find a relationship for ' + relationshipDeclaration.getFullyQualifiedTypeName() + ' found ' + relationship );
            }
        }
        let relationshipText = identifiable.getIdentifier();
        if(relationshipDeclaration.getNamespace() !==  identifiable.getNamespace() ) {
            relationshipText = identifiable.getFullyQualifiedIdentifier();
        }

        return relationshipText;
    }
}

module.exports = JSONGenerator;
