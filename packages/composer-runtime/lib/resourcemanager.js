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

// Do not add additional types to these constants. All system types are assets.
const TYPE_MAP = {
    AssetRegistry: 'Asset',
    ParticipantRegistry: 'Participant',
    TransactionRegistry : 'Transaction',
    Network : 'Network'
};

/**
 * A class for managing and persisting identities.
 * @protected
 */
class ResourceManager extends TransactionHandler {
    /**
     * Constructor.
     * @param {Context} context The request context.
     */
    constructor(context) {
        super();
        const method = 'constructor';
        LOG.entry(method, context);
        this.registryManager = context.getRegistryManager();
        this.bind(
            'org.hyperledger.composer.system.AddAsset',
            this.addResources
        );
        this.bind(
            'org.hyperledger.composer.system.RemoveAsset',
            this.removeResources
        );
        this.bind(
            'org.hyperledger.composer.system.UpdateAsset',
            this.updateResources
        );
        this.bind(
            'org.hyperledger.composer.system.AddParticipant',
            this.addResources
        );
        this.bind(
            'org.hyperledger.composer.system.RemoveParticipant',
            this.removeResources
        );
        this.bind(
            'org.hyperledger.composer.system.UpdateParticipant',
            this.updateResources
        );
        LOG.exit(method);
    }

    /**
     * The org.hyperledger.composer.system.AddAllResources transaction
     * @param {Api} api The API to use.
     * @param {org.hyperledger.composer.system.IssueIdentity} transaction The transaction.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    addResources(api, transaction) {
        const method = 'addResources';
        LOG.entry(method, transaction.registryType, transaction.registryId);
        const registryType = TYPE_MAP[transaction.targetRegistry.getType()];
        const registryId = transaction.targetRegistry.getIdentifier();
        return this.registryManager.get(registryType, registryId)
            .then(registry => {
                return registry.addAll(transaction.resources,{ convertResourcesToRelationships: true });
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * The org.hyperledger.composer.system.AddAllResources transaction
     * @param {Api} api The API to use.
     * @param {org.hyperledger.composer.system.IssueIdentity} transaction The transaction.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    updateResources(api, transaction) {
        const method = 'updateResources';
        LOG.entry(method, transaction.registryType, transaction.registryId);
        const registryType = TYPE_MAP[transaction.targetRegistry.getType()];
        const registryId = transaction.targetRegistry.getIdentifier();
        return this.registryManager.get(registryType, registryId)
            .then(registry => {
                return registry.updateAll(transaction.resources,{ convertResourcesToRelationships: true });
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
      * The org.hyperledger.composer.system.AddAllResources transaction
      * @param {Api} api The API to use.
      * @param {org.hyperledger.composer.system.IssueIdentity} transaction The transaction.
      * @return {Promise} A promise that will be resolved when complete, or rejected
      * with an error.
      */
    removeResources(api, transaction) {
        const method = 'removeResources';
        LOG.entry(method, transaction.registryType, transaction.registryId);
        const registryType = TYPE_MAP[transaction.targetRegistry.getType()];
        const registryId = transaction.targetRegistry.getIdentifier();
        return this.registryManager.get(registryType, registryId)
            .then(registry => {
                return registry.removeAll(transaction.resourceIds);
            })
            .then(() => {
                LOG.exit(method);
            });
    }
}

module.exports = ResourceManager;
