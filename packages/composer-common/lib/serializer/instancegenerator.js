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
const padStart = require('lodash.padstart');
const ModelUtil = require('../modelutil');
const RelationshipDeclaration = require('../introspect/relationshipdeclaration');
const Util = require('../util');
const Globalize = require('../globalize');

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
        for (const property of properties) {
            if (!parameters.includeOptionalFields && property.isOptional()) {
                continue;
            }
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
        if(!field.isPrimitive()){
            let type = field.getFullyQualifiedTypeName();
            let classDeclaration = parameters.modelManager.getType(type);
            classDeclaration = this.findConcreteSubclass(classDeclaration);
            let fqn = classDeclaration.getFullyQualifiedName();

            if (parameters.seen.includes(fqn)){
                if (field.isArray()) {
                    return [];
                }
                if (field.isOptional()) {
                    return null;
                }
                throw new Error('Model is recursive.');
            }
            parameters.seen.push(fqn);
        } else { parameters.seen.push('Primitve');
        }
        let result;
        if (field.isArray()) {
            const valueSupplier = () => this.getFieldValue(field, parameters);
            result =  parameters.valueGenerator.getArray(valueSupplier);
        } else {
            result = this.getFieldValue(field, parameters);
        }
        parameters.seen.pop();
        return result;
    }


    /**
     * Get a value for the specified field.
     * @param {Field} field - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {*} A value for the specified field.
     */
    getFieldValue(field, parameters) {
        let type = field.getFullyQualifiedTypeName();

        if (ModelUtil.isPrimitiveType(type)) {
            switch(type) {
            case 'DateTime':
                return parameters.valueGenerator.getDateTime();
            case 'Integer':
                return parameters.valueGenerator.getInteger();
            case 'Long':
                return parameters.valueGenerator.getLong();
            case 'Double':
                return parameters.valueGenerator.getDouble();
            case 'Boolean':
                return parameters.valueGenerator.getBoolean();
            default:
                return parameters.valueGenerator.getString();
            }
        }

        let classDeclaration = parameters.modelManager.getType(type);

        if (classDeclaration instanceof EnumDeclaration) {
            let enumValues = classDeclaration.getOwnProperties();
            return parameters.valueGenerator.getEnum(enumValues).getName();
        }

        classDeclaration = this.findConcreteSubclass(classDeclaration);

        if (classDeclaration.isConcept()) {
            let concept = parameters.factory.newConcept(classDeclaration.getNamespace(), classDeclaration.getName());
            parameters.stack.push(concept);
            return classDeclaration.accept(this, parameters);
        } else {
            const id = this.generateRandomId(classDeclaration);
            let resource = parameters.factory.newResource(classDeclaration.getNamespace(), classDeclaration.getName(), id);
            parameters.stack.push(resource);
            return classDeclaration.accept(this, parameters);
        }
    }

    /**
     * Find a concrete type that extends the provided type. If the supplied type argument is
     * not abstract then it will be returned.
     * TODO: work out whether this has to be a leaf node or whether the closest type can be used
     * It depends really since the closest type will satisfy the model but whether it satisfies
     * any transaction code which attempts to use the generated resource is another matter.
     * @param {ClassDeclaration} declaration the class declaration.
     * @return {ClassDeclaration} the closest extending concrete class definition.
     * @throws {Error} if no concrete subclasses exist.
     */
    findConcreteSubclass(declaration) {
        if (!declaration.isAbstract()) {
            return declaration;
        }

        const concreteSubclasses = declaration.getAssignableClassDeclarations()
            .filter(subclass => !subclass.isAbstract())
            .filter(subclass => !subclass.isSystemType());

        if (concreteSubclasses.length === 0) {
            const formatter = Globalize.messageFormatter('instancegenerator-newinstance-noconcreteclass');
            throw new Error(formatter({ type: declaration.getFullyQualifiedName() }));
        }

        return concreteSubclasses[0];
    }



    /**
     * Visitor design pattern
     * @param {RelationshipDeclaration} relationshipDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Relationship} the result of visiting
     * @private
     */
    visitRelationshipDeclaration(relationshipDeclaration, parameters) {
        let classDeclaration = parameters.modelManager.getType(relationshipDeclaration.getFullyQualifiedTypeName());
        classDeclaration = this.findConcreteSubclass(classDeclaration);
        const factory = parameters.factory;
        const valueSupplier = () => {
            const id = this.generateRandomId(classDeclaration);
            return factory.newRelationship(classDeclaration.getNamespace(), classDeclaration.getName(), id);
        };
        if (relationshipDeclaration.isArray()) {
            return parameters.valueGenerator.getArray(valueSupplier);
        } else {
            return valueSupplier();
        }
    }

    /**
     * Generate a random ID for a given type.
     * @private
     * @param {ClassDeclaration} classDeclaration - class declaration for a type.
     * @return {String} an ID.
     */
    generateRandomId(classDeclaration) {
        let id = Math.round(Math.random() * 9999).toString();
        id = padStart(id, 4, '0');
        return id;
    }

}

module.exports = InstanceGenerator;
