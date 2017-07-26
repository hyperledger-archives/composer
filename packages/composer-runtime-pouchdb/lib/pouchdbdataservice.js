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

const DataService = require('composer-runtime').DataService;
const Logger = require('composer-common').Logger;
const pouchCollate = require('pouchdb-collate');
const PouchDB = require('pouchdb-core');
const PouchDBDataCollection = require('./pouchdbdatacollection');
const PouchDBUtils = require('./pouchdbutils');

const LOG = Logger.getLog('PouchDBDataService');

// Install the PouchDB plugins. The order of the adapters is important!
PouchDB.plugin(require('pouchdb-find'));

// This is the object type used to form composite keys for the collection of collections.
const collectionObjectType = '$syscollections';

/**
 * Base class representing the data service provided by a {@link Container}.
 * @protected
 */
class PouchDBDataService extends DataService {

    /**
     * Register the specified PouchDB plugin with PouchDB.
     * @param {*} plugin The PouchDB plugin to register.
     */
    static registerPouchDBPlugin(plugin) {
        // No logging here as this is called during static initialization
        // at startup, and we don't want to try and load the logger yet.
        PouchDB.plugin(plugin);
    }

    /**
     * Create a new instance of PouchDB.
     * @param {string} name The name of the PouchDB database.
     * @param {Object} [options] Optional options for PouchDB.
     * @return {PouchDB} The new instance of PouchDB.
     */
    static createPouchDB(name, options) {
        const method = 'createPouchDB';
        LOG.entry(method, name, options);
        let result = new PouchDB(name, options);
        LOG.exit(method, result);
        return result;
    }

    /**
     * Constructor.
     * @param {string} [uuid] The UUID of the container.
     * @param {boolean} [autocommit] Should this data service auto commit?
     * @param {Object} [options] Optional options for PouchDB.
     */
    constructor(uuid, autocommit, options) {
        super();
        const method = 'constructor';
        LOG.entry(method, uuid, autocommit, options);
        if (uuid) {
            this.db = PouchDBDataService.createPouchDB(`Composer:${uuid}`, options);
        } else {
            this.db = PouchDBDataService.createPouchDB('Composer', options);
        }
        this.autocommit = !!autocommit;
        this.pendingActions = [];
        LOG.exit(method);
    }

    /**
     * Destroy the database.
     * @return {Promise} A promise that will be resolved when destroyed, or
     * rejected with an error.
     */
    destroy() {
        const method = 'destroy';
        LOG.entry(method);
        return this.db.destroy()
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Create a collection with the specified ID.
     * @param {string} id The ID of the collection.
     * @param {force} [force] force creation, don't check for existence first.
     * @return {Promise} A promise that will be resolved with a {@link DataCollection}
     * when complete, or rejected with an error.
     */
    createCollection(id, force) {
        const method = 'createCollection';
        LOG.entry(method, id, force);
        const key = pouchCollate.toIndexableString([collectionObjectType, id]);
        return PouchDBUtils.getDocument(this.db, key)
            .then((doc) => {
                if (doc && !force) {
                    throw new Error(`Failed to add collection with ID '${id}' as the collection already exists`);
                }
                return this.handleAction(() => {
                    return PouchDBUtils.putDocument(this.db, key, {});
                });
            })
            .then(() => {
                let result = new PouchDBDataCollection(this, this.db, id);
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Delete a collection with the specified ID.
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    deleteCollection(id) {
        const method = 'deleteCollection';
        LOG.entry(method, id);
        const key = pouchCollate.toIndexableString([collectionObjectType, id]);
        return PouchDBUtils.getDocument(this.db, key)
            .then((doc) => {
                if (!doc) {
                    throw new Error(`Collection with ID '${id}' does not exist`);
                }
                return this.handleAction(() => {
                    return this.clearCollection(id)
                        .then(() => {
                            return PouchDBUtils.removeDocument(this.db, key);
                        });
                });
            })
            .then(() => {
                LOG.exit(method);
            });
    }

   /**
    * Get the collection with the specified ID.
    * @param {string} id The ID of the collection.
    * @return {Promise} A promise that will be resolved with a {@link DataCollection}
    * when complete, or rejected with an error.
    */
    getCollection(id) {
        const method = 'getCollection';
        LOG.entry(method, id);
        const key = pouchCollate.toIndexableString([collectionObjectType, id]);
        return PouchDBUtils.getDocument(this.db, key)
            .then((doc) => {
                if (!doc) {
                    throw new Error(`Collection with ID '${id}' does not exist`);
                }
                let result = new PouchDBDataCollection(this, this.db, id);
                LOG.exit(method, result);
                return result;
            });
    }

   /**
    * Determine whether the collection with the specified ID exists.
    * @param {string} id The ID of the collection.
    * @return {Promise} A promise that will be resolved with a boolean
    * indicating whether the collection exists.
    */
    existsCollection(id) {
        const method = 'existsCollection';
        LOG.entry(method, id);
        const key = pouchCollate.toIndexableString([collectionObjectType, id]);
        return PouchDBUtils.getDocument(this.db, key)
            .then((doc) => {
                LOG.exit(method, !!doc);
                return !!doc;
            });
    }

    /**
     * Execute a query across all objects stored in all collections, using a query
     * string that is dependent on the current Blockchain platform.
     * @param {string} queryString The query string for the current Blockchain platform.
     * @return {Promise} A promise that will be resolved with an array of objects
     * when complete, or rejected with an error.
     */
    executeQuery(queryString) {
        const method = 'executeQuery';
        LOG.entry(method, queryString);
        const query = JSON.parse(queryString);
        return this.db.find(query)
            .then((response) => {
                const docs = response.docs.map((doc) => {
                    delete doc._id;
                    delete doc._rev;
                    return doc;
                });
                LOG.exit(method, docs);
                return docs;
            });
    }

    /**
     * Remove all objects from the specified collection.
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    clearCollection(id) {
        const method = 'clearCollection';
        LOG.entry(method, id);
        const startKey = pouchCollate.toIndexableString([id]);
        const endKey = pouchCollate.toIndexableString([id, '\uffff']);
        return this.db.allDocs({ startkey: startKey, endkey: endKey, inclusive_end: false })
            .then((response) => {
                const docs = response.rows.map((row) => {
                    return {
                        _id: row.id,
                        _rev: row.value.rev,
                        _deleted: true
                    };
                });
                return this.db.bulkDocs(docs);
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Handle an action against this data service. If auto commit is enabled, then
     * the action will be instantly executed. Otherwise it will be queued until the
     * transaction is prepared.
     * @param {Function} actionFunction The function implementing the acyion.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    handleAction(actionFunction) {
        const method = 'handleAction';
        LOG.entry(method, actionFunction);
        return Promise.resolve()
            .then(() => {
                if (this.autocommit) {
                    LOG.debug(method, 'Autocommit enabled, executing action');
                    LOG.exit(method);
                    return actionFunction();
                } else {
                    LOG.debug(method, 'Autocommit disabled, queueing action');
                    this.pendingActions.push(actionFunction);
                    LOG.exit(method);
                }
            });
    }

    /**
     * Called at the start of a transaction.
     * @param {boolean} readOnly Is the transaction read-only?
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionStart(readOnly) {
        const method = 'transactionStart';
        LOG.entry(method, readOnly);
        return super.transactionStart(readOnly)
            .then(() => {
                this.pendingActions = [];
                LOG.exit(method);
            });
    }

    /**
     * Called when a transaction is preparing to commit.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionPrepare() {
        const method = 'transactionPrepare';
        LOG.entry(method);
        return super.transactionPrepare()
            .then(() => {
                return this.pendingActions.reduce((promise, pendingAction) => {
                    return promise.then(() => {
                        return pendingAction();
                    });
                }, Promise.resolve());
            })
            .then(() => {
                LOG.exit(method);
            });
    }

}

module.exports = PouchDBDataService;
