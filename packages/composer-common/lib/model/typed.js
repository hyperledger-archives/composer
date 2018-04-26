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

const Field = require('../introspect/field');

/**
 * Object is an instance with a namespace and a type.
 *
 * This class is abstract.
 * @abstract
 * @class
 * @memberof module:composer-common
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
     * @param {ClassDeclaration} classDeclaration - The class declaration for this instance.
     * @param {string} ns - The namespace this instance.
     * @param {string} type - The type this instance.
     * @private
     */
    constructor(modelManager, classDeclaration, ns, type) {
        this.$modelManager = modelManager;
        this.$classDeclaration = classDeclaration;
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
        return this.$classDeclaration.getFullyQualifiedName();
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
     * @private
     */
    getClassDeclaration() {
        return this.$classDeclaration;
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
                    } else {
                        // following precident set in jsonpopulator.js - if we get this far the field should be an enum
                        this.setPropertyValue(field.getName(), defaultValue);
                    }
                }
            }
        }
    }

    /**
     * Check to see if this instance is an instance of the specified fully qualified
     * type name.
     * @param {String} fqt The fully qualified type name.
     * @returns {boolean} True if this instance is an instance of the specified fully
     * qualified type name, false otherwise.
     */
    instanceOf(fqt) {
        // Check to see if this is an exact instance of the specified type.
        const classDeclaration = this.getClassDeclaration();
        if (classDeclaration.getFullyQualifiedName() === fqt) {
            return true;
        }
        // Now walk the class hierachy looking to see if it's an instance of the specified type.
        let superTypeDeclaration = classDeclaration.getSuperTypeDeclaration();
        while (superTypeDeclaration) {
            if (superTypeDeclaration.getFullyQualifiedName() === fqt) {
                return true;
            }
            superTypeDeclaration = superTypeDeclaration.getSuperTypeDeclaration();
        }
        return false;
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
