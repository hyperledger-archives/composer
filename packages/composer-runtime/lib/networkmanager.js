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
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const LOG = Logger.getLog('IdentityManager');
const createHash = require('sha.js');



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
            'org.hyperledger.composer.system.UpdateBusinessNetwork',
            this.updateBusinessNetwork
        );

    }

    /**
     * Update the business network archive.
     * @param {api} api The request context.
     * @param {Transaction} transaction The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    updateBusinessNetwork(api, transaction) {
       
        const method = 'updateBusinessNetwork';
        LOG.entry(method, transaction);

        const Context = require('./context');
        // if (args.length !== 1) {
        //     LOG.error(method, 'Invalid arguments', args);
        //     throw new Error('Inavblid arguements');
        //     //util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'updateBusinessNetwork', ['businessNetworkArchive'])
        // }
        let dataService = this.context.getDataService();
        let businessNetworkBase64, businessNetworkHash, businessNetworkDefinition;
        let compiledScriptBundle, compiledQueryBundle, compiledAclBundle;
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
            // return Promise.resolve()
            .then(() => {

                // Load, validate, and hash the business network definition.
                LOG.debug(method, 'Loading business network definition');
                businessNetworkBase64 = transaction.businessNetworkArchive;
                let businessNetworkArchive = Buffer.from(businessNetworkBase64, 'base64');
                let sha256 = createHash('sha256');
                businessNetworkHash = sha256.update(businessNetworkBase64, 'utf8').digest('hex');
                LOG.debug(method, 'Calculated business network definition hash', businessNetworkHash);
                return BusinessNetworkDefinition.fromArchive(businessNetworkArchive);

            })
            .then((businessNetworkDefinition_) => {

                // // Cache the business network.
                businessNetworkDefinition = businessNetworkDefinition_;
                LOG.debug(method, 'Loaded business network definition, storing in cache');
                Context.cacheBusinessNetwork(businessNetworkHash, businessNetworkDefinition);

                // Cache the compiled script bundle.
                compiledScriptBundle = this.context.getScriptCompiler().compile(businessNetworkDefinition.getScriptManager());
                LOG.debug(method, 'Loaded compiled script bundle, storing in cache');
                Context.cacheCompiledScriptBundle(businessNetworkHash, compiledScriptBundle);

                // Cache the compiled query bundle.
                compiledQueryBundle = this.context.getQueryCompiler().compile(businessNetworkDefinition.getQueryManager());
                LOG.debug(method, 'Loaded compiled query bundle, storing in cache');
                Context.cacheCompiledQueryBundle(businessNetworkHash, compiledQueryBundle);

                // Cache the compiled ACL bundle.
                compiledAclBundle = this.context.getAclCompiler().compile(businessNetworkDefinition.getAclManager(), businessNetworkDefinition.getScriptManager());
                LOG.debug(method, 'Loaded compiled ACL bundle, storing in cache');
                Context.cacheCompiledAclBundle(businessNetworkHash, compiledAclBundle);

                // Get the sysdata collection where the business network definition is stored.
                LOG.debug(method, 'Loaded business network definition, storing in $sysdata collection');

                // Update the business network definition in the sysdata collection.
                return sysdata.update('businessnetwork', {
                    data: businessNetworkBase64,
                    hash: businessNetworkHash
                });

            })
            .then(() => {

                // Reinitialize the context to reload the business network.
                LOG.debug(method, 'Reinitializing context');
                return this.context.initialize({
                    businessNetworkDefinition: businessNetworkDefinition,
                    compiledScriptBundle: compiledScriptBundle,
                    compiledQueryBundle: compiledQueryBundle,
                    compiledAclBundle: compiledAclBundle,
                    reinitialize: true
                });

            })
            .then(() => {

                // Create all other default registries.
                LOG.debug(method, 'Creating default registries');
                let registryManager = this.context.getRegistryManager();
                return registryManager.createDefaults();

            })
            .then(() => {
                LOG.exit(method);
            });

    }

}

module.exports = NetworkManager;
