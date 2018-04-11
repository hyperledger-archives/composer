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

const Identifiable = require('./identifiable');

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
 * @extends Identifiable
 * @see See {@link Resource}
 * @class
 * @memberof module:composer-common
 * @public
 */
class Resource extends Identifiable {
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
     * @param {string} id - The identifier of this instance.
     * @private
     */
    constructor(modelManager, classDeclaration, ns, type, id) {
        super(modelManager, classDeclaration, ns, type, id);
    }

    /**
     * Returns the string representation of this class
     * @return {String} the string representation of the class
     */
    toString() {
        return 'Resource {id=' + this.getFullyQualifiedIdentifier() +'}';
    }

    /**
     * Determine if this identifiable is a resource.
     * @return {boolean} True if this identifiable is a resource,
     * false if not.
     */
    isResource() {
        return true;
    }

    /**
     * Serialize this resource into a JavaScript object suitable for serialization to JSON,
     * using the default options for the serializer. If you need to set additional options
     * for the serializer, use the {@link Serializer#toJSON} method instead.
     * @return {Object} A JavaScript object suitable for serialization to JSON.
     */
    toJSON() {
        return this.getModelManager().getSerializer().toJSON(this);
    }

}

module.exports = Resource;
