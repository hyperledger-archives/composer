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

const Api = require('../lib/api');
const Context = require('../lib/context');
const Factory = require('composer-common').Factory;
const ModelManager = require('composer-common').ModelManager;
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const ResourceManager = require('../lib/resourcemanager');

require('chai').should();
const sinon = require('sinon');

describe('ResourceManager', () => {

    let mockApi;
    let mockContext;
    let mockRegistryManager;
    let mockAssetRegistry;
    let mockParticipantRegistry;
    let modelManager;
    let factory;

    let resourceManager;

    beforeEach(() => {
        mockApi = sinon.createStubInstance(Api);
        mockContext = sinon.createStubInstance(Context);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        mockAssetRegistry = sinon.createStubInstance(Registry);
        mockRegistryManager.get.withArgs('Asset', 'a.n.other.registry').resolves(mockAssetRegistry);
        mockParticipantRegistry = sinon.createStubInstance(Registry);
        mockRegistryManager.get.withArgs('Participant', 'a.n.other.registry').resolves(mockParticipantRegistry);
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme
        asset SampleAsset identified by assetId {
            o String assetId
        }
        participant SampleParticipant identified by participantId {
            o String participantId
        }
        `);
        factory = new Factory(modelManager);
        resourceManager = new ResourceManager(mockContext);
    });

    describe('#addResources', () => {

        it('should add an asset to an asset registry', () => {
            const tx = factory.newTransaction('org.hyperledger.composer.system', 'AddAsset');
            tx.targetRegistry = factory.newRelationship('org.hyperledger.composer.system', 'AssetRegistry', 'a.n.other.registry');
            tx.resources = [
                factory.newResource('org.acme', 'SampleAsset', 'ASSET_1'),
                factory.newResource('org.acme', 'SampleAsset', 'ASSET_2')
            ];
            return resourceManager.execute(mockApi, tx)
                .then(()=>{
                    sinon.assert.calledWith(mockRegistryManager.get,'Asset', 'a.n.other.registry');
                    sinon.assert.calledWith(mockAssetRegistry.addAll, tx.resources, { convertResourcesToRelationships: true });
                });
        });

        it('should add a participant to an participant registry', () => {
            const tx = factory.newTransaction('org.hyperledger.composer.system', 'AddParticipant');
            tx.targetRegistry = factory.newRelationship('org.hyperledger.composer.system', 'ParticipantRegistry', 'a.n.other.registry');
            tx.resources = [
                factory.newResource('org.acme', 'SampleParticipant', 'PARTICIPANT_1'),
                factory.newResource('org.acme', 'SampleParticipant', 'PARTICIPANT_2')
            ];
            return resourceManager.execute(mockApi, tx)
                .then(()=>{
                    sinon.assert.calledWith(mockRegistryManager.get,'Participant', 'a.n.other.registry');
                    sinon.assert.calledWith(mockParticipantRegistry.addAll, tx.resources, { convertResourcesToRelationships: true });
                });
        });

    });

    describe('#updateResources', () => {

        it('should update an asset in an asset registry', () => {
            const tx = factory.newTransaction('org.hyperledger.composer.system', 'UpdateAsset');
            tx.targetRegistry = factory.newRelationship('org.hyperledger.composer.system', 'AssetRegistry', 'a.n.other.registry');
            tx.resources = [
                factory.newResource('org.acme', 'SampleAsset', 'ASSET_1'),
                factory.newResource('org.acme', 'SampleAsset', 'ASSET_2')
            ];
            return resourceManager.execute(mockApi, tx)
                .then(()=>{
                    sinon.assert.calledWith(mockRegistryManager.get,'Asset', 'a.n.other.registry');
                    sinon.assert.calledWith(mockAssetRegistry.updateAll, tx.resources, { convertResourcesToRelationships: true });
                });
        });

        it('should update a participant in an participant registry', () => {
            const tx = factory.newTransaction('org.hyperledger.composer.system', 'UpdateParticipant');
            tx.targetRegistry = factory.newRelationship('org.hyperledger.composer.system', 'ParticipantRegistry', 'a.n.other.registry');
            tx.resources = [
                factory.newResource('org.acme', 'SampleParticipant', 'PARTICIPANT_1'),
                factory.newResource('org.acme', 'SampleParticipant', 'PARTICIPANT_2')
            ];
            return resourceManager.execute(mockApi, tx)
                .then(()=>{
                    sinon.assert.calledWith(mockRegistryManager.get,'Participant', 'a.n.other.registry');
                    sinon.assert.calledWith(mockParticipantRegistry.updateAll, tx.resources, { convertResourcesToRelationships: true });
                });
        });

    });

    describe('#removeResources', () => {

        it('should remove an asset from an asset registry', () => {
            const tx = factory.newTransaction('org.hyperledger.composer.system', 'RemoveAsset');
            tx.targetRegistry = factory.newRelationship('org.hyperledger.composer.system', 'AssetRegistry', 'a.n.other.registry');
            tx.resources = [];
            tx.resourceIds = [ 'ASSET_1', 'ASSET_2' ];
            return resourceManager.execute(mockApi, tx)
                .then(()=>{
                    sinon.assert.calledWith(mockRegistryManager.get,'Asset', 'a.n.other.registry');
                    sinon.assert.calledWith(mockAssetRegistry.removeAll, tx.resourceIds);
                });
        });

        it('should remove a participant from an participant registry', () => {
            const tx = factory.newTransaction('org.hyperledger.composer.system', 'RemoveParticipant');
            tx.targetRegistry = factory.newRelationship('org.hyperledger.composer.system', 'ParticipantRegistry', 'a.n.other.registry');
            tx.resources = [];
            tx.resourceIds = [ 'PARTICIPANT_1', 'PARTICIPANT_2' ];
            return resourceManager.execute(mockApi, tx)
                .then(()=>{
                    sinon.assert.calledWith(mockRegistryManager.get,'Participant', 'a.n.other.registry');
                    sinon.assert.calledWith(mockParticipantRegistry.removeAll, tx.resourceIds);
                });
        });

    });

});
