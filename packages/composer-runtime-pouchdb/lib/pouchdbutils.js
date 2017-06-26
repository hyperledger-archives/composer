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

const LOG = Logger.getLog('PouchDBUtils');

/**
 * Utility functions for interacting with PouchDB.
 * @protected
 */
class PouchDBUtils {

    /**
     * Get a document from the database.
     * @param {PouchDB} db The database.
     * @param {string} id The document ID.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    static getDocument(db, id) {
        const method = 'get';
        LOG.entry(method, id);
        return db.get(id)
            .catch((error) => {
                // Ignore the error.
            })
            .then((doc) => {
                if (doc) {
                    delete doc._id;
                    delete doc._rev;
                }
                LOG.exit(method, doc);
                return doc;
            });
    }

    /**
     * Put a document to the database.
     * @param {PouchDB} db The database.
     * @param {string} id The document ID.
     * @param {Object} doc The document.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    static putDocument(db, id, doc) {
        const method = 'put';
        LOG.entry(method, id, doc);
        return db.get(id)
            .catch((error) => {
                // Ignore the error.
            })
            .then((existing) => {
                doc._id = id;
                if (existing) {
                    doc._rev = existing._rev;
                }
                return db.put(doc);
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Remove a document from the database.
     * @param {PouchDB} db The database.
     * @param {string} id The document ID.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    static removeDocument(db, id) {
        const method = 'remove';
        LOG.entry(method, id);
        return db.get(id)
            .catch((error) => {
                // Ignore the error.
            })
            .then((existing) => {
                if (!existing) {
                    return;
                }
                return db.remove({
                    _id: id,
                    _rev: existing._rev
                });
            })
            .then(() => {
                LOG.exit(method);
            });
    }

}

module.exports = PouchDBUtils;
