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

const ResourceId = require('./resourceid');
const Typed = require('./typed');

/**
 * Identifiable is an entity with a namespace, type and an identifier.
 * Applications should retrieve instances from {@link Factory}
 * This class is abstract.
 * @extends Typed
 * @abstract
 * @class
 * @memberof module:composer-common
 */
class Identifiable extends Typed {
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
     * @param {string} id - The identifier of this instance.
     * @private
     */
    constructor(modelManager, classDeclaration, ns, type, id) {
        super(modelManager, classDeclaration, ns, type);
        this.$identifier = id;
    }

    /**
     * Get the identifier of this instance
     * @return {string} The identifier for this object
     */
    getIdentifier() {
        return this.$identifier;
    }

    /**
     * Set the identifier of this instance
     * @param {string} id - the new identifier for this object
     */
    setIdentifier(id) {
        this.$identifier = id;
        const modelFile = this.$modelManager.getModelFile(this.getNamespace());
        const typeDeclaration = modelFile.getType(this.getFullyQualifiedType());
        const idField = typeDeclaration.getIdentifierFieldName();
        this[idField] = id;
    }

    /**
     * Get the fully qualified identifier of this instance.
     * (namespace '.' type '#' identifier).
     * @return {string} the fully qualified identifier of this instance
     */
    getFullyQualifiedIdentifier() {
        return this.getFullyQualifiedType() + '#' + this.$identifier;
    }

    /**
     * Returns the string representation of this class
     * @return {String} the string representation of the class
     */
    toString() {
        return 'Identifiable {id=' + this.getFullyQualifiedIdentifier() +'}';
    }

    /**
     * Determine if this identifiable is a relationship.
     * @return {boolean} True if this identifiable is a relationship,
     * false if not.
     */
    isRelationship() {
        return false;
    }

    /**
     * Determine if this identifiable is a resource.
     * @return {boolean} True if this identifiable is a resource,
     * false if not.
     */
    isResource() {
        return false;
    }

    /**
     * Returns a URI representation of a reference to this identifiable
     * @return {String} the URI for the identifiable
     */
    toURI() {
        const resourceId = new ResourceId(this.getNamespace(), this.getType(), this.getIdentifier());
        const result = resourceId.toURI();
        //console.log( '***** URI for ' + this.toString() + ' is ' + result );
        return result;
    }
}

module.exports = Identifiable;
