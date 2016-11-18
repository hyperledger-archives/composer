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

const ModelManager = require('./modelmanager');
const Introspector = require('./introspect/introspector');
const Factory = require('./factory');
const Serializer = require('./serializer');
const ScriptManager = require('./scriptmanager');

/**
 * <p>
 * A BusinessNetwork defines a set of Participants that exchange Assets by
 * sending Transactions. This class manages the metadata and domain-specific types for
 * the network as well as a set of executable scripts.
 * </p>
 */
class BusinessNetwork {

    /**
     * Create the BusinessNetwork.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link BusinessNetwork.fromArchive}</strong>
     * </p>
     * @param {String} identifier  - the identifier of the business network
     */
    constructor(identifier) {
        this.identifier = identifier;
        this.modelManager = new ModelManager();
        this.scriptManager = new ScriptManager(this.modelManager);
        this.introspector = new Introspector(this.modelManager);
        this.factory = new Factory(this.modelManager);
        this.serializer = new Serializer(this.factory, this.modelManager);
    }

    /**
     * Returns the identifier for this business network
     * @return {String} the identifier of this business network
     */
    getIdentifier() {
        return this.identifier;
    }

    /**
     * Create a BusinessNetwork from an archive.
     * @param {Buffer} buffer  - the zlib buffer
     * @return {BusinessNetwork} the instantiated business network
     */
    static fromArchive(buffer) {
        // TODO (DCS)
        // Need to walk the archive and pull out
        // identifier
        // model files, adding them to the ModelManager
        // ..
        // then
        // walk the archive pulling out the scripts
        // and add them to the ScriptManager
        return new BusinessNetwork('identifier');
    }

    /**
     * Store a BusinessNetwork as an archive.
     * @param {Buffer} buffer  - the zlib buffer
     */
    toArchive(buffer) {
      // TODO (DCS) implement the archive persistence
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
     * Provides access to the Introspector for this business network. The Introspector
     * is used to reflect on the types defined within this business network.
     * @return {Introspector} the Introspector for this business network
     */
    getIntrospector() {
        return this.introspector;
    }

    /**
     * Provides access to the Factory for this business network. The Factory
     * is used to create the types defined in this business network.
     * @return {Factory} the Factory for this business network
     */
    getFactory() {
        return this.factory;
    }

    /**
     * Provides access to the Serializer for this business network. The Serializer
     * is used to serialize instances of the types defined within this business network.
     * @return {Serializer} the Serializer for this business network
     */
    getSerializer() {
        return this.serializer;
    }

    /**
     * Provides access to the ScriptManager for this business network. The ScriptManager
     * manage access to the scripts that have been defined within this business network.
     * @return {ScriptManager} the ScriptManager for this business network
     * @private
     */
    getScriptManager() {
        return this.scriptManager;
    }

    /**
     * Provides access to the ModelManager for this business network. The ModelManager
     * manage access to the models that have been defined within this business network.
     * @return {ModelManager} the ModelManager for this business network
     * @private
     */
    getModelManager() {
        return this.modelManager;
    }
}

module.exports = BusinessNetwork;
