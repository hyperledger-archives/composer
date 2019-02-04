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

const jsonpatch = require('fast-json-patch');
const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('TransactionLogger');

/* istanbul ignore next */
/**
 * A class for logging the changes made by a transaction.
 * @protected
 * @abstract
 * @memberof module:composer-runtime
 */
class TransactionLogger {

    /**
     * Create a logger for the specified transaction.
     * @param {Resource} transaction The transaction.
     * @param {RegistryManager} registryManager The registry manager.
     * @param {Serializer} serializer The serializer.
     */
    constructor(transaction, registryManager, serializer) {
        const method = 'constructor';
        LOG.entry(method, transaction, registryManager, serializer);
        this.transaction = transaction;
        this.registryManager = registryManager;
        this.serializer = serializer;
        registryManager.on('resourceadded', this.onResourceAdded.bind(this));
        registryManager.on('resourceupdated', this.onResourceUpdated.bind(this));
        registryManager.on('resourceremoved', this.onResourceRemoved.bind(this));
        LOG.exit(method);
    }

    /**
     * Handle a resource being added to a registry.
     * @param {Registry#resourceadded} event The resource added event.
     */
    onResourceAdded(event) {
        const method = 'onResourceAdded';
        LOG.entry(method, event);
        LOG.exit(method);
    }

    /**
     * Handle a resource being added to a registry.
     * @param {Registry#resourceupdated} event The resource added event.
     */
    onResourceUpdated(event) {
        const method = 'onResourceUpdated';
        LOG.entry(method, event);

        // Serialize both the old and new resources.
        let oldJSON = this.serializer.toJSON(event.oldResource, {
            convertResourcesToRelationships: true,
            validate: false
        });
        LOG.debug(method, 'Serialized old resource');
        let newJSON = this.serializer.toJSON(event.newResource, {
            convertResourcesToRelationships: true,
            validate: false
        });
        LOG.debug(method, 'Serialized new resource');

        // Generate a JSON Patch from the two resources.
        let patches = jsonpatch.compare(oldJSON, newJSON);
        LOG.debug(method, 'Generated JSON Patch', patches);

        LOG.exit(method);
    }

    /**
     * Handle a resource being added to a registry.
     * @param {Registry#resourceremoved} event The resource added event.
     */
    onResourceRemoved(event) {
        const method = 'onResourceRemoved';
        LOG.entry(method, event);
        LOG.exit(method);
    }

}

module.exports = TransactionLogger;
