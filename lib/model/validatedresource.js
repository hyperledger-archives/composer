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

const TypedStack = require('../serializer/typedstack');
const Resource = require('./resource');

/**
 * ValidatedResource is a Resource that can validate that property
 * changes (or the whole instance) do not violate the structure of
 * the type information associated with the instance.
 * @extends ValidatedResource
 * @class
 * @memberof module:ibm-concerto-common
 */
class ValidatedResource extends Resource {
    /**
     * This constructor should not be called directly.
     * Use the Factory class to create instances.
     *
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link Factory}</strong>
     * </p>
     * @param {ModelManager} modelManager - The ModelManager for this instance
     * @param {string} ns - The namespace this instance.
     * @param {string} type - The type this instance.
     * @param {string} id - The identifier of this instance.
     * @param {ResourceValidator} resourceValidator - The validator to use for this instance
     * @private
     */
    constructor(modelManager, ns, type, id,resourceValidator) {
        super(modelManager, ns, type, id);
        this.$validator = resourceValidator;
    }

    /**
     * Sets a property, validating that it does not violate the model
     * @param {string} propName - the name of the field
     * @param {string} value - the value of the property
     * @throws {Error} if the value is not compatible with the model definition for the field
     */
    setPropertyValue(propName, value) {
        let classDeclaration = this.getClassDeclaration();
        let field = classDeclaration.getProperty(propName);

        if (!field) {
            throw new Error('The instance with id ' +
                this.getIdentifier() + ' trying to set field ' +
                propName + ' which is not declared in the model.');
        }
        // else {
        //     this.log( 'Validating field ' + field + ' with data ' + value );
        // }

        const parameters = {};
        parameters.stack = new TypedStack(value);
        parameters.modelManager = this.getModelManager();
        parameters.rootResourceIdentifier = this.getFullyQualifiedIdentifier();
        field.accept(this.$validator, parameters);
        super.setPropertyValue(propName,value);
    }

    /**
     * Adds an array property value, validating that it does not violate the model
     * @param {string} propName - the name of the field
     * @param {string} value - the value of the property
     * @throws {Error} if the value is not compatible with the model definition for the field
     */
    addArrayValue(propName, value) {
        let classDeclaration = this.getClassDeclaration();
        let field = classDeclaration.getProperty(propName);

        if (!field) {
            throw new Error('The instance with id ' +
                this.getIdentifier() + ' trying to set field ' +
                propName + ' which is not declared in the model.');
        }

        if (!field.isArray()) {
            throw new Error('The instance with id ' +
                this.getIdentifier() + ' trying to add array item ' +
                propName + ' which is not declared as an array in the model.');
        }

        const parameters = {};
        let newArray = [];
        if(this[propName]) {
            newArray = this[propName].slice(0);
        }
        newArray.push(value);
        parameters.stack = new TypedStack(newArray);
        parameters.modelManager = this.getModelManager();
        parameters.rootResourceIdentifier = this.getFullyQualifiedIdentifier();
        field.accept(this.$validator, parameters);
        super.addArrayValue(propName, value);
    }

    /**
     * Validates the instance against its model.
     *
     * @throws {Error} - if the instance if invalid with respect to the model
     */
    validate() {
        const classDeclaration = this.getClassDeclaration();
        const parameters = {};
        parameters.stack = new TypedStack(this);
        parameters.modelManager = this.getModelManager();
        parameters.rootResourceIdentifier = this.getFullyQualifiedIdentifier();
        classDeclaration.accept(this.$validator, parameters);
    }
}

module.exports = ValidatedResource;
