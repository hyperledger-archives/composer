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

const Logger = require('composer-common').Logger;
const TransactionHandler = require('./transactionhandler');

const LOG = Logger.getLog('IdentityManager');

/**
 * A class for managing networks.
 * @protected
 */
class NetworkManager extends TransactionHandler {
    /**
     * Constructor.
     * @param {Context} context The request context.
     */
    constructor(context) {
        super();
        this.context = context;

        LOG.info('<ResourceManager>', 'Binding in the tx names and impl');
        this.bind(
            'org.hyperledger.composer.system.StartBusinessNetwork',
            this.startBusinessNetwork
        );
        this.bind(
            'org.hyperledger.composer.system.ResetBusinessNetwork',
            this.resetBusinessNetwork
        );
        this.bind(
            'org.hyperledger.composer.system.SetLogLevel',
            this.setLogLevel
        );
    }

    /**
     * Set the log level for the runtime.
     * @param {api} api The request context.
     * @param {Transaction} transaction The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    setLogLevel(api, transaction) {
        const method = 'setLogLevel';
        LOG.entry(method, transaction);
        let dataService = this.context.getDataService();
        let sysdata, resource;
        return dataService.getCollection('$sysdata')
            .then((result) => {
                sysdata = result;
                return sysdata.get('metanetwork');
            })
            .then((result) => {
                resource = this.context.getSerializer().fromJSON(result);
                return this.context.getAccessController().check(resource, 'UPDATE');
            })
            .then(() => {
                return this.context.getLoggingService().getLoggerCfg();
            })
            .then((cfg)=>{
                // ask the logging service to do a pre-assignment map to convert any runtime specific control strings
                let newLevel = this.context.getLoggingService().mapCfg(transaction.newLogLevel);
                let c =  Logger.setLoggerCfg(Object.assign(cfg,{debug:newLevel}),true);
                return this.context.getLoggingService().setLoggerCfg(c);
            });


    }

    /**
     * Start the business network archive.
     * @param {api} api The request context.
     * @param {Transaction} transaction The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    startBusinessNetwork(api, transaction) {
        const method = 'startBusinessNetwork';
        LOG.entry(method, transaction);
        LOG.exit(method);
        return Promise.resolve();
    }

    /**
     * Reset the business network by clearing all data.
     * @param {api} api The request context.
     * @param {Transaction} transaction The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    resetBusinessNetwork(api, transaction) {
        const method = 'resetBusinessNetwork';
        LOG.entry(method, transaction);
        let dataService = this.context.getDataService();

        let sysdata, resource;
        return dataService.getCollection('$sysdata')
            .then((result) => {
                sysdata = result;
                return sysdata.get('metanetwork');
            })
            .then((result) => {
                resource = this.context.getSerializer().fromJSON(result);
                return this.context.getAccessController().check(resource, 'UPDATE');
            })
            .then( ()=>{
                return this._resetRegistries( 'Asset');
            })
            .then(() => {
                return this._resetRegistries( 'Participant');
            })
            .then(() => {
                return this._resetRegistries( 'Transaction');
            })
            .then ( ()=> {
                // force creation of defaults as we know the don't exist
                // Create all other default registries.
                LOG.debug(method, 'Creating default registries');
                let registryManager = this.context.getRegistryManager();
                return registryManager.createDefaults(true);
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Reset all registries of the specified type by clearing all data.
     * @param {String} type of the registry to reset
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    _resetRegistries(type) {
        const method = '_resetRegistries';
        LOG.entry(method, type);
        let registryManager = this.context.getRegistryManager();
        return registryManager.getAll(type)
            .then((registries) => {
                return registries.reduce((promise, registry) => {
                    return promise.then(() => {
                        if (registry.system) {
                            LOG.debug(method, 'Not removing system registry', type, registry.id);
                            return;
                        }
                        LOG.debug(method, 'Removing registry', type, registry.id);
                        return registryManager.remove(type, registry.id);
                    });
                }, Promise.resolve());
            })
            .then(() => {
                LOG.exit(method);
            });
    }

}

module.exports = NetworkManager;
