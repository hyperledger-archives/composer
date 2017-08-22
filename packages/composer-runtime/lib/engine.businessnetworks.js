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

const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const Context = require('./context');
const createHash = require('sha.js');
const Logger = require('composer-common').Logger;
const util = require('util');

const LOG = Logger.getLog('EngineBusinessNetworks');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 * @memberof module:composer-runtime
 */
class EngineBusinessNetworks {

    /**
     * Get the business network archive.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    getBusinessNetwork(context, args) {
        const method = 'getBusinessNetwork';
        LOG.entry(method, context, args);
        if (args.length !== 0) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getBusinessNetwork', []));
        }
        let dataService = context.getDataService();
        let sysdata;
        let resource;
        return dataService.getCollection('$sysdata')
            .then((result) => {
                sysdata = result;
                return sysdata.get('metanetwork');
            })
            .then((result) => {
                resource = context.getSerializer().fromJSON(result);
                return context.getAccessController().check(resource, 'READ');
            })
            .then(() => {
                // convert to resource and then check pmerssions.
                return sysdata.get('businessnetwork');
            })
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Undeploy the business network;
     * Doesn't actually undeploy the nework but merely puts it beyond use.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    undeployBusinessNetwork(context, args) {
        const method = 'undeployBusinessNetwork';
        LOG.entry(method, context, args);
        if (args.length !== 0) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, method, []));
        }
        let dataService = context.getDataService();
        let sysdata;
        return dataService.getCollection('$sysdata')
            .then((sysdata_) => {
                sysdata = sysdata_;
                return sysdata.get('metanetwork');
            })
            .then((result) => {
                let resource = context.getSerializer().fromJSON(result);
                return context.getAccessController().check(resource, 'DELETE');
            })
            .then(() => {
                // Validate the business network arsysregistrieschive and store it.
                return sysdata.get('businessnetwork');
            })
            .then((businessNetwork) => {
                businessNetwork.undeployed = true;
                return sysdata.update('businessnetwork', businessNetwork);
            })
            .then(() => {
                LOG.exit(method);
            });
    }


    /**
     * Update the business network archive.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    updateBusinessNetwork(context, args) {
        const method = 'updateBusinessNetwork';
        LOG.entry(method, context, args);
        if (args.length !== 1) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'updateBusinessNetwork', ['businessNetworkArchive']));
        }
        let dataService = context.getDataService();
        let businessNetworkBase64, businessNetworkHash, businessNetworkDefinition;
        let compiledScriptBundle, compiledQueryBundle, compiledAclBundle;
        let sysdata, resource;
        return dataService.getCollection('$sysdata')
            .then((result) => {
                sysdata = result;
                return sysdata.get('metanetwork');
            })
            .then((result) => {
                resource = context.getSerializer().fromJSON(result);
                return context.getAccessController().check(resource, 'UPDATE');
            })
            // return Promise.resolve()
            .then(() => {

                // Load, validate, and hash the business network definition.
                LOG.debug(method, 'Loading business network definition');
                businessNetworkBase64 = args[0];
                let businessNetworkArchive = Buffer.from(businessNetworkBase64, 'base64');
                let sha256 = createHash('sha256');
                businessNetworkHash = sha256.update(businessNetworkBase64, 'utf8').digest('hex');
                LOG.debug(method, 'Calculated business network definition hash', businessNetworkHash);
                return BusinessNetworkDefinition.fromArchive(businessNetworkArchive);

            })
            .then((businessNetworkDefinition_) => {

                // Cache the business network.
                businessNetworkDefinition = businessNetworkDefinition_;
                LOG.debug(method, 'Loaded business network definition, storing in cache');
                Context.cacheBusinessNetwork(businessNetworkHash, businessNetworkDefinition);

                // Cache the compiled script bundle.
                compiledScriptBundle = context.getScriptCompiler().compile(businessNetworkDefinition.getScriptManager());
                LOG.debug(method, 'Loaded compiled script bundle, storing in cache');
                Context.cacheCompiledScriptBundle(businessNetworkHash, compiledScriptBundle);

                // Cache the compiled query bundle.
                compiledQueryBundle = context.getQueryCompiler().compile(businessNetworkDefinition.getQueryManager());
                LOG.debug(method, 'Loaded compiled query bundle, storing in cache');
                Context.cacheCompiledQueryBundle(businessNetworkHash, compiledQueryBundle);

                // Cache the compiled ACL bundle.
                compiledAclBundle = context.getAclCompiler().compile(businessNetworkDefinition.getAclManager(), businessNetworkDefinition.getScriptManager());
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
                return context.initialize({
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
                let registryManager = context.getRegistryManager();
                return registryManager.createDefaults();

            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Reset the business network by clearing all data.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    resetBusinessNetwork(context, args) {
        const method = 'resetBusinessNetwork';
        LOG.entry(method, context, args);
        if (args.length !== 0) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'resetBusinessNetwork', []));
        }
        let dataService = context.getDataService();
        return dataService.getCollection('$sysregistries')
            .then((sysregistries) => {
                return sysregistries.getAll()
                    .then((registries) => {
                        return registries.reduce((cur, next) => {
                            return cur.then(() => {
                                let registryType = next.type;
                                let registryId = next.registryId;

                                LOG.debug(method, 'Deleting collection', registryType, registryId);
                                return dataService.deleteCollection(registryType + ':' + registryId)
                                    .then(() => {
                                        LOG.debug(method, 'Deleting record of collection from $sysregistries', registryType, registryId);
                                        return sysregistries.remove(registryType + ':' + registryId);
                                    });
                            });
                        }, Promise.resolve());
                    });
            })
            .then(() => {

                // Create the default transaction registry as it won't exist
                // in v1.0 if we queried it's existence it would still be there but
                // we know it isn't really.
                let registryManager = context.getRegistryManager();
                return registryManager.add('Transaction', 'default', 'Default Transaction Registry', true);

            })
            .then(() => {

                // Create all other default registries.
                LOG.debug(method, 'Creating default registries');
                let registryManager = context.getRegistryManager();

                // force creation of defaults as we know the don't exist
                return registryManager.createDefaults(true);

            })
            .then(() => {
                LOG.exit(method);
            });
    }

}

module.exports = EngineBusinessNetworks;
