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

const jsonpatch = require('fast-json-patch');
const Logger = require('@ibm/concerto-common').Logger;

const LOG = Logger.getLog('TransactionLogger');

/**
 * A class for logging the changes made by a transaction.
 * @protected
 * @abstract
 * @memberof module:concerto-runtime
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
        LOG.exit();
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
            convertResourcesToRelationships: true
        });
        LOG.debug(method, 'Serialized old resource');
        let newJSON = this.serializer.toJSON(event.newResource, {
            convertResourcesToRelationships: true
        });
        LOG.debug(method, 'Serialized new resource');

        // Generate a JSON Patch from the two resources.
        let patches = jsonpatch.compare(oldJSON, newJSON);
        LOG.debug(method, 'Generated JSON Patch', patches);

        LOG.exit();
    }

    /**
     * Handle a resource being added to a registry.
     * @param {Registry#resourceremoved} event The resource added event.
     */
    onResourceRemoved(event) {
        const method = 'onResourceRemoved';
        LOG.entry(method, event);
        LOG.exit();
    }

}

module.exports = TransactionLogger;
