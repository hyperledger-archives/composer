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

const AclCompiler = require('./aclcompiler');
const AccessController = require('./accesscontroller');
const Api = require('./api');
const IdentityManager = require('./identitymanager');
const Logger = require('composer-common').Logger;
const QueryCompiler = require('./querycompiler');
const RegistryManager = require('./registrymanager');
const ResourceManager = require('./resourcemanager');
const Resolver = require('./resolver');
const TransactionLogger = require('./transactionlogger');
const uuid = require('uuid');

const LOG = Logger.getLog('Context');

/**
 * A class representing the current request being handled by the JavaScript engine.
 * @protected
 * @abstract
 * @memberof module:composer-runtime
 */
class Context {
    /**
     * Constructor.
     * @param {Engine} engine The chaincode engine that owns this context.
     * @param {InstalledBusinessNetwork} installedBusinessNetwork Information associated with the installed business network
     */
    constructor(engine, installedBusinessNetwork) {
        if (!installedBusinessNetwork) {
            throw new Error('No business network specified');
        }

        this.engine = engine;
        this.installedBusinessNetwork = installedBusinessNetwork;
        this.eventNumber = 0;
        this.contextId = uuid.v4();
        this.historianEnabled = installedBusinessNetwork.historianEnabled;
    }

    /**
     * Get the name of the currently executing runtime method.
     * @return {string} The name of the currently executing runtime method.
     */
    getFunction() {
        return this.function;
    }

    /**
     * Get the arguments for the currently executing runtime method.
     * @return {string} The arguments for the currently executing runtime method.
     */
    getArguments() {
        return this.arguments;
    }

    /**
     * Load the current participant.
     * @return {Promise} A promise that will be resolved with a {@link Resource}
     * when complete, or rejected with an error.
     */
    async loadCurrentParticipant() {
        const method = 'loadCurrentParticipant';
        LOG.entry(method);

        // Load the current identity.
        const identity = await this.getIdentityManager().getIdentity();
        // Validate the identity.
        try {
            this.setIdentity(identity);
            this.getIdentityManager().validateIdentity(identity);
        } catch (e) {
            // Is this an activation transaction?
            let isActivation = false;
            try {
                if (this.getFunction() === 'submitTransaction') {
                    const json = JSON.parse(this.getArguments()[0]);
                    isActivation = json.$class === 'org.hyperledger.composer.system.ActivateCurrentIdentity';
                }
            } catch (e) {
                // Ignore.
            }

            // Check for the case of activation required, and the user is trying to activate.
            if (e.activationRequired && isActivation) {
                // Don't throw the error as we are activating the identity, but return null
                // so that the participant is not set because there is no current participant
                // until the identity is activated and not revoked.
                LOG.exit(method, null);
                return null;
            } else {
                throw e;
            }
        }

        // Load the current participant.
        const participant = await this.getIdentityManager().getParticipant(identity);

        LOG.exit(method, participant);
        return participant;
    }

    /**
     * Initialize the context for use.
     * @param {Object} [options] The options to use.
     * @param {string} [options.function] The name of the currently executing runtime method.
     * @param {string} [options.arguments] The arguments for the currently executing runtime method.
     * @param {Container} [options.container] The chaincode container in which the transactions is running
     * @param {DataCollection} [options.sysregistries] The system registries collection to use.
     */
    async initialize(options) {
        const method = 'initialize';
        LOG.entry(method, options);

        options = options || {};
        this.function = options.function || this.function;
        this.arguments = options.arguments || this.arguments;
        this.container = options.container;

        LOG.debug(method, 'Loading sysregistries collection', options.sysregistries);
        this.sysregistries = options.sysregistries || await this.getDataService().getCollection('$sysregistries', true);

        if (options.function === 'init') {
            // No point loading the participant as no participants exist!
            LOG.debug(method, 'Not loading current participant as processing deployment');
        } else {
            LOG.debug(method, 'Loading current participant');
            const participant = await this.loadCurrentParticipant();
            LOG.debug(method, 'Setting current participant', participant);
            this.setParticipant(participant);
        }

        if (this.container) {
            this.loggingService = this.container.getLoggingService();
        }

        this.getSerializer().setDefaultOptions({ permitResourcesForRelationships: true });

        LOG.exit(method);
    }

    /**
     * Get all of the services provided by the chaincode container.
     * @return {Service[]} All of the services provided by the chaincode container.
     */
    getServices() {
        return [
            this.getDataService(),
            this.getEventService(),
            this.getIdentityService(),
            this.getHTTPService()
        ];
    }
    /**
     * Get the container.
     * @return {Container} The container.
     */
    getContainer() {
        return this.container;
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
     * Get the identity service provided by the chaincode container.
     * @abstract
     * @return {IdentityService} The identity service provided by the chaincode container.
     */
    getIdentityService() {
        throw new Error('abstract function called');
    }

    /**
     * Get the http service provided by the chaincode container.
     * @abstract
     * @return {HTTPService} The http service provided by the chaincode container.
     */
    getHTTPService() {
        throw new Error('abstract function called');
    }

    /**
     * Get the serializer.
     * @return {Serializer} The serializer.
     */
    getSerializer() {
        return this.installedBusinessNetwork.getDefinition().getSerializer();
    }
    /**
     * Get the event service provided by the chaincode container.
     * @abstract
     * @return {EventService} The event service provided by the chaincode container.
     */
    getEventService() {
        throw new Error('abstract function called');
    }

    /**
     * Get the model manager.
     * @return {ModelManager} The model manager.
     */
    getModelManager() {
        return this.installedBusinessNetwork.getDefinition().getModelManager();
    }

    /**
     * Get the script manager.
     * @return {ScriptManager} The script manager.
     */
    getScriptManager() {
        return this.installedBusinessNetwork.getDefinition().getScriptManager();
    }

    /**
     * Get the ACL manager.
     * @return {AclManager} The ACL manager.
     */
    getAclManager() {
        return this.installedBusinessNetwork.getDefinition().getAclManager();
    }

    /**
     * Get the factory.
     * @return {Factory} The factory.
     */
    getFactory() {
        return this.installedBusinessNetwork.getDefinition().getFactory();
    }


    /**
     * Get the introspector.
     * @return {Introspector} The serializer.
     */
    getIntrospector() {
        return this.installedBusinessNetwork.getDefinition().getIntrospector();
    }

    /**
     * Get the registry manager.
     * @return {RegistryManager} The registry manager.
     */
    getRegistryManager() {
        if (!this.registryManager) {
            // TODO: This method call is getting too long.
            this.registryManager = new RegistryManager(
                this.getDataService(),
                this.getIntrospector(),
                this.getSerializer(),
                this.getAccessController(),
                this.getSystemRegistries(),
                this.getFactory());
        }
        return this.registryManager;
    }

    /**
     * Get the resolver.
     * @return {Resolver} The resolver.
     */
    getResolver() {
        if (!this.resolver) {
            this.resolver = new Resolver(this.getFactory(), this.getIntrospector(), this.getRegistryManager());
        }
        return this.resolver;
    }

    /**
     * Get the API.
     * @return {Api} The API.
     */
    getApi() {
        if (!this.api) {
            this.api = new Api(this);
        }
        return this.api;
    }

    /**
     * Get the identity manager.
     * @return {IdentityManager} The identity manager.
     */
    getIdentityManager() {
        if (!this.identityManager) {
            this.identityManager = new IdentityManager(this);
        }
        return this.identityManager;
    }

    /**
     * Get the resource manager.
     * @return {ResourceManager} The resource manager.
     */
    getResourceManager() {
        if (!this.resourceManager) {
            this.resourceManager = new ResourceManager(this);
        }
        return this.resourceManager;
    }

        /**
     * Get the network manager.
     * @return {NetworkManager} The network manager.
     */
    getNetworkManager() {
        if (!this.networkManager) {
            const NetworkManager = require('./networkmanager');
            this.networkManager = new NetworkManager(this);
        }
        return this.networkManager;
    }

    /**
     * Get the current participant.
     * @return {Resource} the current participant.
     */
    getParticipant() {
        return this.participant;
    }

    /**
     * Set the current participant.
     * @param {Resource} participant the current participant.
     */
    setParticipant(participant) {
        if (this.participant) {
            throw new Error('A current participant has already been specified');
        }
        this.participant = participant;
        this.getAccessController().setParticipant(participant);
    }


    /**
     * Get the current identity.
     * @return {Resource} the current identity.
     */
    getIdentity() {
        return this.currentIdentity;
    }

    /**
     * Set the current identity.
     * @param {Resource} currentIdentity the current identity.
     */
    setIdentity(currentIdentity) {
        if (this.currentIdentity) {
            throw new Error('A current identity has already been specified');
        }
        this.currentIdentity = currentIdentity;
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
        if (this.transaction) {
            throw new Error('A current transaction has already been specified');
        }
        this.transaction = transaction;
        this.transactionLogger = new TransactionLogger(this.transaction, this.getRegistryManager(), this.getSerializer());
        this.getAccessController().setTransaction(transaction);
    }

    /**
     * Clear the current transaction.
     */
    clearTransaction() {
        this.transaction = null;
        this.transactionLogger = null;
        this.getAccessController().setTransaction(null);
    }

    /**
     * Get the access controller.
     * @return {AccessController} The access controller.
     */
    getAccessController() {
        if (!this.accessController) {
            this.accessController = new AccessController(this);
        }
        return this.accessController;
    }

    /**
     * Get the system registries collection.
     * @return {DataCollection} The system registries collection.
     */
    getSystemRegistries() {
        if (!this.sysregistries) {
            throw new Error('must call initialize before calling this function');
        }
        return this.sysregistries;
    }

    /**
     * Get the next event number
     * @return {integer} the event number.
     */
    getEventNumber() {
        return this.eventNumber;
    }

    /**
     * Incrememnt the event number by 1
     * @return {integer} the event number.
     */
    incrementEventNumber() {
        return this.eventNumber++;
    }

    /**
     * Returns the installed business network definition
     * @returns {BusinessNetworkDefinition} business network definition
    */
    getBusinessNetworkDefinition() {
        return this.installedBusinessNetwork.getDefinition();
    }

    /**
     * Get the installed business network as an archive.
     * @return {Buffer} business network archive.
     */
    getBusinessNetworkArchive() {
        return this.installedBusinessNetwork.getArchive();
    }

    /**
     * Get the compiled script bundle.
     * @return {CompiledScriptBundle} compiledScriptBundle The compiled script bundle.
     */
    getCompiledScriptBundle() {
        return this.installedBusinessNetwork.getCompiledScriptBundle();
    }

    /**
     * Get the query compiler.
     * @return {QueryCompiler} queryCompiler The query compiler.
     */
    getQueryCompiler() {
        if (!this.queryCompiler) {
            this.queryCompiler = new QueryCompiler();
        }
        return this.queryCompiler;
    }

    /**
     * Get the compiled query bundle.
     * @return {CompiledQueryBundle} The compiled query bundle.
     */
    getCompiledQueryBundle() {
        return this.installedBusinessNetwork.getCompiledQueryBundle();
    }

    /**
     * Get the ACL compiler.
     * @return {AclCompiler} aclCompiler The ACL compiler.
     */
    getAclCompiler() {
        if (!this.aclCompiler) {
            this.aclCompiler = new AclCompiler();
        }
        return this.aclCompiler;
    }

    /**
     * Get the compiled ACL bundle.
     * @return {CompiledAclBundle} The compiled ACL bundle.
     */
    getCompiledAclBundle() {
        return this.installedBusinessNetwork.getCompiledAclBundle();
    }

    /** Obtains the logging service
     *@return {LoggingService} the logging service
     */
    getLoggingService(){
        return this.loggingService;
    }

    /**
     * Get the list of transaction handlers.
     * @return {TransactionHandler[]} The list of transaction handlers.
     */
    getTransactionHandlers() {
        return [
            this.getIdentityManager(),
            this.getResourceManager(),
            this.getNetworkManager()
        ];
    }

    /**
     * Called at the start of a transaction.
     * @param {boolean} readOnly Is the transaction read-only?
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionStart(readOnly) {
        const services = this.getServices();
        return services.reduce((promise, service) => {
            return promise.then(() => {
                return service.transactionStart(readOnly);
            });
        }, Promise.resolve());
    }

    /**
     * Called when a transaction is preparing to commit.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionPrepare() {
        const services = this.getServices();
        return services.reduce((promise, service) => {
            return promise.then(() => {
                return service.transactionPrepare();
            });
        }, Promise.resolve());
    }

    /**
     * Called when a transaction is rolling back.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionRollback() {
        const services = this.getServices();
        return services.reduce((promise, service) => {
            return promise.then(() => {
                return service.transactionRollback();
            });
        }, Promise.resolve());
    }

    /**
     * Called when a transaction is committing.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionCommit() {
        const services = this.getServices();
        return services.reduce((promise, service) => {
            return promise.then(() => {
                return service.transactionCommit();
            });
        }, Promise.resolve());
    }

    /**
     * Called at the end of a transaction.
     * @abstract
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionEnd() {
        const services = this.getServices();
        return services.reduce((promise, service) => {
            return promise.then(() => {
                return service.transactionEnd();
            });
        }, Promise.resolve());
    }

    /**
     * Get the native api
     * @abstract
     * @return {NativeAPI} the native api for a particular runtime
     */
    getNativeAPI() {
        throw new Error('abstract function called');
    }

    /**
     * return the current context id
     * @returns {string} the context id
     */
    getContextId() {
        return this.contextId;
    }

    /**
     * set the current context id
     * @param {string} contextId The contextId
     */
    setContextId(contextId) {
        this.contextId = contextId;
    }

}

module.exports = Context;
