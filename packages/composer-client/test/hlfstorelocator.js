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

const FileSystemCardStore = require('composer-common').FileSystemCardStore;
const HLFStoreLocator = require('../lib/hlfstorelocator');
const path = require('path');

const chai = require('chai');
chai.should();

describe('HLFStoreLocator', function() {
    const assertValidStorePath = (storePath) => {
        path.isAbsolute(storePath).should.be.true;
        storePath.should.include('client-data-store');
    };

    describe('#clientDataStorePath', function() {
        it('should return absolute path with no card store', function() {
            const storeLocator = new HLFStoreLocator();
            const cardName = 'conga-card';
            const result = storeLocator.clientDataStorePath(cardName);
            assertValidStorePath(result);
        });

        it('should return absolute path with valid card store', function() {
            const cardStore = new FileSystemCardStore();
            const storeLocator = new HLFStoreLocator(cardStore);
            const cardName = 'conga-card';
            const result = storeLocator.clientDataStorePath(cardName);
            assertValidStorePath(result);
        });
    });

    describe('#updateConnectionProfile', function() {
        it('should set keyValStore property', function() {
            const storeLocator = new HLFStoreLocator();
            const result = storeLocator.updateConnectionProfile({}, 'conga');
            assertValidStorePath(result.keyValStore);
        });
    });

});
