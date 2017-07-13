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

const PouchDB = require('pouchdb-core');
const PouchDBUtils = require('..').PouchDBUtils;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

// Install the PouchDB plugins.
PouchDB.plugin(require('pouchdb-adapter-memory'));
PouchDB.plugin(require('pouchdb-find'));

describe('PouchDBUtils', () => {

    let db;

    beforeEach(() => {
        db = new PouchDB('Composer', { adapter: 'memory' });
        return db.bulkDocs([
            {
                _id: 'thing1',
                thing: 1
            },
            {
                _id: 'thing2',
                thing: 2
            },
        ]);
    });

    afterEach(() => {
        return db.destroy();
    });

    describe('#getDocument', () => {

        it('should return undefined if the specified object does not exist', () => {
            return PouchDBUtils.getDocument(db, 'thing3')
                .should.eventually.be.undefined;
        });

        it('should get the specified document', () => {
            return PouchDBUtils.getDocument(db, 'thing1')
                .then((doc) => {
                    doc.should.deep.equal({ thing: 1 });
                });
        });

    });

    describe('#putDocument', () => {

        it('should put a new document', () => {
            return PouchDBUtils.putDocument(db, 'thing3', { thing: 3 })
                .then(() => {
                    return db.get('thing3');
                })
                .then((doc) => {
                    delete doc._id;
                    delete doc._rev;
                    doc.should.deep.equal({ thing: 3 });
                });
        });

        it('should put an existing document', () => {
            return PouchDBUtils.putDocument(db, 'thing1', { thing: 100 })
                .then(() => {
                    return db.get('thing1');
                })
                .then((doc) => {
                    delete doc._id;
                    delete doc._rev;
                    doc.should.deep.equal({ thing: 100 });
                });
        });

    });

    describe('#remove', () => {

        it('should remove a new document', () => {
            return PouchDBUtils.removeDocument(db, 'thing3')
                .then(() => {
                    return db.get('thing3')
                        .should.be.rejectedWith(/missing/);
                });
        });

        it('should remove an existing document', () => {
            return PouchDBUtils.removeDocument(db, 'thing1')
                .then(() => {
                    return db.get('thing1')
                        .should.be.rejectedWith(/missing/);
                });
        });

    });

});
