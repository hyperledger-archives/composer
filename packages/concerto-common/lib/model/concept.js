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
 * <p>
 * Resource is an instance that has a type. The type of the resource
 * specifies a set of properites (which themselves have types).
 * </p>
 * <p>
 * Type information in Concerto is used to validate the structure of
 * Resource instances and for serialization.
 * </p>
 * <p>
 * Resources are used in Concerto to represent Assets, Participants, Transactions and
 * other domain classes that can be serialized for long-term persistent storage.
 * </p>
 * @extends Identifiable
 * @see See [Resource]{@link module:ibm-concerto-common.Resource}
 * @class
 * @memberof module:ibm-concerto-common
 */
class Concept extends Typed {
    /**
     * This constructor should not be called directly.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link Factory}</strong>
     * </p>
     *
     * @param {ModelManager} modelManager - The ModelManager for this instance
     * @param {string} ns - The namespace this instance.
     * @param {string} type - The type this instance.
     * @private
     */
    constructor(modelManager, ns, type) {
        super(modelManager, ns, type);
    }


    /**
     * Determine if this typed is a concept.
     * @return {boolean} True if this typed is a concept,
     * false if not.
     */
    isConcept() {
        return true;
    }
}

module.exports = Concept;
