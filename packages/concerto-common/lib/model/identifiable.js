/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const Typed = require('./typed');

/**
 * Identifiable is an entity with a namespace, type and an identifier.
 *
 * This class is abstract.
 * @abstract
 * @class
 * @memberof module:ibm-concerto-common
 */
class Identifiable extends Typed{
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
        super(modelManager, ns, type);
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
}

module.exports = Identifiable;
