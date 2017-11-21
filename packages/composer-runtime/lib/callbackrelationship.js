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

const LOG = Logger.getLog('CallbackRelationship');

/**
 * A callback relationship is a wrapper around a relationship.
 * This class calls the specified callback whenever a user attempts
 * to access any of the properties of the relationship, apart from
 * the identifier.
 * @protected
 */
class CallbackRelationship extends Relationship {

    /**
     * @callback relationshipCallback
     * @protected
     * @param {string} propertyName The property name being accessed.
     * @param {*} newValue The new value for the property, if it is being set.
     */

    /**
     *
     * @param {Relationship} relationship The relationship to wrap.
     * @param {relationshipCallback} callback The callback to call when a property is accessed.
     */
    constructor(relationship, callback) {
        super(relationship.getModelManager(), relationship.getClassDeclaration(), relationship.getNamespace(), relationship.getType(), relationship.getIdentifier());
        const method = 'constructor';
        LOG.entry(method, relationship, callback);
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
                LOG.debug(method, 'Defining callback property', propertyName);
                Object.defineProperty(this, propertyName, {
                    configurable: false,
                    enumerable: true,
                    get: () => {
                        return callback(propertyName);
                    },
                    set: (newValue) => {
                        return callback(propertyName, newValue);
                    }
                });
            }
        });
        LOG.exit(method);
    }

}

module.exports = CallbackRelationship;
