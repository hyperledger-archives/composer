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

const Factory = require('composer-common').Factory;
const ModelManager = require('composer-common').ModelManager;
const Historian = require('../lib/historian');
const Registry = require('../lib/registry');
const SecurityContext = require('composer-common').SecurityContext;
const Serializer = require('composer-common').Serializer;
const Util = require('composer-common').Util;

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('Historian', () => {

    let sandbox;
    let mockSecurityContext;
    let mockModelManager;
    let mockFactory;
    let mockSerializer;
    let registry;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        mockModelManager = sinon.createStubInstance(ModelManager);
        mockFactory = sinon.createStubInstance(Factory);
        mockSerializer = sinon.createStubInstance(Serializer);
        registry = new Historian('org.hyperledger.composer.system.HistorianRecord', 'wowsuchregistry', mockSecurityContext, mockModelManager, mockFactory, mockSerializer);
        sandbox.stub(Util, 'securityCheck');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#getHistorian', () => {

        it('should throw when modelManager not specified', () => {
            (function () {
                Historian.getHistorian(mockSecurityContext, null, mockFactory, mockSerializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', () => {
            (function () {
                Historian.getHistorian(mockSecurityContext, mockModelManager, null, mockSerializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', () => {
            (function () {
                Historian.getHistorian(mockSecurityContext, mockModelManager, mockFactory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the historian', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getRegistry').resolves(
                    {id: 'org.hyperledger.composer.system.HistorianRecord', name: 'doge registry'}
            );

            // Invoke the getIdentityRegistry function.
            return Historian
                .getHistorian(mockSecurityContext, mockModelManager, mockFactory, mockSerializer)
                .then((historian) => {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Registry.getRegistry);
                    sinon.assert.calledWith(Registry.getRegistry, mockSecurityContext, 'Asset', 'org.hyperledger.composer.system.HistorianRecord');

                    // Check that the identity registries were returned correctly.
                    historian.should.be.an.instanceOf(Historian);
                    historian.id.should.equal('org.hyperledger.composer.system.HistorianRecord');
                    historian.name.should.equal('Historian');

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getRegistry').rejects(new Error('failed to invoke chain-code'));

            // Invoke the getIdentityRegistry function.
            return Historian
                .getHistorian(mockSecurityContext, mockModelManager, mockFactory, mockSerializer)
                .then((identityRegistry) => {
                    throw new Error('should not get here');
                }).catch((error) => {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#add', () => {

        it('should throw an unsupported operation when called', () => {
            (() => {
                registry.add(null);
            }).should.throw(/cannot add historian records to the historian/);
        });

    });

    describe('#addAll', () => {

        it('should throw an unsupported operation when called', () => {
            (() => {
                registry.addAll(null);
            }).should.throw(/cannot add historian records to the historian/);
        });

    });

    describe('#update', () => {

        it('should throw an unsupported operation when called', () => {
            (() => {
                registry.update(null);
            }).should.throw(/cannot update historian records in the historian/);
        });

    });

    describe('#updateAll', () => {

        it('should throw an unsupported operation when called', () => {
            (() => {
                registry.updateAll(null);
            }).should.throw(/cannot update historian records in the historian/);
        });

    });

    describe('#remove', () => {

        it('should throw an unsupported operation when called', () => {
            (() => {
                registry.remove('dogecar1');
            }).should.throw(/cannot remove historian records from the historian/);
        });

    });

    describe('#removeAll', () => {

        it('should throw an unsupported operation when called', () => {
            (() => {
                registry.removeAll(null);
            }).should.throw(/cannot remove historian records from the historian/);
        });

    });

});
