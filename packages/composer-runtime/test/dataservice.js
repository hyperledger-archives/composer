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

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('DataService', () => {

    let dataService;

    beforeEach(() => {
        dataService = new DataService();
    });

    describe('#createCollection', () => {
        it('should throw as abstract', async () => {
            await dataService.createCollection('id')
                .should.be.rejectedWith(/abstract function called/);
        });
    });

    describe('#deleteCollection', () => {
        it('should throw as abstract', async () => {
            await dataService.deleteCollection('id')
                .should.be.rejectedWith(/abstract function called/);
        });
    });

    describe('#getCollection', () => {
        it('should throw as abstract', async () => {
            await dataService.getCollection('id')
                .should.be.rejectedWith(/abstract function called/);
        });
    });

    describe('#existsCollection', () => {
        it('should throw as abstract', async () => {
            await dataService.existsCollection('id')
                .should.be.rejectedWith(/abstract function called/);
        });
    });

    describe('#executeQuery', () => {
        it('should throw as abstract', async () => {
            await dataService.executeQuery('id')
                .should.be.rejectedWith(/abstract function called/);
        });
    });

    describe('#ensureCollection', () => {

        it('should return an existing collection', () => {
            const mockDataCollection = sinon.createStubInstance(DataCollection);
            sinon.stub(dataService, 'getCollection').withArgs('suchcollection').resolves(mockDataCollection);
            return dataService.ensureCollection('suchcollection')
                .should.eventually.be.equal(mockDataCollection);
        });

        it('should create a collection that does not exist', () => {
            const mockDataCollection = sinon.createStubInstance(DataCollection);
            sinon.stub(dataService, 'getCollection').withArgs('suchcollection').rejects(new Error('no such collection!'));
            sinon.stub(dataService, 'createCollection').withArgs('suchcollection').resolves(mockDataCollection);
            return dataService.ensureCollection('suchcollection')
                .should.eventually.be.equal(mockDataCollection);
        });

    });

});
