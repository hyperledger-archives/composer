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
        it('should throw as abstract', async () => {
            await dataCollection.getAll()
                .should.be.rejectedWith(/abstract function called/);
        });
    });

    describe('#get', () => {
        it('should throw as abstract', async () => {
            await dataCollection.get('id')
                .should.be.rejectedWith(/abstract function called/);
        });
    });

    describe('#exists', () => {
        it('should throw as abstract', async () => {
            await dataCollection.exists('id')
                .should.be.rejectedWith(/abstract function called/);
        });
    });

    describe('#add', () => {
        it('should throw as abstract', async () => {
            await dataCollection.add('id', {})
                .should.be.rejectedWith(/abstract function called/);
        });
    });

    describe('#update', () => {
        it('should throw as abstract', async () => {
            await dataCollection.update('id', {})
                .should.be.rejectedWith(/abstract function called/);
        });
    });

    describe('#remove', () => {
        it('should throw as abstract', async () => {
            await dataCollection.remove('id')
                .should.be.rejectedWith(/abstract function called/);
        });
    });

});
