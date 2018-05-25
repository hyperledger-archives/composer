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

const Logger = require('composer-common').Logger;
const Relationship = require('composer-common').Relationship;

const LOG = Logger.getLog('InvalidRelationship');

/**
 * An invalid relationship is a wrapper around a relationship that
 * could not be resolved due to a missing resource or lack of permission.
 * This class throws errors whenever a user attempts to access any of
 * the properties of the relationship, apart from the identifier.
 * @protected
 */
class InvalidRelationship extends Relationship {

    /**
     *
     * @param {Relationship} relationship The relationship to wrap.
     * @param {Error} error The error to throw when the relationship is accessed.
     */
    constructor(relationship, error) {
        super(relationship.getModelManager(), relationship.getClassDeclaration(), relationship.getNamespace(), relationship.getType(), relationship.getIdentifier());
        const method = 'constructor';
        LOG.entry(method, relationship, error);
        const classDeclaration = this.getClassDeclaration();
        const identifierFieldName = classDeclaration.getIdentifierFieldName();
        const properties = classDeclaration.getProperties();
        properties.forEach((property) => {
            const propertyName = property.getName();
            if (propertyName === identifierFieldName) {
                LOG.debug(method, 'Defining identifier property', propertyName);
                Object.defineProperty(this, propertyName, {
                    configurable: false,
                    enumerable: true,
                    get: () => {
                        return this.$identifier;
                    },
                    set: (newValue) => {
                        this.$identifier = newValue;
                    }
                });
            } else {
                LOG.debug(method, 'Defining invalid property', propertyName);
                Object.defineProperty(this, propertyName, {
                    configurable: false,
                    enumerable: true,
                    get: () => {
                        const err = new Error(`attempt to get property ${propertyName} on an InvalidRelationship is not allowed. InvalidRelationship created due to ${error.message}`);
                        LOG.error(err);
                        throw err;
                    },
                    set: () => {
                        const err = new Error(`attempt to set property ${propertyName} on an InvalidRelationship is not allowed. InvalidRelationship created due to ${error.message}`);
                        LOG.error(err);
                        throw err;
                    }
                });
            }
        });
        LOG.exit(method);
    }

}

module.exports = InvalidRelationship;
