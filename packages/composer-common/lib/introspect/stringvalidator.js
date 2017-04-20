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

const Validator = require('./validator');

/**
 * A Validator to enforce that a string matches a regex
 * @private
 * @class
 * @memberof module:composer-common
 */
class StringValidator extends Validator{

    /**
     * Create a StringValidator.
     * @param {Field} field - the field this validator is attached to
     * @param {Object} validator - The validation string. This must be a regex
     * expression.
     *
     * @throws {IllegalModelException}
     */
    constructor(field, validator) {
        super(field,validator);
        try {
            // discard the leading / and closing /
            this.regex = new RegExp(validator.substring(1,validator.length-1));
        }
        catch(exception) {
            this.reportError(exception.message);
        }
    }

    /**
     * Validate the property
     * @param {string} identifier the identifier of the instance being validated
     * @param {Object} value the value to validate
     * @throws {IllegalModelException}
     * @private
     */
    validate(identifier, value) {
        if(value !== null) {
            if(!this.regex.test(value)) {
                this.reportError(identifier, 'Value + \'' + value + '\' failed to match validation regex: ' + this.regex);
            }
        }
    }
}

module.exports = StringValidator;
