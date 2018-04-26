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
const ModelUtil = require('../modelutil');
const ResourceId = require('./resourceid');

/**
 * A Relationship is a typed pointer to an instance. I.e the relationship
 * with namespace = 'org.example', type = 'Vehicle' and id = 'ABC' creates
 * a pointer that points at an instance of org.example.Vehicle with the id
 * ABC.
 *
 * Applications should retrieve instances from {@link Factory}
 *
 * @extends Identifiable
 * @see See {@link Identifiable}
 * @class
 * @memberof module:composer-common
 */
class Relationship extends Identifiable {
    /**
     * Create an asset. Use the Factory to create instances.
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
        // we use this metatag to identify the instance as a relationship
        this.$class = 'Relationship';
    }

    /**
     * Returns the string representation of this class
     * @return {String} the string representation of the class
     */
    toString() {
        return 'Relationship {id=' + this.getFullyQualifiedIdentifier() + '}';
    }

    /**
     * Determine if this identifiable is a relationship.
     * @return {boolean} True if this identifiable is a relationship,
     * false if not.
     */
    isRelationship() {
        return true;
    }

    /**
     * Contructs a Relationship instance from a URI representation (created using toURI).
     * @param {ModelManager} modelManager - the model manager to bind the relationship to
     * @param {String} uriAsString - the URI as a string, generated using Identifiable.toURI()
     * @param {String} [defaultNamespace] - default namespace to use for backwards compatability (optional)
     * @param {String} [defaultType] - default type to use for backwards compatability (optional)
     * @return {Relationship} the relationship
     */
    static fromURI(modelManager, uriAsString, defaultNamespace, defaultType) {
        const resourceId = ResourceId.fromURI(uriAsString, defaultNamespace, defaultType);
        let fqt = ModelUtil.getFullyQualifiedName(resourceId.namespace, resourceId.type);
        let classDeclaration = modelManager.getType(fqt);
        let relationship = new Relationship(modelManager, classDeclaration, resourceId.namespace, resourceId.type, resourceId.id);
        return relationship;
    }
}

module.exports = Relationship;
