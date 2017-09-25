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
        let sysregistries;

        // first thing is to check that the current participant has delete permission before resetting the network
        return dataService.getCollection('$sysdata')
        .then((sysdata) => {
            return sysdata.get('metanetwork');
        })
        .then((result) => {
            let resource = context.getSerializer().fromJSON(result);
            return context.getAccessController().check(resource, 'DELETE');
        })
        .then(()=>{
            return dataService.getCollection('$sysregistries');
        })
        .then((sysregistries_) => {
            sysregistries = sysregistries_;
            return sysregistries.getAll();
        })
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

        })
            .then ( ()=> {
                // force creation of defaults as we know the don't exist
                // Create all other default registries.
                LOG.debug(method, 'Creating default registries');
                let registryManager = context.getRegistryManager();
                return registryManager.createDefaults(true);

            })
            .then(() => {
                LOG.exit(method);
            });
    }

}

module.exports = EngineBusinessNetworks;
