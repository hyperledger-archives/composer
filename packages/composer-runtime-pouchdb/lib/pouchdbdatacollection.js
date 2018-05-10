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

const DataCollection = require('composer-runtime').DataCollection;
const Logger = require('composer-common').Logger;
const pouchCollate = require('pouchdb-collate');
const PouchDBUtils = require('./pouchdbutils');

const LOG = Logger.getLog('PouchDBDataCollection');

/**
 * Base class representing a data collection provided by a {@link DataService}.
 * @protected
 * @abstract
 */
class PouchDBDataCollection extends DataCollection {

    /**
     * Constructor.
     * @param {DataService} dataService The owning data service.
     * @param {Dexie} db The database to use.
     * @param {string} collectionId The collection ID to use.
     * @param {string} uuid The uuid to use
     */
    constructor(dataService, db, collectionId, uuid) {
        super(dataService);
        const method = 'constructor';
        LOG.entry(method, dataService, db, collectionId);
        this.db = db;
        this.uuid = uuid;
        this.collectionId = collectionId;
        LOG.exit(method);
    }

    /**
     * Get all of the objects in this collection.
     * @abstract
     * @return {Promise} A promise that will be resolved with an array of objects,
     * or rejected with an error.
     */
    getAll() {
        const method = 'getAll';
        LOG.entry(method);
        let compositeKey = [this.collectionId];
        if(this.uuid) {
            compositeKey.unshift(this.uuid);
        }

        const startKey = pouchCollate.toIndexableString(compositeKey);
        const endCompositeKey = compositeKey;
        endCompositeKey.push('\uffff');
        const endKey = pouchCollate.toIndexableString(endCompositeKey);
        return this.db.allDocs({ include_docs: true, startkey: startKey, endkey: endKey, inclusive_end: false })
            .then((response) => {
                const result = response.rows.map((row) => {
                    delete row.doc._id;
                    delete row.doc._rev;
                    return row.doc;
                });
                LOG.exit(result);
                return result;
            });
    }

    /**
     * Get the specified object in this collection.
     * @abstract
     * @param {string} id The ID of the object.
     * @return {Promise} A promise that will be resolved with an object, or rejected
     * with an error.
     */
    get(id) {
        const method = 'get';
        LOG.entry(method, id);
        let compositeKey = [this.collectionId, id];
        if(this.uuid) {
            compositeKey.unshift(this.uuid);
        }

        const key = pouchCollate.toIndexableString(compositeKey);
        return PouchDBUtils.getDocument(this.db, key)
            .then((doc) => {
                if (!doc) {
                    throw new Error(`Object with ID '${id}' in collection with ID '${this.collectionId}' does not exist`);
                }
                LOG.exit(method, doc);
                return doc;
            });
    }

    /**
     * Determine whether the specified object exists in this collection.
     * @abstract
     * @param {string} id The ID of the object.
     * @return {Promise} A promise that will be resolved with a boolean indicating
     * whether the object exists.
     */
    exists(id) {
        const method = 'exists';
        LOG.entry(method, id);
        let compositeKey = [this.collectionId, id];
        if(this.uuid) {
            compositeKey.unshift(this.uuid);
        }

        const key = pouchCollate.toIndexableString(compositeKey);
        return PouchDBUtils.getDocument(this.db, key)
            .then((doc) => {
                LOG.exit(method, !!doc);
                return !!doc;
            });
    }

    /**
     * Add an object to the collection.
     * @abstract
     * @param {string} id The ID of the object.
     * @param {Object} object The object.
     * @param {boolean} force Whether to force creation without checking it already exists.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    add(id, object, force) {
        const method = 'add';
        LOG.entry(method, id, object, force);
        force = !!force;

        let compositeKey = [this.collectionId, id];
        if(this.uuid) {
            compositeKey.unshift(this.uuid);
            object.$networkId = this.uuid;
        }

        const key = pouchCollate.toIndexableString(compositeKey);
        return PouchDBUtils.getDocument(this.db, key)
            .then((doc) => {
                if (doc && !force) {
                    throw new Error(`Failed to add object with ID '${id}' as the object already exists`);
                }
                return this.dataService.handleAction(() => {
                    return PouchDBUtils.putDocument(this.db, key, object);
                });
            });
    }

    /**
     * Add an object to the collection.
     * @abstract
     * @param {string} id The ID of the object.
     * @param {Object} object The object.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    update(id, object) {
        const method = 'update';
        LOG.entry(method, id, object);
        let compositeKey = [this.collectionId, id];
        if(this.uuid) {
            compositeKey.unshift(this.uuid);
            object.$networkId = this.uuid;
        }

        const key = pouchCollate.toIndexableString(compositeKey);
        return PouchDBUtils.getDocument(this.db, key)
            .then((doc) => {
                if (!doc) {
                    throw new Error(`Object with ID '${id}' in collection with ID '${this.collectionId}' does not exist`);
                }
                return this.dataService.handleAction(() => {
                    return PouchDBUtils.putDocument(this.db, key, object);
                });
            });
    }

    /**
     * Remove an object from the collection.
     * @abstract
     * @param {string} id The ID of the object.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    remove(id) {
        const method = 'remove';
        LOG.entry(method, id);
        let compositeKey = [this.collectionId, id];
        if(this.uuid) {
            compositeKey.unshift(this.uuid);
        }

        const key = pouchCollate.toIndexableString(compositeKey);
        return PouchDBUtils.getDocument(this.db, key)
            .then((doc) => {
                if (!doc) {
                    throw new Error(`Object with ID '${id}' in collection with ID '${this.collectionId}' does not exist`);
                }
                return this.dataService.handleAction(() => {
                    return PouchDBUtils.removeDocument(this.db, key);
                });
            });
    }

}

module.exports = PouchDBDataCollection;
