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
const EnumDeclaration = require('../introspect/enumdeclaration');
const Field = require('../introspect/field');
const leftPad = require('left-pad');
const ModelUtil = require('../modelutil');
const RelationshipDeclaration = require('../introspect/relationshipdeclaration');
const randomWords = require('random-words');
const Util = require('../util');

/**
 * Generate sample instance data for the specified class declaration
 * and resource instance. The specified resource instance will be
 * updated with either default values or generated sample data.
 * @private
 * @class
 * @memberof module:composer-common
 */
class InstanceGenerator {

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
        const obj = parameters.stack.pop();
        const properties = classDeclaration.getProperties();
        for(let n=0; n < properties.length; n++) {
            const property = properties[n];
            const value = obj[property.getName()];
            if(Util.isNull(value)) {
                obj[property.getName()] = property.accept(this,parameters);
            }
        }
        return obj;
    }

    /**
     * Visitor design pattern
     * @param {Field} field - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitField(field, parameters) {
        if (field.isArray()) {
            let result = [];
            for (let i = 0; i < 3; i++) {
                result.push(this.getSampleValue(field, parameters));
            }
            return result;
        } else {
            return this.getSampleValue(field, parameters);
        }
    }

    /**
     * Get a sample value for the specified field.
     * @param {Field} field - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {*} A sample value for the specified field.
     */
    getSampleValue(field, parameters) {
        let type = field.getFullyQualifiedTypeName();
        if (ModelUtil.isPrimitiveType(type)) {
            switch(type) {
            case 'DateTime':
                return new Date(Math.random() * Date.now());
            case 'Integer':
                return Math.round(Math.random() * Math.pow(2, 16));
            case 'Long':
                return Math.round(Math.random() * Math.pow(2, 32));
            case 'Double':
                return Number((Math.random() * Math.pow(2, 8)).toFixed(3));
            case 'Boolean':
                return Math.round(Math.random()) === 1;
            default:
                return randomWords({min: 1, max: 5}).join(' ');
            }
        }
        let classDeclaration = parameters.modelManager.getType(type);
        if (classDeclaration instanceof EnumDeclaration) {
            let enumValues = classDeclaration.getOwnProperties();
            return enumValues[Math.floor(Math.random() * enumValues.length)].getName();
        } else {
            let identifierFieldName = classDeclaration.getIdentifierFieldName();
            let idx = Math.round(Math.random() * 9999).toString();
            idx = leftPad(idx, 4, '0');
            let id = `${identifierFieldName}:${idx}`;
            let resource = parameters.factory.newResource(classDeclaration.getModelFile().getNamespace(), classDeclaration.getName(), id);
            parameters.stack.push(resource);
            return classDeclaration.accept(this, parameters);
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
        let classDeclaration = parameters.modelManager.getType(relationshipDeclaration.getFullyQualifiedTypeName());
        let identifierFieldName = classDeclaration.getIdentifierFieldName();
        let factory = parameters.factory;
        if (relationshipDeclaration.isArray()) {
            let result = [];
            for (let i = 0; i < 3; i++) {
                let idx = Math.round(Math.random() * 9999).toString();
                idx = leftPad(idx, 4, '0');
                let id = `${identifierFieldName}:${idx}`;
                let relationship = factory.newRelationship(classDeclaration.getModelFile().getNamespace(), classDeclaration.getName(), id);
                result.push(relationship);
            }
            return result;
        } else {
            let idx = Math.round(Math.random() * 9999).toString();
            idx = leftPad(idx, 4, '0');
            let id = `${identifierFieldName}:${idx}`;
            let relationship = factory.newRelationship(classDeclaration.getModelFile().getNamespace(), classDeclaration.getName(), id);
            return relationship;
        }
    }

}

module.exports = InstanceGenerator;
