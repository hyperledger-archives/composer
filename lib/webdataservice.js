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

const DataService = require('@ibm/ibm-concerto-runtime').DataService;
const Dexie = require('dexie');
const WebDataCollection = require('./webdatacollection');

/**
 * Base class representing the data service provided by a {@link Container}.
 * @protected
 */
class WebDataService extends DataService {

    /**
     * Constructor.
     * @param {string} uuid The UUID of the container.
     */
    constructor(uuid) {
        super();
        this.db = new Dexie(`Concerto:${uuid}`);
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
        console.log('WebDataService.createCollection', id);
        return this.ensureConnected()
            .then(() => {
                return this.db.collections.add({id: id});
            })
            .then(() => {
                return new WebDataCollection(this, this.db, id);
            });
    }

    /**
     * Delete a collection with the specified ID.
     * @param {string} id The ID of the collection.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    deleteCollection(id) {
        console.log('WebDataService.deleteCollection', id);
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
        console.log('WebDataService.getCollection', id);
        return this.ensureConnected()
            .then(() => {
                return this.db.collections.get(id);
            })
            .then((collection) => {
                if (!collection) {
                    throw new Error(`Collection with ID '${id}' does not exist`);
                }
                return new WebDataCollection(this, this.db, id);
            });
    }

}

module.exports = WebDataService;
