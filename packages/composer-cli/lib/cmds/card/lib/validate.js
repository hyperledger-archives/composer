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
const ajv = require('ajv');

/**
 * Validate connection profile
 * @private
 */
class Validate {
    /**
     * validateProfile
     * validates connection profile
     * @param {Object} profile the connection profile
     * @return {Object} undef if the profile is valid, error array otherwise.
     */
    static validateProfile(profile) {
        if (!profile['x-type']) {
            return ['Connection profile has no `x-type` property defined. It is not valid for this version of composer'];
        }

        if (profile['x-type'].startsWith('hlfv1')) {
            let schema = require('./schema/ccpschema.json');
            let validate = new ajv({ allErrors : true }).compile(schema);
            validate(profile);
            if(validate.errors) {
                return validate.errors;
            }
        }
        return;
    }
}
module.exports = Validate;
