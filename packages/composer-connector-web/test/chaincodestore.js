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

const ChaincodeStore = require('../lib/chaincodestore');
const { PouchDBDataService } = require('composer-runtime-pouchdb');
const { BusinessNetworkDefinition } = require('composer-common');

// Install the PouchDB plugins. The order of the adapters is important!
PouchDBDataService.registerPouchDBPlugin(require('pouchdb-adapter-memory'));

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

const COLLECTION_ID = 'chaincode';

describe('ChaincodeStore', () => {
    const dataService = new PouchDBDataService('ChaincodeStoreTest', true, { adapter: 'memory' });
    const testNetworkV1 = new BusinessNetworkDefinition('test-network@1.0.0');
    const testNetworkV2 = new BusinessNetworkDefinition('test-network@2.0.0');
    const anotherNetwork = new BusinessNetworkDefinition('another-network@1.0.0');

    let dataCollection;
    let chaincodeStore;

    beforeEach(async () => {
        dataCollection = await dataService.createCollection(COLLECTION_ID);
        chaincodeStore = new ChaincodeStore(dataCollection);
    });

    afterEach(async () => {
        await dataService.deleteCollection(COLLECTION_ID);
    });

    /**
     * Test that an actual business network definition matches an expected one.
     * @param {BusinessNetworkDefinition} actual business network definition.
     * @param {BusinessNetworkDefinition} expected business network definition.
     */
    function assertNetworksEqual(actual, expected) {
        actual.should.be.an.instanceOf(BusinessNetworkDefinition);
        actual.getName().should.equal(expected.getName());
        actual.getVersion().should.equal(expected.getVersion());
    }

    describe('#install', () => {
        it('should install network', async () => {
            await chaincodeStore.install(testNetworkV1).should.not.be.rejected;
        });

        it('should error reinstalling previously installed network', async () => {
            await chaincodeStore.install(testNetworkV1);
            await chaincodeStore.install(testNetworkV1).should.be.rejected;
        });

        it('should allow multiple different networks', async () => {
            await chaincodeStore.install(testNetworkV1);
            await chaincodeStore.install(anotherNetwork).should.not.be.rejected;
        });

        it('should allow multiple different versions of same network', async () => {
            await chaincodeStore.install(testNetworkV1);
            await chaincodeStore.install(testNetworkV2).should.not.be.rejected;
        });
    });

    describe('#start', () => {
        it('should error for network that is not installed', async () => {
            await chaincodeStore.start('name', '1.0.0').should.be.rejected;
        });

        it('should error for previously started network', async () => {
            await chaincodeStore.install(testNetworkV1);
            await chaincodeStore.start(testNetworkV1.getName(), testNetworkV1.getVersion());
            await chaincodeStore.start(testNetworkV1.getName(), testNetworkV1.getVersion()).should.be.rejected;
        });

        it('should return started network', async () => {
            await chaincodeStore.install(testNetworkV1);
            const networkDefinition = await chaincodeStore.start(testNetworkV1.getName(), testNetworkV1.getVersion());
            assertNetworksEqual(networkDefinition, testNetworkV1);
        });
    });

    describe('#getStartedChaincode', () => {
        it('should error for network that is not installed', async () => {
            await chaincodeStore.getStartedChaincode('name').should.be.rejected;
        });

        it('should error for network that is installed but not started', async () => {
            await chaincodeStore.install(testNetworkV1);
            await chaincodeStore.getStartedChaincode(testNetworkV1.getName()).should.be.rejected;
        });

        it('should return started network', async () => {
            await chaincodeStore.install(testNetworkV1);
            await chaincodeStore.start(testNetworkV1.getName(), testNetworkV1.getVersion());
            const networkDefinition = await chaincodeStore.getStartedChaincode(testNetworkV1.getName());
            assertNetworksEqual(networkDefinition, testNetworkV1);
        });

        it('should return new network version after upgrade', async () => {
            await chaincodeStore.install(testNetworkV1);
            await chaincodeStore.start(testNetworkV1.getName(), testNetworkV1.getVersion());
            await chaincodeStore.install(testNetworkV2);
            await chaincodeStore.upgrade(testNetworkV2.getName(), testNetworkV2.getVersion());
            const networkDefinition = await chaincodeStore.getStartedChaincode(testNetworkV2.getName());
            assertNetworksEqual(networkDefinition, testNetworkV2);
        });
    });

    describe('#removeNetwork', () => {
        it('should remove an installed network', async () => {
            await chaincodeStore.install(testNetworkV1);
            await chaincodeStore.removeNetwork(testNetworkV1.getName());
            await chaincodeStore.install(testNetworkV1).should.not.be.rejected;
        });

        it('should remove all installed network versions', async () => {
            await chaincodeStore.install(testNetworkV1);
            await chaincodeStore.install(testNetworkV2);
            await chaincodeStore.removeNetwork(testNetworkV1.getName());
            await chaincodeStore.install(testNetworkV1).should.not.be.rejected;
            await chaincodeStore.install(testNetworkV2).should.not.be.rejected;
        });
    });

    describe('#upgrade', () => {
        it('should error for that is not installed', async () => {
            await chaincodeStore.upgrade('name', '1.0.0').should.be.rejected;
        });

        it('should error for network that is installed but not started', async () => {
            await chaincodeStore.install(testNetworkV1);
            await chaincodeStore.upgrade(testNetworkV1.getName(), testNetworkV1.getVersion()).should.be.rejected;
        });

        it('should return upgraded network', async () => {
            await chaincodeStore.install(testNetworkV1);
            await chaincodeStore.start(testNetworkV1.getName(), testNetworkV1.getVersion());
            await chaincodeStore.install(testNetworkV2, );
            const networkDefinition = await chaincodeStore.upgrade(testNetworkV2.getName(), testNetworkV2.getVersion());
            assertNetworksEqual(networkDefinition, testNetworkV2);
        });
    });

});
