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
const Dexie = require('dexie');
const Logger = require('composer-common').Logger;
const WebDataCollection = require('./webdatacollection');

const LOG = Logger.getLog('WebDataService');

/**
 * Base class representing the data service provided by a {@link Container}.
 * @protected
 */
class WebDataService extends DataService {

    /**
     * Create a new instance of Dexie.
     * @param {string} name The name of the Dexie database.
     * @return {Dexie} The new instance of Dexie.
     */
    static createDexie(name) {
        const method = 'createDexie';
        LOG.entry(method, name);
        let result = new Dexie(name);
        LOG.exit(method, result);
        return result;
    }

    /**
     * Constructor.
     * @param {string} [uuid] The UUID of the container.
     * @param {boolean} [autocommit] Should this data service auto commit?
     */
    constructor(uuid, autocommit) {
        super();
        const method = 'constructor';
        LOG.entry(method, uuid);
        if (uuid) {
            this.db = WebDataService.createDexie(`Composer:${uuid}`);
        } else {
            this.db = WebDataService.createDexie('Composer');
        }
        this.db.version(1).stores({
            collections: '&id',
            objects: '[id+collectionId],collectionId'
        });
        this.autocommit = !!autocommit;
        this.pendingActions = [];
        LOG.exit(method);
    }

    /**
     * Close the database connection.
     */
    close() {
        const method = 'close';
        LOG.entry(method);
        this.db.close();
        LOG.exit(method);
    }

    /**
     * Ensure that the database connection is open.
     * @return {Promise} A promise that will be resolved when connected, or
     * rejected with an error.
     */
    ensureConnected() {
        if (this.db.isOpen()) {
            return Promise.resolve();
        } else {
            return this.db.open();
        }
    }

    /**
     * Create a collection with the specified ID.
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved with a {@link DataCollection}
     * when complete, or rejected with an error.
     */
    createCollection(id) {
        const method = 'createCollection';
        LOG.entry(method, id);
        return this.ensureConnected()
            .then(() => {
                return this.handleAction(() => {
                    return this.db.collections.add({id: id});
                });
            })
            .then(() => {
                let result = new WebDataCollection(this, this.db, id);
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
        return this.ensureConnected()
            .then(() => {
                return this.db.collections.get(id);
            })
            .then((collection) => {
                if (!collection) {
                    throw new Error(`Collection with ID '${id}' does not exist`);
                }
                return this.handleAction(() => {
                    return this.db.objects.where('collectionId').equals(id).delete()
                        .then(() => {
                            return this.db.collections.delete(id);
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
        return this.ensureConnected()
            .then(() => {
                return this.db.collections.get(id);
            })
            .then((collection) => {
                if (!collection) {
                    throw new Error(`Collection with ID '${id}' does not exist`);
                }
                let result = new WebDataCollection(this, this.db, id);
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
        return this.ensureConnected()
            .then(() => {
                return this.db.collections.get(id);
            })
            .then((collection) => {
                let result = !!collection;
                LOG.exit(method, result);
                return result;
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
        return Promise.resolve()
            .then(() => {
                if (this.autocommit) {
                    return actionFunction();
                } else {
                    return this.pendingActions.push(actionFunction);
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
        return super.transactionStart(readOnly)
            .then(() => {
                this.pendingActions = [];
            });
    }

    /**
     * Called when a transaction is preparing to commit.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionPrepare() {
        return super.transactionPrepare()
            .then(() => {
                return this.db.transaction('rw', this.db.collections, this.db.objects, () => {
                    return this.pendingActions.reduce((promise, pendingAction) => {
                        return promise.then(() => {
                            return pendingAction();
                        });
                    }, Dexie.Promise.resolve());
                });
            });
    }

}

module.exports = WebDataService;
