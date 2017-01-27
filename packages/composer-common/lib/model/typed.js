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

const Field = require('../introspect/field');

/**
 * Object is an instance with a namespace and a type.
 *
 * This class is abstract.
 * @abstract
 * @class
 * @memberof module:ibm-concerto-common
 */
class Typed {
    /**
     * Create an instance.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link Factory}</strong>
     * </p>
     *
     * @param {ModelManager} modelManager - The ModelManager for this instance
     * @param {string} ns - The namespace this instance.
     * @param {string} type - The type this instance.
     * @private
     */
    constructor(modelManager, ns, type) {
        this.$modelManager = modelManager;
        this.$namespace = ns;
        this.$type = type;
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
     * Get the ModelManager for this instance
     * @return {ModelManager} The ModelManager for this object
     * @private
     */
    getModelManager() {
        return this.$modelManager;
    }

    /**
     * Get the type of the instance (a short name, not including namespace).
     * @return {string} The type of this object
     */
    getType() {
        return this.$type;
    }

    /**
     * Get the fully-qualified type name of the instance (including namespace).
     * @return {string} The fully-qualified type name of this object
     */
    getFullyQualifiedType() {
        return this.$namespace + '.' + this.$type;
    }

    /**
     * Get the namespace of the instance.
     * @return {string} The namespace of this object
     */
    getNamespace() {
        return this.$namespace;
    }

    /**
     * Returns the class declaration for this instance object.
     *
     * @return {ClassDeclaration} - the class declaration for this instance
     * @throws {Error} - if the class or namespace for the instance is not declared
     * @private
     */
    getClassDeclaration() {
        // do we have a model file?
        let modelFile = this.getModelManager().getModelFile(this.getNamespace());

        if (!modelFile) {
            throw new Error('No model for namespace ' + this.getNamespace() + ' is registered with the ModelManager');
        }

        // do we have a class?
        let classDeclaration = modelFile.getType(this.getType());

        if (!classDeclaration) {
            throw new Error('The namespace ' + this.getNamespace() + ' does not contain the type ' + this.getType());
        }

        return classDeclaration;
    }

    /**
     * Sets a property on this Resource
     * @param {string} propName - the name of the field
     * @param {string} value - the value of the property
     */
    setPropertyValue(propName, value) {
        this[propName] = value;
    }

    /**
     * Adds a value to an array property on this Resource
     * @param {string} propName - the name of the field
     * @param {string} value - the value of the property
     */
    addArrayValue(propName, value) {
        if(this[propName]) {
            this[propName].push(value);
        }
        else {
            this[propName] = [value];
        }
    }

    /**
     * Sets the fields to their default values, based on the model
     * @private
     */
    assignFieldDefaults() {
        let classDeclaration = this.getClassDeclaration();
        let fields = classDeclaration.getProperties();

        for (let n = 0; n < fields.length; n++) {
            let field = fields[n];
            if (field instanceof Field) {
                let defaultValue = field.getDefaultValue();

                if (defaultValue) {
                    if (field.getType() === 'String') {
                        this.setPropertyValue(field.getName(), defaultValue);
                    } else if (field.getType() === 'Integer') {
                        this.setPropertyValue(field.getName(), parseInt(defaultValue));
                    } else if (field.getType() === 'Long') {
                        this.setPropertyValue(field.getName(), parseInt(defaultValue));
                    } else if (field.getType() === 'Double') {
                        this.setPropertyValue(field.getName(), parseFloat(defaultValue));
                    } else if (field.getType() === 'Boolean') {
                        this.setPropertyValue(field.getName(), (defaultValue === 'true'));
                    } else if (field.getType() === 'DateTime') {
                        const dateTime = new Date();
                        dateTime.setTime(Date.parse(defaultValue));
                        this.setPropertyValue(field.getName(), dateTime);
                    }
                }
            }
        }
    }

    /**
     * Overriden to prevent people accidentally converting a resource to JSON
     * without using the Serializer.
     * @private
     */
    toJSON() {
        throw new Error('Use Serializer.toJSON to convert resource instances to JSON objects.');
    }
}

module.exports = Typed;
