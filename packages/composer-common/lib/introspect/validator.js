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

/**
 * An Abstract field validator. Extend this class and override the
 * validate method.
 * @private
 * @class
 * @abstract
 * @memberof module:composer-common
 */
class Validator {

    /**
     * Create a Property.
     * @param {Field} field - the field this validator is attached to
     * @param {Object} validator - The validation string
     * @throws {IllegalModelException}
     */
    constructor(field, validator) {
        this.validator = validator;
        this.field = field;
    }

    /**
     * @param {string} id the identifier of the instance
     * @param {string} msg the exception message
     * @throws {Error} throws an error to report the message
     */
    reportError(id, msg) {
        throw new Error( 'Validator error for field ' + id + ' ' + this.getField().getFullyQualifiedName() + ': ' + msg );
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
     * Returns the field that this validator applies to
     * @return {Field} the field
     */
    getField() {
        return this.field;
    }

    /**
     * Validate the property against a value
     * @param {string} identifier the identifier of the instance being validated
     * @param {Object} value the value to validate
     * @throws {IllegalModelException}
     * @private
     */
    validate(identifier, value) {
    }
}

module.exports = Validator;
