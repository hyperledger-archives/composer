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

/**
 * Base class representing a data collection provided by a {@link DataService}.
 * @protected
 * @abstract
 */
class WebDataCollection extends DataCollection {

    /**
     * Constructor.
     * @param {DataService} dataService The owning data service.
     * @param {Dexie} db The database to use.
     * @param {string} collectionId The collection ID to use.
     */
    constructor(dataService, db, collectionId) {
        super(dataService);
        this.db = db;
        this.collectionId = collectionId;
    }

    /**
     * Get all of the objects in this collection.
     * @abstract
     * @return {Promise} A promise that will be resolved with an array of objects,
     * or rejected with an error.
     */
    getAll() {
        return this.db.objects.where('collectionId').equals(this.collectionId).toArray()
            .then((objects) => {
                return objects.map((object) => {
                    return object.object;
                });
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
        return this.db.objects.where('[id+collectionId]').equals([id, this.collectionId]).first()
            .then((object) => {
                if (!object) {
                    throw new Error(`Object with ID '${id}' in collection with ID '${this.collectionId}' does not exist`);
                }
                return object.object;
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
        return this.db.objects.where('[id+collectionId]').equals([id, this.collectionId]).first()
            .then((object) => {
                return !!object;
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
    add(id, object) {
        return this.dataService.handleAction(() => {
            return this.db.objects.add({
                id: id,
                collectionId: this.collectionId,
                object: object
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
        return this.dataService.handleAction(() => {
            return this.db.objects.put({
                id: id,
                collectionId: this.collectionId,
                object: object
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
        return this.dataService.handleAction(() => {
            return this.db.objects.where('[id+collectionId]').equals([id, this.collectionId]).delete();
        });
    }

}

module.exports = WebDataCollection;
