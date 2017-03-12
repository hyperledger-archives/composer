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
const IdentityManager = require('../lib/identitymanager');
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Resource = require('composer-common').Resource;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('IdentityManager', () => {

    let mockDataService;
    let mockSystemIdentities;
    let mockRegistryManager;
    let mockRegistry;
    let identityManager;
    let mockParticipant;

    beforeEach(() => {
        mockDataService = sinon.createStubInstance(DataService);
        mockSystemIdentities = sinon.createStubInstance(DataCollection);
        mockDataService.getCollection.withArgs('$sysidentities').resolves(mockSystemIdentities);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockRegistry = sinon.createStubInstance(Registry);
        mockRegistryManager.get.withArgs('Participant', 'org.doge.Doge').resolves(mockRegistry);
        identityManager = new IdentityManager(mockDataService, mockRegistryManager, mockSystemIdentities);
        mockParticipant = sinon.createStubInstance(Resource);
        mockParticipant.getIdentifier.returns('DOGE_1');
        mockParticipant.getType.returns('Doge');
        mockParticipant.getNamespace.returns('org.doge');
        mockParticipant.getFullyQualifiedType.returns('org.doge.Doge');
        mockParticipant.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
    });

    describe('#addIdentityMapping', () => {

        it('should add a new mapping for a user ID to a participant specified by a resource', () => {
            // The participant exists.
            mockRegistry.get.withArgs('DOGE_1').resolves(mockParticipant);
            // An existing mapping for this user ID does not exist.
            mockSystemIdentities.exists.withArgs('dogeid1').resolves(false);
            return identityManager.addIdentityMapping(mockParticipant, 'dogeid1')
                .then(() => {
                    sinon.assert.calledOnce(mockSystemIdentities.add);
                    sinon.assert.calledWith(mockSystemIdentities.add, 'dogeid1', {
                        participant: 'org.doge.Doge#DOGE_1'
                    });
                });
        });

        it('should add a new mapping for a user ID to a participant specified by an identifier', () => {
            // The participant exists.
            mockRegistry.get.withArgs('DOGE_1').resolves(mockParticipant);
            // An existing mapping for this user ID does not exist.
            mockSystemIdentities.exists.withArgs('dogeid1').resolves(false);
            return identityManager.addIdentityMapping('org.doge.Doge#DOGE_1', 'dogeid1')
                .then(() => {
                    sinon.assert.calledOnce(mockSystemIdentities.add);
                    sinon.assert.calledWith(mockSystemIdentities.add, 'dogeid1', {
                        participant: 'org.doge.Doge#DOGE_1'
                    });
                });
        });

        it('should throw if the specified participant does not exist', () => {
            // The participant does not exist.
            mockRegistry.get.withArgs('DOGE_1').rejects(new Error('does not exist'));
            // An existing mapping for this user ID does not exist.
            mockSystemIdentities.exists.withArgs('dogeid1').resolves(false);
            return identityManager.addIdentityMapping('org.doge.Doge#DOGE_1', 'dogeid1')
                .should.be.rejectedWith(/does not exist/);
        });

        it('should throw if the specified participant ID is invalid', () => {
            // The participant does not exist.
            mockRegistry.get.withArgs('DOGE_1').rejects(new Error('does not exist'));
            // An existing mapping for this user ID does not exist.
            mockSystemIdentities.exists.withArgs('dogeid1').resolves(false);
            (() => {
                identityManager.addIdentityMapping('org.doge.Doge$DOGE_1', 'dogeid1');
            }).should.throw(/Invalid fully qualified participant identifier/);
        });

        it('should throw if the specified user ID is already mapped', () => {
            // The participant exists.
            mockRegistry.get.withArgs('DOGE_1').resolves(mockParticipant);
            // An existing mapping for this user ID does exist.
            mockSystemIdentities.exists.withArgs('dogeid1').resolves(true);
            return identityManager.addIdentityMapping('org.doge.Doge#DOGE_1', 'dogeid1')
                .should.be.rejectedWith(/Found an existing mapping for user ID/);
        });

    });

    describe('#removeIdentityMapping', () => {

        it('should remove an existing mapping for a user ID to a participant', () => {
            // An existing mapping for this user ID does exist.
            mockSystemIdentities.exists.withArgs('dogeid1').resolves(true);
            return identityManager.removeIdentityMapping('dogeid1')
                .then(() => {
                    sinon.assert.calledOnce(mockSystemIdentities.remove);
                    sinon.assert.calledWith(mockSystemIdentities.remove, 'dogeid1');
                });
        });

        it('should not throw if an existing mapping for a user ID does not exist', () => {
            // An existing mapping for this user ID does not exist.
            mockSystemIdentities.exists.withArgs('dogeid1').resolves(false);
            return identityManager.removeIdentityMapping('dogeid1');
        });

    });

    describe('#getParticipant', () => {

        it('should resolve to a participant for an existing mapping and participant', () => {
            // An existing mapping for this user ID does exist.
            mockSystemIdentities.get.withArgs('dogeid1').resolves({
                participant: 'org.doge.Doge#DOGE_1'
            });
            // The participant exists.
            mockRegistry.get.withArgs('DOGE_1').resolves(mockParticipant);
            return identityManager.getParticipant('dogeid1')
                .then((participant) => {
                    participant.should.equal(mockParticipant);
                });
        });

        it('should throw an error for a missing mapping', () => {
            // An existing mapping for this user ID does not exist.
            mockSystemIdentities.get.withArgs('dogeid1').rejects(new Error('no such mapping'));
            // The participant exists.
            mockRegistry.get.withArgs('DOGE_1').resolves(mockParticipant);
            return identityManager.getParticipant('dogeid1')
                .should.be.rejectedWith(/no such mapping/);
        });

        it('should throw an error for an invalid mapping', () => {
            // An existing mapping for this user ID does not exist.
            mockSystemIdentities.get.withArgs('dogeid1').resolves({
                participant: 'org.doge.Doge@DOGE_1'
            });
            // The participant exists.
            mockRegistry.get.withArgs('DOGE_1').resolves(mockParticipant);
            return identityManager.getParticipant('dogeid1')
                .should.be.rejectedWith(/Invalid fully qualified participant identifier/);
        });

        it('should throw an error for an existing mapping but missing participant', () => {
            // An existing mapping for this user ID does exist.
            mockSystemIdentities.get.withArgs('dogeid1').resolves({
                participant: 'org.doge.Doge#DOGE_1'
            });
            // The participant does not exist.
            mockRegistry.get.withArgs('DOGE_1').rejects(new Error('no such participant'));
            return identityManager.getParticipant('dogeid1')
                .should.be.rejectedWith(/no such participant/);
        });

    });

});
