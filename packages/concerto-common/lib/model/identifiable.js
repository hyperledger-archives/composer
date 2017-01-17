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

const IDENTIFIABLE_SYSTEM_PROPERTIES = ['$validator', '$class', '$modelManager', '$namespace', '$identifier', '$type'];

/**
 * Identifiable is an entity with a namespace, type and an identifier.
 *
 * This class is abstract.
 * @abstract
 * @class
 * @memberof module:ibm-concerto-common
 */
class Identifiable {
    /**
     * Create an instance.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link Factory}</strong>
     * </p>
     *
     * @param {ModelManager} modelManager - The ModelManager for this instance
     * @param {string} ns - The namespace this instance.
     * @param {string} type - The type this instance.
     * @param {string} id - The identifier of this instance.
     * @private
     */
    constructor(modelManager, ns, type, id) {
        this.$modelManager = modelManager;
        this.$namespace = ns;
        this.$identifier = id;
        this.$type = type;
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
     * Get the ModelManager for this instance
     * @return {ModelManager} The ModelManager for this object
     * @private
     */
    getModelManager() {
        return this.$modelManager;
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
     * Get the type of the instance (a short name, not including namespace).
     * @return {string} The type of this object
     */
    getType() {
        return this.$type;
    }

    /**
     * Get the fully-qualified type name of the instance (including namespace).
     * @return {string} The fully-qualified type name of this object
     */
    getFullyQualifiedType() {
        return this.$namespace + '.' + this.$type;
    }

    /**
     * Get the namespace of the instance.
     * @return {string} The namespace of this object
     */
    getNamespace() {
        return this.$namespace;
    }

    /**
     * Returns the class declaration for this instance object.
     *
     * @return {ClassDeclaration} - the class declaration for this instance
     * @throws {Error} - if the class or namespace for the instance is not declared
     * @private
     */
    getClassDeclaration() {
        // do we have a model file?
        let modelFile = this.getModelManager().getModelFile(this.getNamespace());

        if (!modelFile) {
            throw new Error('No model for namespace ' + this.getNamespace() + ' is registered with the ModelManager');
        }

        // do we have a class?
        let classDeclaration = modelFile.getType(this.getType());

        if (!classDeclaration) {
            throw new Error('The namespace ' + this.getNamespace() + ' does not contain the type ' + this.getType());
        }

        return classDeclaration;
    }

    /**
     * Overriden to prevent people accidentally converting a resource to JSON
     * without using the Serializer.
     * @private
     */
    toJSON() {
        throw new Error('Use Serializer.toJSON to convert resource instances to JSON objects.');
    }

    /**
     * Returns the string representation of this class
     * @return {String} the string representation of the class
     */
    toString() {
        return 'Identifiable {id=' + this.getFullyQualifiedIdentifier() +'}';
    }

    /**
     *  Returns true if the property is a system
     * property.
     * @param {string} name - the name of the property
     * @return {boolean} true if the property is a system property
     * @private
     */
    static isSystemProperty(name) {
        return IDENTIFIABLE_SYSTEM_PROPERTIES.indexOf(name) >= 0;
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

}

module.exports = Identifiable;
