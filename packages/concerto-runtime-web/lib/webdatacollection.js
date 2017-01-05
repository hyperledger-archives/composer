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

const DataCollection = require('@ibm/concerto-runtime').DataCollection;

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
                if (!object) {
                    return false;
                }
                return true;
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
        return this.db.objects.add({
            id: id,
            collectionId: this.collectionId,
            object: object
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
        return this.db.objects.put({
            id: id,
            collectionId: this.collectionId,
            object: object
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
        return this.db.objects.where('[id+collectionId]').equals([id, this.collectionId]).delete();
    }

}

module.exports = WebDataCollection;
