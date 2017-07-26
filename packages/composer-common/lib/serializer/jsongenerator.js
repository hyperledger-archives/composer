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

const ClassDeclaration = require('../introspect/classdeclaration');
const Field = require('../introspect/field');
const RelationshipDeclaration = require('../introspect/relationshipdeclaration');
const Resource = require('../model/resource');
const Identifiable = require('../model/identifiable');
const Typed = require('../model/typed');
const Concept = require('../model/concept');
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
 * @class
 * @memberof module:composer-common
 */
class JSONGenerator {

    /**
     * Constructor.
     * @param {boolean} [convertResourcesToRelationships] Convert resources that
     * are specified for relationship fields into relationships, false by default.
     * @param {boolean} [permitResourcesForRelationships] Permit resources in the
     * place of relationships (serializing them as resources), false by default.
     * @param {boolean} [deduplicateResources] If resources appear several times
     * in the object graph only the first instance is serialized, with only the $id
     * written for subsequent instances, false by default.
     */
    constructor(convertResourcesToRelationships, permitResourcesForRelationships, deduplicateResources) {
        this.convertResourcesToRelationships = convertResourcesToRelationships;
        this.permitResourcesForRelationships = permitResourcesForRelationships;
        this.deduplicateResources = deduplicateResources;
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
            throw new Error('Unrecognised ' + JSON.stringify(thing));
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

        const obj = parameters.stack.pop();
        if (!((obj instanceof Resource) || (obj instanceof Concept))) {
            throw new Error('Expected a Resource or a Concept, but found ' + obj);
        }

        let writeFields = true;
        let id = null;

        if (obj instanceof Identifiable && this.deduplicateResources) {
            id = obj.toURI();
            if( parameters.dedupeResources.has(id)) {
                writeFields = false;
                parameters.writer.writeStringValue( id );
            }
            else {
                parameters.dedupeResources.add(id);
            }
        }

        if (writeFields) {
            parameters.writer.openObject();
            parameters.writer.writeKeyStringValue('$class', classDeclaration.getFullyQualifiedName());

            if(this.deduplicateResources && id) {
                parameters.writer.writeKeyStringValue('$id', id );
            }

            const properties = classDeclaration.getProperties();
            for (let n = 0; n < properties.length; n++) {
                const property = properties[n];
                const value = obj[property.getName()];
                if (!Util.isNull(value)) {
                    parameters.stack.push(value);
                    property.accept(this, parameters);
                }
            }

            parameters.writer.closeObject();
        }

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
        if (field.isArray()) {
            parameters.writer.openArray();
            for (let n = 0; n < obj.length; n++) {
                const item = obj[n];
                if (!field.isPrimitive() && !ModelUtil.isEnum(field)) {
                    parameters.writer.writeComma();
                    parameters.stack.push(item, Typed);
                    const classDecl = parameters.modelManager.getType(item.getFullyQualifiedType());
                    classDecl.accept(this, parameters);
                } else {
                    parameters.writer.writeArrayValue(this.convertToJSON(field, item));
                }
            }
            parameters.writer.closeArray();
        } else if (field.isPrimitive() || ModelUtil.isEnum(field)) {
            parameters.writer.writeValue(this.convertToJSON(field, obj));
        } else {
            parameters.stack.push(obj);
            const classDeclaration = parameters.modelManager.getType(obj.getFullyQualifiedType());
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
        switch (field.getType()) {
        case 'DateTime':
            {
                return `"${obj.toISOString()}"`;
            }
        case 'Integer':
        case 'Long':
        case 'Double':
        case 'Boolean':
            {
                return `${obj.toString()}`;
            }
        default:
            {
                return JSON.stringify(obj.toString());
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

        if (relationshipDeclaration.isArray()) {
            parameters.writer.openArray();
            for (let n = 0; n < obj.length; n++) {
                const item = obj[n];
                if (this.permitResourcesForRelationships && item instanceof Resource) {
                    let fqi = item.getFullyQualifiedIdentifier();
                    if (parameters.seenResources.has(fqi)) {
                        let relationshipText = this.getRelationshipText(relationshipDeclaration, item);
                        parameters.writer.writeStringValue(relationshipText);
                    } else {
                        parameters.seenResources.add(fqi);
                        parameters.writer.writeComma();
                        parameters.stack.push(item, Resource);
                        const classDecl = parameters.modelManager.getType(relationshipDeclaration.getFullyQualifiedTypeName());
                        classDecl.accept(this, parameters);
                        parameters.seenResources.delete(fqi);
                    }
                } else {
                    let relationshipText = this.getRelationshipText(relationshipDeclaration, item);
                    parameters.writer.writeArrayStringValue(relationshipText);
                }
            }
            parameters.writer.closeArray();
        } else if (this.permitResourcesForRelationships && obj instanceof Resource) {
            let fqi = obj.getFullyQualifiedIdentifier();
            if (parameters.seenResources.has(fqi)) {
                let relationshipText = this.getRelationshipText(relationshipDeclaration, obj);
                parameters.writer.writeStringValue(relationshipText);
            } else {
                parameters.seenResources.add(fqi);
                parameters.stack.push(obj, Resource);
                const classDecl = parameters.modelManager.getType(relationshipDeclaration.getFullyQualifiedTypeName());
                classDecl.accept(this, parameters);
                parameters.seenResources.delete(fqi);
            }
        } else {
            let relationshipText = this.getRelationshipText(relationshipDeclaration, obj);
            parameters.writer.writeStringValue(relationshipText);
        }
        return null;
    }

    /**
     * Returns the persistent format for a relationship.
     * @param {RelationshipDeclaration} relationshipDeclaration - the relationship being persisted
     * @param {Identifiable} relationshipOrResource - the relationship or the resource
     * @returns {string} the text to use to persist the relationship
     */
    getRelationshipText(relationshipDeclaration, relationshipOrResource) {
        if (relationshipOrResource instanceof Resource) {
            const allowRelationships =
                this.convertResourcesToRelationships || this.permitResourcesForRelationships;
            if (!allowRelationships) {
                throw new Error('Did not find a relationship for ' + relationshipDeclaration.getFullyQualifiedTypeName() + ' found ' + relationshipOrResource);
            }
        }
        return relationshipOrResource.toURI();
    }
}

module.exports = JSONGenerator;
