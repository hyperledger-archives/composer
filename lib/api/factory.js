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

const Logger = require('@ibm/ibm-concerto-common').Logger;

const LOG = Logger.getLog('Factory');

/**
 * Do not attempt to create an instance of this class; you cannot directly create
 * a new instance of this class.<br>
 * You must use the {@link getFactory} method instead.
 *
 * @class Factory
 * @classdesc blah blah blah
 * @public
 */

/**
 * A class that represents an asset registry in the transaction processor API. The
 * transaction processor API should expose no internal properties or internal
 * methods which could be accessed or misused.
 * @private
 */
class Factory {

    /**
     * Constructor.
     * @param {Factory} factory The factory to use.
     * @private
     */
    constructor(factory) {
        const method = 'constructor';
        LOG.entry(method, factory);

        /**
         * Create a new Resource with a given namespace, type name and id
         * @public
         * @param {string} ns - the namespace of the Resource
         * @param {string} type - the type of the Resource
         * @param {string} id - the identifier
         * @return {Resource} the new instance
         * @throws {ModelException} if the type is not registered with the ModelManager
         */
        this.newInstance = function newInstance(ns, type, id) {
            return factory.newInstance(ns, type, id);
        };

        /**
         * Create a new Relationship with a given namespace, type and identifier.
    `    * A relationship is a typed pointer to an instance. I.e the relationship
         * with namespace = 'org.acme', type = 'Vehicle' and id = 'ABC' creates`
         * a pointer that points at an instance of org.acme.Vehicle with the id
         * ABC.
         *
         * @public
         * @param {string} ns - the namespace of the Resource
         * @param {string} type - the type of the Resource
         * @param {string} id - the identifier
         * @return {Relationship} - the new relationship instance
         * @throws {ModelException} if the type is not registered with the ModelManager
         */
        this.newRelationship = function newRelationship(ns, type, id) {
            return factory.newRelationship(ns, type, id);
        };

        Object.freeze(this);
        LOG.exit(method);
    }

}

module.exports = Factory;
