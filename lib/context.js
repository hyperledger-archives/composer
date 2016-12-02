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

const Api = require('./api');
const BusinessNetworkDefinition = require('@ibm/ibm-concerto-common').BusinessNetworkDefinition;
const Logger = require('@ibm/ibm-concerto-common').Logger;
const LRU = require('lru-cache');
const QueryExecutor = require('./queryexecutor');
const RegistryManager = require('./registrymanager');
const Resolver = require('./resolver');

const LOG = Logger.getLog('Context');

const businessNetworkCache = LRU(8);

/**
 * A class representing the current request being handled by the JavaScript engine.
 * @protected
 * @abstract
 * @memberof module:ibm-concerto-runtime
 */
class Context {

    /**
     * Store a business network in the cache.
     * @param {string} businessNetworkHash The hash of the business network definition.
     * @param {BusinessNetworkDefinition} businessNetworkDefinition The business network definition.
     */
    static cacheBusinessNetwork(businessNetworkHash, businessNetworkDefinition) {
        const method = 'cacheBusinessNetwork';
        LOG.entry(method, businessNetworkHash, businessNetworkDefinition);
        businessNetworkCache.set(businessNetworkHash, businessNetworkDefinition);
        LOG.exit(method);
    }

    /**
     * Constructor.
     * @param {Engine} engine The chaincode engine that owns this context.
     */
    constructor(engine) {
        this.engine = engine;
        this.businessNetworkDefinition = null;
        this.transaction = null;
    }

    /**
     * Initialize the context for use.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    initialize() {
        const method = 'initialize';
        LOG.entry(method);

        // Load the business network from the archive.
        LOG.debug(method, 'Getting $sysdata collection');
        return this.getDataService().getCollection('$sysdata')
            .then((collection) => {
                LOG.debug(method, 'Getting business network archive from the $sysdata collection');
                return collection.get('businessnetwork');
            })
            .then((object) => {
                LOG.debug(method, 'Looking in cache for business network', object.hash);
                let businessNetworkDefinition = businessNetworkCache.get(object.hash);
                if (businessNetworkDefinition) {
                    LOG.debug(method, 'Business network is in cache');
                    return businessNetworkDefinition;
                }
                LOG.debug(method, 'Business network is not in cache, loading');
                let businessNetworkArchive = Buffer.from(object.data, 'base64');
                return BusinessNetworkDefinition.fromArchive(businessNetworkArchive)
                    .then((businessNetworkDefinition) => {
                        Context.cacheBusinessNetwork(object.hash, businessNetworkDefinition);
                        return businessNetworkDefinition;
                    });
            })
            .then((businessNetworkDefinition) => {
                LOG.debug(method, 'Loaded business network archive');
                this.businessNetworkDefinition = businessNetworkDefinition;
                LOG.exit(method);
            });

    }

    /**
     * Get the data service provided by the chaincode container.
     * @abstract
     * @return {DataService} The data service provided by the chaincode container.
     */
    getDataService() {
        throw new Error('abstract function called');
    }

    /**
     * Get the model manager.
     * @return {ModelManager} The model manager.
     */
    getModelManager() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getModelManager();
    }

    /**
     * Get the script manager.
     * @return {ScriptManager} The script manager.
     */
    getScriptManager() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getScriptManager();
    }

    /**
     * Get the factory.
     * @return {Factory} The factory.
     */
    getFactory() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getFactory();
    }

    /**
     * Get the serializer.
     * @return {Serializer} The serializer.
     */
    getSerializer() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getSerializer();
    }

    /**
     * Get the introspector.
     * @return {Introspector} The serializer.
     */
    getIntrospector() {
        if (!this.businessNetworkDefinition) {
            throw new Error('must call initialize before calling this function');
        }
        return this.businessNetworkDefinition.getIntrospector();
    }

    /**
     * Get the registry manager.
     * @return {RegistryManager} The registry manager.
     */
    getRegistryManager() {
        if (!this.registryManager) {
            this.registryManager = new RegistryManager(this.getDataService(), this.getIntrospector(), this.getSerializer());
        }
        return this.registryManager;
    }

    /**
     * Get the resolver.
     * @return {Resolver} The resolver.
     */
    getResolver() {
        if (!this.resolver) {
            this.resolver = new Resolver(this.getIntrospector(), this.getRegistryManager());
        }
        return this.resolver;
    }

    /**
     * Get the API.
     * @return {Api} The API.
     */
    getApi() {
        if (!this.api) {
            this.api = new Api(this.getFactory(), this.getRegistryManager());
        }
        return this.api;
    }

    /**
     * Get the query executor.
     * @return {QueryExecutor} The query executor.
     */
    getQueryExecutor() {
        if (!this.queryExecutor) {
            this.queryExecutor = new QueryExecutor(this.getResolver());
        }
        return this.queryExecutor;
    }

    /**
     * Get the current transaction.
     * @return {Resource} the current transaction.
     */
    getTransaction() {
        return this.transaction;
    }

    /**
     * Set the current transaction.
     * @param {Resource} transaction the current transaction.
     */
    setTransaction(transaction) {
        this.transaction = transaction;
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

}

module.exports = Context;
