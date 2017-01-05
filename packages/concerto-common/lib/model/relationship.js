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

const Identifiable = require('./identifiable');

/**
* A Relationship is a typed pointer to an instance. I.e the relationship
* with namespace = 'org.acme', type = 'Vehicle' and id = 'ABC' creates
* a pointer that points at an instance of org.acme.Vehicle with the id
* ABC.
* @extends Identifiable
* @see See [Identifiable]{@link module:ibm-concerto-common.Identifiable}
* @class
* @memberof module:ibm-concerto-common
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
     * @param {string} ns - The namespace this instance.
     * @param {string} type - The type this instance.
     * @param {string} id - The identifier of this instance.
     * @private
     */
    constructor(modelManager, ns, type, id) {
        super(modelManager, ns, type, id);
        // we use this metatag to identify the instance as a relationship
        this.$class = 'Relationship';
    }

    /**
     * Returns the string representation of this class
     * @return {String} the string representation of the class
     */
    toString() {
        return 'Relationship {id=' + this.getFullyQualifiedIdentifier() +'}';
    }
}

module.exports = Relationship;
