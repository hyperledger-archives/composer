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

const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');

require('chai').should();
const sinon = require('sinon');

describe('DataCollection', () => {

    let mockDataService;
    let dataCollection;

    beforeEach(() => {
        mockDataService = sinon.createStubInstance(DataService);
        dataCollection = new DataCollection(mockDataService);
    });

    describe('#getAll', () => {

        it('should call _getAll and handle no error', () => {
            sinon.stub(dataCollection, '_getAll').yields(null, []);
            return dataCollection.getAll()
                .then((result) => {
                    result.should.deep.equal([]);
                });
        });

        it('should call _getAll and handle an error', () => {
            sinon.stub(dataCollection, '_getAll').yields(new Error('error'), null);
            return dataCollection.getAll()
                .then((result) => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/error/);
                });
        });

    });

    describe('#_getAll', () => {

        it('should throw as abstract method', () => {
            (() => {
                dataCollection._getAll();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#get', () => {

        it('should call _get and handle no error', () => {
            sinon.stub(dataCollection, '_get').yields(null, {});
            return dataCollection.get('id')
                .then((result) => {
                    sinon.assert.calledWith(dataCollection._get, 'id');
                    result.should.deep.equal({});
                });
        });

        it('should call _get and handle an error', () => {
            sinon.stub(dataCollection, '_get').yields(new Error('error'), null);
            return dataCollection.get('id')
                .then((result) => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    sinon.assert.calledWith(dataCollection._get, 'id');
                    error.should.match(/error/);
                });
        });

    });

    describe('#_get', () => {

        it('should throw as abstract method', () => {
            (() => {
                dataCollection._get('id');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#exists', () => {

        it('should call _exists and handle no error', () => {
            sinon.stub(dataCollection, '_exists').yields(null, true);
            return dataCollection.exists('id')
                .then((result) => {
                    sinon.assert.calledWith(dataCollection._exists, 'id');
                    result.should.be.true;
                });
        });

        it('should call _exists and handle an error', () => {
            sinon.stub(dataCollection, '_exists').yields(new Error('error'), null);
            return dataCollection.exists('id')
                .then((result) => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    sinon.assert.calledWith(dataCollection._exists, 'id');
                    error.should.match(/error/);
                });
        });

    });

    describe('#_exists', () => {

        it('should throw as abstract method', () => {
            (() => {
                dataCollection._exists('id');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#add', () => {

        it('should call _add, default force to false and handle no error', () => {
            sinon.stub(dataCollection, '_add').yields(null);
            return dataCollection.add('id', {})
                .then(() => {
                    sinon.assert.calledWith(dataCollection._add, 'id', {}, false);
                });
        });

        it('should call _add, passthrough force and handle no error', () => {
            sinon.stub(dataCollection, '_add').yields(null);
            return dataCollection.add('id', {}, true)
                .then(() => {
                    sinon.assert.calledWith(dataCollection._add, 'id', {}, true);
                });
        });

        it('should call _add and handle an error', () => {
            sinon.stub(dataCollection, '_add').yields(new Error('error'));
            return dataCollection.add('id', {})
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    sinon.assert.calledWith(dataCollection._add, 'id', {}, false);
                    error.should.match(/error/);
                });
        });

    });

    describe('#_add', () => {

        it('should throw as abstract method', () => {
            (() => {
                dataCollection._add('id', {});
            }).should.throw(/abstract function called/);
        });

    });

    describe('#update', () => {

        it('should call _update and handle no error', () => {
            sinon.stub(dataCollection, '_update').yields(null);
            return dataCollection.update('id', {})
                .then(() => {
                    sinon.assert.calledWith(dataCollection._update, 'id', {});
                });
        });

        it('should call _update and handle an error', () => {
            sinon.stub(dataCollection, '_update').yields(new Error('error'));
            return dataCollection.update('id', {})
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    sinon.assert.calledWith(dataCollection._update, 'id', {});
                    error.should.match(/error/);
                });
        });

    });

    describe('#_update', () => {

        it('should throw as abstract method', () => {
            (() => {
                dataCollection._update('id', {});
            }).should.throw(/abstract function called/);
        });

    });

    describe('#remove', () => {

        it('should call _remove and handle no error', () => {
            sinon.stub(dataCollection, '_remove').yields(null);
            return dataCollection.remove('id')
                .then(() => {
                    sinon.assert.calledWith(dataCollection._remove, 'id');
                });
        });

        it('should call _remove and handle an error', () => {
            sinon.stub(dataCollection, '_remove').yields(new Error('error'));
            return dataCollection.remove('id')
                .then(() => {
                    throw new Error('should not remove here');
                })
                .catch((error) => {
                    sinon.assert.calledWith(dataCollection._remove, 'id');
                    error.should.match(/error/);
                });
        });

    });

    describe('#_remove', () => {

        it('should throw as abstract method', () => {
            (() => {
                dataCollection._remove('id');
            }).should.throw(/abstract function called/);
        });

    });

});
