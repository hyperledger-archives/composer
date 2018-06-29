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
const EnumDeclaration = require('../introspect/enumdeclaration');
const Relationship = require('../model/relationship');
const Resource = require('../model/resource');
const Concept = require('../model/concept');
const Identifiable = require('../model/identifiable');
const Util = require('../util');
const ModelUtil = require('../modelutil');
const ValidationException = require('./validationexception');
const Globalize = require('../globalize');

/**
 * <p>
 * Validates a Resource or Field against the models defined in the ModelManager.
 * This class is used with the Visitor pattern and visits the class declarations
 * (etc) for the model, checking that the data in a Resource / Field is consistent
 * with the model.
 * </p>
 * The parameters for the visit method must contain the following properties:
 * <ul>
 *  <li> 'stack' - the TypedStack of objects being processed. It should
 * start as [Resource] or [Field]</li>
 * <li> 'rootResourceIdentifier' - the identifier of the resource being validated </li>
 * <li> 'modelManager' - the ModelManager instance to use for type checking</li>
 * </ul>
 * @private
 * @class
 * @memberof module:composer-common
 */
class ResourceValidator {

    /**
     * ResourceValidator constructor
     * @param {Object} options - the optional serialization options.
     * @param {boolean} options.validate - validate the structure of the Resource
     * with its model prior to serialization (default to true)
     * @param {boolean} options.convertResourcesToRelationships - Convert resources that
     * are specified for relationship fields into relationships, false by default.
     * @param {boolean} options.permitResourcesForRelationships - Permit resources in the
     */
    constructor(options) {
        this.options = options || {};
    }
    /**
     * Visitor design pattern.
     *
     * @param {Object} thing - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visit(thing, parameters) {
        if (thing instanceof EnumDeclaration) {
            return this.visitEnumDeclaration(thing, parameters);
        } else if (thing instanceof ClassDeclaration) {
            return this.visitClassDeclaration(thing, parameters);
        } else if (thing instanceof RelationshipDeclaration) {
            return this.visitRelationshipDeclaration(thing, parameters);
        } else if (thing instanceof Field) {
            return this.visitField(thing, parameters);
        }
    }

    /**
     * Visitor design pattern
     *
     * @param {EnumDeclaration} enumDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitEnumDeclaration(enumDeclaration, parameters) {
        const obj = parameters.stack.pop();

        // now check that obj is one of the enum values
        const properties = enumDeclaration.getProperties();
        let found = false;
        for(let n=0; n < properties.length; n++) {
            const property = properties[n];
            if(property.getName() === obj) {
                found = true;
            }
        }

        if(!found) {
            ResourceValidator.reportInvalidEnumValue( parameters.rootResourceIdentifier, enumDeclaration, obj );
        }

        return null;
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

        // are we dealing with a Resouce?
        if(!((obj instanceof Resource) || (obj instanceof Concept))) {
            ResourceValidator.reportNotResouceViolation(parameters.rootResourceIdentifier, classDeclaration, obj );
        }

        if(obj instanceof Identifiable) {
            parameters.rootResourceIdentifier = obj.getFullyQualifiedIdentifier();
        }

        const toBeAssignedClassDeclaration = parameters.modelManager.getType(obj.getFullyQualifiedType());
        const toBeAssignedClassDecName = toBeAssignedClassDeclaration.getFullyQualifiedName();

        // is the type we are assigning to abstract?
        // the only way this can happen is if the type is non-abstract
        // and then gets redeclared as abstract
        if(toBeAssignedClassDeclaration.isAbstract()) {
            ResourceValidator.reportAbstractClass(toBeAssignedClassDeclaration);
        }

        // are there extra fields in the object?
        let props = Object.getOwnPropertyNames(obj);
        for (let n = 0; n < props.length; n++) {
            let propName = props[n];
            if(!this.isSystemProperty(propName)) {
                const field = toBeAssignedClassDeclaration.getProperty(propName);
                if (!field) {
                    if(obj instanceof Identifiable) {
                        ResourceValidator.reportUndeclaredField(obj.getIdentifier(), propName, toBeAssignedClassDecName);
                    }
                    else {
                        ResourceValidator.reportUndeclaredField(parameters.currentIdentifier, propName, toBeAssignedClassDecName);
                    }
                }
            }
        }

        if(obj instanceof Identifiable) {
            const id = obj.getIdentifier();

            // prevent empty identifiers
            if(!id || id.trim().length === 0) {
                ResourceValidator.reportEmptyIdentifier(parameters.rootResourceIdentifier);
            }

            parameters.currentIdentifier = obj.getFullyQualifiedIdentifier();
        }

        // now validate each property
        const properties = toBeAssignedClassDeclaration.getProperties();
        for(let n=0; n < properties.length; n++) {
            const property = properties[n];
            const value = obj[property.getName()];
            if(!Util.isNull(value)) {
                parameters.stack.push(value);
                property.accept(this,parameters);
            }
            else {
                if(!property.isOptional()) {
                    ResourceValidator.reportMissingRequiredProperty( parameters.rootResourceIdentifier, property);
                }
            }
        }
        return null;
    }

    /**
     * Returns true if the property is a system property.
     * System properties are not declared in the model.
     * @param {String} propertyName - the name of the property
     * @return {Boolean} true if the property is a system property
     * @private
     */
    isSystemProperty(propertyName) {
        return propertyName.charAt(0) === '$';
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

        let dataType = typeof(obj);
        let propName = field.getName();

        if (dataType === 'undefined' || dataType === 'symbol') {
            ResourceValidator.reportFieldTypeViolation(parameters.rootResourceIdentifier, propName, obj, field);
        }

        if(field.isTypeEnum()) {
            this.checkEnum(obj, field,parameters);
        }
        else {
            if(field.isArray()) {
                this.checkArray(obj, field,parameters);
            }
            else {
                this.checkItem(obj, field,parameters);
            }
        }

        return null;
    }

    /**
     * Check a Field that is declared as an Array.
     * @param {Object} obj - the object being validated
     * @param {Field} field - the object being visited
     * @param {Object} parameters  - the parameter
     * @private
     */
    checkEnum(obj,field,parameters) {

        if(field.isArray() && !(obj instanceof Array)) {
            ResourceValidator.reportFieldTypeViolation(parameters.rootResourceIdentifier, field.getName(), obj, field);
        }

        const enumDeclaration = field.getParent().getModelFile().getType(field.getType());

        if(field.isArray()) {
            for(let n=0; n < obj.length; n++) {
                const item = obj[n];
                parameters.stack.push(item);
                enumDeclaration.accept(this, parameters);
            }
        }
        else {
            const item = obj;
            parameters.stack.push(item);
            enumDeclaration.accept(this, parameters);
        }
    }

    /**
     * Check a Field that is declared as an Array.
     * @param {Object} obj - the object being validated
     * @param {Field} field - the object being visited
     * @param {Object} parameters  - the parameter
     * @private
     */
    checkArray(obj,field,parameters) {

        if(!(obj instanceof Array)) {
            ResourceValidator.reportFieldTypeViolation(parameters.rootResourceIdentifier, field.getName(), obj, field);
        }

        for(let n=0; n < obj.length; n++) {
            const item = obj[n];
            this.checkItem(item, field, parameters);
        }
    }

    /**
     * Check a single (non-array) field.
     * @param {Object} obj - the object being validated
     * @param {Field} field - the object being visited
     * @param {Object} parameters  - the parameter
     * @private
     */
    checkItem(obj,field, parameters) {
        let dataType = typeof obj;
        let propName = field.getName();

        if (dataType === 'undefined' || dataType === 'symbol') {
            ResourceValidator.reportFieldTypeViolation(parameters.rootResourceIdentifier, propName, obj, field);
        }

        if(field.isPrimitive()) {
            let invalid = false;

            switch(field.getType()) {
            case 'String':
                if(dataType !== 'string') {
                    invalid = true;
                }
                break;
            case 'Double':
            case 'Long':
            case 'Integer':
                if(dataType !== 'number') {
                    invalid = true;
                }
                break;
            case 'Boolean':
                if(dataType !== 'boolean') {
                    invalid = true;
                }
                break;
            case 'DateTime':
                if(!(obj instanceof Date)) {
                    invalid = true;
                }
                break;
            }
            if (invalid) {
                ResourceValidator.reportFieldTypeViolation(parameters.rootResourceIdentifier, propName, obj, field);
            }
            else {
                if(field.getValidator() !== null) {
                    field.getValidator().validate(parameters.currentIdentifier, obj);
                }
            }
        }
        else {
            // a field that points to a transaction, asset, participant...
            let classDeclaration = parameters.modelManager.getType(field.getFullyQualifiedTypeName());
            if(obj instanceof Identifiable) {
                try {
                    classDeclaration = parameters.modelManager.getType(obj.getFullyQualifiedType());
                } catch (err) {
                    ResourceValidator.reportFieldTypeViolation(parameters.rootResourceIdentifier, propName, obj, field);
                }

                // is it compatible?
                if(!ModelUtil.isAssignableTo(classDeclaration.getModelFile(), classDeclaration.getFullyQualifiedName(), field)) {
                    ResourceValidator.reportInvalidFieldAssignment(parameters.rootResourceIdentifier, propName, obj, field);
                }
            }

            // recurse
            parameters.stack.push(obj);
            classDeclaration.accept(this, parameters);
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

        if(relationshipDeclaration.isArray()) {
            if(!(obj instanceof Array)) {
                ResourceValidator.reportInvalidFieldAssignment(parameters.rootResourceIdentifier, relationshipDeclaration.getName(), obj, relationshipDeclaration);
            }

            for(let n=0; n < obj.length; n++) {
                const item = obj[n];
                this.checkRelationship(parameters, relationshipDeclaration, item);
            }
        }
        else {
            this.checkRelationship(parameters, relationshipDeclaration, obj);
        }
        return null;
    }

    /**
     * Check a single relationship
     * @param {Object} parameters  - the parameter
     * @param {relationshipDeclaration} relationshipDeclaration - the object being visited
     * @param {Object} obj - the object being validated
     * @private
     */
    checkRelationship(parameters, relationshipDeclaration, obj) {
        if(obj instanceof Relationship) {
            // All good..
        } else if (obj instanceof Resource && (this.options.convertResourcesToRelationships || this.options.permitResourcesForRelationships)) {
            // All good.. Again
        } else {
            ResourceValidator.reportNotRelationshipViolation(parameters.rootResourceIdentifier, relationshipDeclaration, obj);
        }

        const relationshipType = parameters.modelManager.getType(obj.getFullyQualifiedType());

        if(relationshipType.isConcept()) {
            throw new Error('Cannot have a relationship to a concept. Relationships must be to resources.');
        }

        if(!ModelUtil.isAssignableTo(relationshipType.getModelFile(), obj.getFullyQualifiedType(), relationshipDeclaration)) {
            ResourceValidator.reportInvalidFieldAssignment(parameters.rootResourceIdentifier, relationshipDeclaration.getName(), obj, relationshipDeclaration);
        }
    }

    /**
     * Throw a new error for a model violation.
     * @param {string} id - the identifier of this instance.
     * @param {string} propName - the name of the field.
     * @param {*} value - the value of the field.
     * @param {Field} field - the field
     * @throws {ValidationException} the exception
     * @private
     */
    static reportFieldTypeViolation(id, propName, value, field) {
        let isArray = field.isArray() ? '[]' : '';
        let typeOfValue = typeof value;

        if(value instanceof Identifiable) {
            typeOfValue = value.getFullyQualifiedType();
            value = value.getFullyQualifiedIdentifier();
        }
        else {
            if(value) {
                try {
                    value = JSON.stringify(value);
                }
                catch(err) {
                    value = value.toString();
                }
            }
        }

        let formatter = Globalize.messageFormatter('resourcevalidator-fieldtypeviolation');
        throw new ValidationException(formatter({
            resourceId: id,
            propertyName: propName,
            fieldType: field.getType() + isArray,
            value: value,
            typeOfValue: typeOfValue
        }));
    }

    /**
     * Throw a new error for a model violation.
     * @param {string} id - the identifier of this instance.
     * @param {classDeclaration} classDeclaration - the declaration of the classs
     * @param {Object} value - the value of the field.
     * @private
     */
    static reportNotResouceViolation(id, classDeclaration, value) {
        let formatter = Globalize.messageFormatter('resourcevalidator-notresourceorconcept');
        throw new ValidationException(formatter({
            resourceId: id,
            classFQN: classDeclaration.getFullyQualifiedName(),
            invalidValue: value.toString()
        }));
    }

    /**
     * Throw a new error for a model violation.
     * @param {string} id - the identifier of this instance.
     * @param {RelationshipDeclaration} relationshipDeclaration - the declaration of the classs
     * @param {Object} value - the value of the field.
     * @private
     */
    static reportNotRelationshipViolation(id, relationshipDeclaration, value) {
        let formatter = Globalize.messageFormatter('resourcevalidator-notrelationship');
        throw new ValidationException(formatter({
            resourceId: id,
            classFQN: relationshipDeclaration.getFullyQualifiedTypeName(),
            invalidValue: value.toString()
        }));
    }

    /**
     * Throw a new error for a missing, but required field.
     * @param {string} id - the identifier of this instance.
     * @param {Field} field - the field/
     * @private
     */
    static reportMissingRequiredProperty(id, field) {
        let formatter = Globalize.messageFormatter('resourcevalidator-missingrequiredproperty');
        throw new ValidationException(formatter({
            resourceId: id,
            fieldName: field.getName()
        }));
    }

    /**
     * Throw a new error for a missing, but required field.
     * @param {string} id - the identifier of this instance.
     * @param {Field} field - the field/
     * @private
     */
    static reportEmptyIdentifier(id) {
        let formatter = Globalize.messageFormatter('resourcevalidator-emptyidentifier');
        throw new ValidationException(formatter({
            resourceId: id
        }));
    }

    /**
     * Throw a new error for a missing, but required field.
     * @param {string} id - the identifier of this instance.
     * @param {Field} field - the field
     * @param {string} obj - the object value
     * @private
     */
    static reportInvalidEnumValue(id, field, obj) {
        let formatter = Globalize.messageFormatter('resourcevalidator-invalidenumvalue');
        throw new ValidationException(formatter({
            resourceId: id,
            value: obj,
            fieldName: field.getName()
        }));
    }

    /**
     * Throw a validation exception for an abstract class
     * @param {ClassDeclaration} classDeclaration - the class declaration
     * @throws {ValidationException} the validation exception
     * @private
     */
    static reportAbstractClass(classDeclaration) {
        let formatter = Globalize.messageFormatter('resourcevalidator-abstractclass');
        throw new ValidationException(formatter({
            className: classDeclaration.getFullyQualifiedName(),
        }));
    }

    /**
     * Throw a validation exception for an abstract class
     * @param {string} resourceId - the id of the resouce being validated
     * @param {string} propertyName - the name of the property that is not declared
     * @param {string} fullyQualifiedTypeName - the fully qualified type being validated
     * @throws {ValidationException} the validation exception
     * @private
     */
    static reportUndeclaredField(resourceId, propertyName, fullyQualifiedTypeName ) {
        let formatter = Globalize.messageFormatter('resourcevalidator-undeclaredfield');
        throw new ValidationException(formatter({
            resourceId: resourceId,
            propertyName: propertyName,
            fullyQualifiedTypeName: fullyQualifiedTypeName
        }));
    }

    /**
     * Throw a validation exception for an invalid field assignment
     * @param {string} resourceId - the id of the resouce being validated
     * @param {string} propName - the name of the property that is being assigned
     * @param {*} obj - the Field
     * @param {Field} field - the Field
     * @throws {ValidationException} the validation exception
     * @private
     */
    static reportInvalidFieldAssignment(resourceId, propName, obj, field) {
        let formatter = Globalize.messageFormatter('resourcevalidator-invalidfieldassignment');
        let typeName = field.getFullyQualifiedTypeName();

        if(field.isArray()) {
            typeName += '[]';
        }

        throw new ValidationException(formatter({
            resourceId: resourceId,
            propertyName: propName,
            objectType: obj.getFullyQualifiedType(),
            fieldType: typeName
        }));
    }
}

module.exports = ResourceValidator;
