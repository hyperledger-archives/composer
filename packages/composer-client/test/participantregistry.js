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

const ParticipantRegistry = require('../lib/participantregistry');
const Factory = require('composer-common').Factory;
const ModelManager = require('composer-common').ModelManager;
const Registry = require('../lib/registry');
const SecurityContext = require('composer-common').SecurityContext;
const Serializer = require('composer-common').Serializer;
const Util = require('composer-common').Util;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');


describe('ParticipantRegistry', () => {

    let sandbox;
    let mockSecurityContext;
    let modelManager;
    let factory;
    let serializer;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        modelManager = sinon.createStubInstance(ModelManager);
        factory = sinon.createStubInstance(Factory);
        serializer = sinon.createStubInstance(Serializer);
        sandbox.stub(Util, 'securityCheck');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#getAllParticipantRegistries', () => {

        it('should throw when modelManager not specified', () => {
            (() => {
                ParticipantRegistry.getAllParticipantRegistries(mockSecurityContext, null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', () => {
            (() => {
                ParticipantRegistry.getAllParticipantRegistries(mockSecurityContext, modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', () => {
            (() => {
                ParticipantRegistry.getAllParticipantRegistries(mockSecurityContext, modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the list of participant registries', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getAllRegistries').resolves([
                {id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', name: 'doge registry'},
                {id: '6165d4c2-73ee-43a6-b5b5-bac512a4894e', name: 'wow such registry'}
            ]);

            // Invoke the getAllParticipantRegistries function.
            return ParticipantRegistry
                .getAllParticipantRegistries(mockSecurityContext, modelManager, factory, serializer)
                .then((participantRegistries) => {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Registry.getAllRegistries);
                    sinon.assert.calledWith(Registry.getAllRegistries, mockSecurityContext, 'Participant');

                    // Check that the participant registries were returned correctly.
                    participantRegistries.should.be.an('array');
                    participantRegistries.should.have.lengthOf(2);
                    participantRegistries.should.all.be.an.instanceOf(ParticipantRegistry);
                    participantRegistries[0].id.should.equal('d2d210a3-5f11-433b-aa48-f74d25bb0f0d');
                    participantRegistries[0].name.should.equal('doge registry');
                    participantRegistries[1].id.should.equal('6165d4c2-73ee-43a6-b5b5-bac512a4894e');
                    participantRegistries[1].name.should.equal('wow such registry');

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getAllRegistries').rejects(new Error('such error'));

            // Invoke the getAllParticipantRegistries function.
            return ParticipantRegistry
                .getAllParticipantRegistries(mockSecurityContext, modelManager, factory, serializer)
                .should.be.rejectedWith(/such error/);

        });

    });


    describe('#participantRegistryExists', () => {

        it('should throw when id not specified', () => {
            (() => {
                ParticipantRegistry.participantRegistryExists(mockSecurityContext, null, modelManager, factory, serializer);
            }).should.throw(/id not specified/);
        });

        it('should throw when modelManager not specified', () => {
            (() => {
                ParticipantRegistry.participantRegistryExists(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', () => {
            (() => {
                ParticipantRegistry.participantRegistryExists(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', () => {
            (() => {
                ParticipantRegistry.participantRegistryExists(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return whether an asset registry exists', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'existsRegistry').resolves(true);

            // Invoke the getAllAssetRegistries function.
            return ParticipantRegistry.participantRegistryExists(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, serializer)
                .then((exists) => {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Registry.existsRegistry);
                    sinon.assert.calledWith(Registry.existsRegistry, mockSecurityContext, 'Participant', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d');

                    // Check that the existence was returned as true.
                    exists.should.equal.true;
                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'existsRegistry').rejects(new Error('such error'));

            // Invoke the getAllAssetRegistries function.
            return ParticipantRegistry.participantRegistryExists(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, serializer)
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#getParticipantRegistry', () => {

        it('should throw when id not specified', () => {
            (() => {
                ParticipantRegistry.getParticipantRegistry(mockSecurityContext, null, modelManager, factory, serializer);
            }).should.throw(/id not specified/);
        });

        it('should throw when modelManager not specified', () => {
            (() => {
                ParticipantRegistry.getParticipantRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', () => {
            (() => {
                ParticipantRegistry.getParticipantRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', () => {
            (() => {
                ParticipantRegistry.getParticipantRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the participant registry', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getRegistry').resolves({id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', name: 'doge registry'});

            // Invoke the getAllParticipantRegistries function.
            return ParticipantRegistry
                .getParticipantRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, serializer)
                .then((participantRegistry) => {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Registry.getRegistry);
                    sinon.assert.calledWith(Registry.getRegistry, mockSecurityContext, 'Participant', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d');

                    // Check that the participant registries were returned correctly.
                    participantRegistry.should.be.an.instanceOf(ParticipantRegistry);
                    participantRegistry.id.should.equal('d2d210a3-5f11-433b-aa48-f74d25bb0f0d');
                    participantRegistry.name.should.equal('doge registry');

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getRegistry').rejects(new Error('such error'));

            // Invoke the getAllParticipantRegistries function.
            return ParticipantRegistry
                .getParticipantRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, serializer)
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#addParticipantRegistry', () => {

        it('should throw when id not specified', () => {
            (() => {
                ParticipantRegistry.addParticipantRegistry(mockSecurityContext, null, 'doge registry', modelManager, factory, serializer);
            }).should.throw(/id not specified/);
        });

        it('should throw when name not specified', () => {
            (() => {
                ParticipantRegistry.addParticipantRegistry(mockSecurityContext, 'suchid', null, modelManager, factory, serializer);
            }).should.throw(/name not specified/);
        });

        it('should throw when modelManager not specified', () => {
            (() => {
                ParticipantRegistry.addParticipantRegistry(mockSecurityContext, 'suchid', 'doge registry', null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', () => {
            (() => {
                ParticipantRegistry.addParticipantRegistry(mockSecurityContext, 'suchid', 'doge registry', modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', () => {
            (() => {
                ParticipantRegistry.addParticipantRegistry(mockSecurityContext, 'suchid', 'doge registry', modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the participant registry', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'addRegistry').resolves();

            // Invoke the getAllParticipantRegistries function.
            return ParticipantRegistry
                .addParticipantRegistry(mockSecurityContext, 'suchid', 'doge registry', modelManager, factory, serializer)
                .then((participantRegistry) => {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Registry.addRegistry);
                    sinon.assert.calledWith(Registry.addRegistry, mockSecurityContext, 'Participant', 'suchid', 'doge registry');

                    // Check that the participant registry was returned successfully.
                    participantRegistry.should.be.an.instanceOf(ParticipantRegistry);
                    participantRegistry.id.should.equal('suchid');
                    participantRegistry.name.should.equal('doge registry');

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'addRegistry').rejects(new Error('such error'));

            // Invoke the getAllParticipantRegistries function.
            return ParticipantRegistry
                .addParticipantRegistry(mockSecurityContext, 'suchid', 'doge registry', modelManager, factory, serializer)
                .should.be.rejectedWith(/such error/);

        });

    });

});
