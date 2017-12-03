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

const Concept = require('./concept');
const TypedStack = require('../serializer/typedstack');

/**
 *
 * Resource is an instance that has a type. The type of the resource
 * specifies a set of properites (which themselves have types).
 *
 *
 * Type information in Composer is used to validate the structure of
 * Resource instances and for serialization.
 *
 *
 * Resources are used in Composer to represent Assets, Participants, Transactions and
 * other domain classes that can be serialized for long-term persistent storage.
 *
 * @extends Concept
 * @see See {@link Resource}
 * @class
 * @memberof module:composer-common
 */
class ValidatedConcept extends Concept {
    /**
     * This constructor should not be called directly.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link Factory}</strong>
     * </p>
     *
     * @param {ModelManager} modelManager - The ModelManager for this instance
     * @param {ClassDeclaration} classDeclaration - The class declaration for this instance.
     * @param {string} ns - The namespace this instance.
     * @param {string} type - The type this instance.
     * @param {ResourceValidator} resourceValidator - The validator to use for this instance
     * @private
     */
    constructor(modelManager, classDeclaration, ns, type, resourceValidator) {
        super(modelManager, classDeclaration, ns, type);
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
            throw new Error('Trying to set field ' +
                propName + ' which is not declared in the model.');
        }
        // else {
        //     this.log( 'Validating field ' + field + ' with data ' + value );
        // }

        const parameters = {};
        parameters.stack = new TypedStack(value);
        parameters.modelManager = this.getModelManager();
        parameters.rootResourceIdentifier = 'undefined';
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
            throw new Error('Trying to set field ' +
                propName + ' which is not declared in the model.');
        }

        if (!field.isArray()) {
            throw new Error('Trying to add array item ' +
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
        parameters.rootResourceIdentifier = 'undefined';
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
        parameters.rootResourceIdentifier = 'undefined';
        classDeclaration.accept(this.$validator, parameters);
    }
}

module.exports = ValidatedConcept;
