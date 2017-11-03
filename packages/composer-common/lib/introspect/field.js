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

const Property = require('./property');
const NumberValidator = require('./numbervalidator');
const StringValidator = require('./stringvalidator');

/**
 * Class representing the definition of a Field. A Field is owned
 * by a ClassDeclaration and has a name, type and additional metadata
 * (see below).
 * @private
 * @extends Property
 * @see See  {@link  Property}
 * @class
 * @memberof module:composer-common
 */
class Field extends Property {

    /**
     * Create an Field.
     * @param {ClassDeclaration} parent - The owner of this property
     * @param {Object} ast - The AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(parent, ast) {
        super(parent, ast);
    }

    /**
     * Process the AST and build the model
     * @throws {IllegalModelException}
     * @private
     */
    process() {
        super.process();

        this.validator = null;

        switch(this.getType()) {
        case 'Integer':
        case 'Double':
        case 'Long':
            if(this.ast.range) {
                this.validator = new NumberValidator(this, this.ast.range);
            }
            break;
        case 'String':
            if(this.ast.regex) {
                this.validator = new StringValidator(this, this.ast.regex);
            }
            break;
        }

        if(this.ast.default) {
            this.defaultValue = this.ast.default;
        } else {
            this.defaultValue = null;
        }
    }

    /**
     * Returns the validator string for this field
     * @return {string} the validator for the field or null
     */
    getValidator() {
        return this.validator;
    }

    /**
     * Returns the default value for the field or null
     * @return {string} the default value for the field or null
     */
    getDefaultValue() {
        if(this.defaultValue) {
            return this.defaultValue;
        }
        else {
            return null;
        }
    }

    /**
     * Returns a string representation of this property§
     * @return {String} the string version of the property.
     */
    toString() {
        return 'Field {name=' + this.name + ', type=' + this.getFullyQualifiedTypeName() + ', array=' + this.array + ', optional=' + this.optional +'}';
    }
}

module.exports = Field;
