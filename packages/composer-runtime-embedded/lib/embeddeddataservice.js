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
const EmbeddedDataCollection = require('./embeddeddatacollection');

/**
 * fake-indexeddb seems to maintain too much state, even though we ask dexie to
 * create a new database for each chaincode (using a UUID as part of the database
 * name), so we have to reload the module each time.
 * @param {string} module The name of the module.
 * @return {object} The uncached module.
 */
function requireUncached(module){
    delete require.cache[require.resolve(module)];
    return require(module);
}

/**
 * Base class representing the data service provided by a {@link Container}.
 * @protected
 */
class EmbeddedDataService extends DataService {

    /**
     * Constructor.
     * @param {string} uuid The UUID of the container.
     */
    constructor(uuid) {
        super();
        let fakeIndexedDB = requireUncached('fake-indexeddb');
        let FDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');
        this.db = new Dexie(`Concerto:${uuid}`, {
            indexedDB: fakeIndexedDB,
            IDBKeyRange: FDBKeyRange
        });
        this.db.version(1).stores({
            collections: '&id',
            objects: '[id+collectionId],collectionId'
        });
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
        console.log('EmbeddedDataService.createCollection', id);
        return this.ensureConnected()
            .then(() => {
                return this.db.collections.add({id: id});
            })
            .then(() => {
                return new EmbeddedDataCollection(this, this.db, id);
            });
    }

    /**
     * Delete a collection with the specified ID.
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    deleteCollection(id) {
        console.log('EmbeddedDataService.deleteCollection', id);
        return this.ensureConnected()
            .then(() => {
                return this.db.collections.get(id);
            })
            .then((collection) => {
                if (!collection) {
                    throw new Error(`Collection with ID '${id}' does not exist`);
                }
                return this.db.objects.where('collectionId').equals(id).delete();
            })
            .then(() => {
                return this.db.collections.delete(id);
            });
    }

   /**
    * Get the collection with the specified ID.
    * @param {string} id The ID of the collection.
    * @return {Promise} A promise that will be resolved with a {@link DataCollection}
    * when complete, or rejected with an error.
    */
    getCollection(id) {
        console.log('EmbeddedDataService.getCollection', id);
        return this.ensureConnected()
            .then(() => {
                return this.db.collections.get(id);
            })
            .then((collection) => {
                if (!collection) {
                    throw new Error(`Collection with ID '${id}' does not exist`);
                }
                return new EmbeddedDataCollection(this, this.db, id);
            });
    }

    /**
     * Determine whether the collection with the specified ID exists.
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved with a boolean
     * indicating whether the collection exists.
     */
    existsCollection(id) {
        console.log('EmbeddedDataService.existsCollection', id);
        return this.ensureConnected()
            .then(() => {
                return this.db.collections.get(id);
            })
            .then((collection) => {
                return !!collection;
            });
    }

}

module.exports = EmbeddedDataService;
