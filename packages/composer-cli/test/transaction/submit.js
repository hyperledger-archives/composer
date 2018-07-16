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

const { BusinessNetworkConnection } = require('composer-client');
const { BusinessNetworkDefinition } = require('composer-common');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');
const Pretty = require('prettyjson');
const Submit = require('../../lib/cmds/transaction/submitCommand.js');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

const ENROLL_SECRET = 'SuccessKidWin';

describe('composer transaction submit CLI unit tests', () => {
    let sandbox;
    let mockBusinessNetworkConnection;
    let businessNetworkDefinition;
    let modelManager;
    let factory;
    let spyPretty;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        businessNetworkDefinition = new BusinessNetworkDefinition('test-network@0.0.1');
        modelManager = businessNetworkDefinition.getModelManager();
        modelManager.addModelFile(`
        namespace org.acme
        concept MyConcept {
            o String value
        }
        transaction MyTransaction {
            o Boolean success
        }`);
        factory = businessNetworkDefinition.getFactory();

        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkConnection.getBusinessNetwork.returns(businessNetworkDefinition);
        mockBusinessNetworkConnection.connect.resolves();

        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.stub(process, 'exit');
        spyPretty = sandbox.spy(Pretty, 'render');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#hander', () => {

        it('should not error when all requred params (card based) are specified', async () => {
            sandbox.stub(CmdUtil, 'prompt').resolves(ENROLL_SECRET);

            let argv = {
                card: 'cardname',
                data: '{"$class": "org.acme.MyTransaction", "success": true}'
            };

            await Submit.handler(argv);
            sinon.assert.calledWith(mockBusinessNetworkConnection.connect,'cardname');
        });

        it('should not error when the transaction returns a primitive value', async () => {
            mockBusinessNetworkConnection.submitTransaction.resolves('foobar');
            sandbox.stub(CmdUtil, 'prompt').resolves(ENROLL_SECRET);

            let argv = {
                card: 'cardname',
                data: '{"$class": "org.acme.MyTransaction", "success": true}'
            };

            await Submit.handler(argv);
            sinon.assert.calledWith(mockBusinessNetworkConnection.connect,'cardname');
            sinon.assert.calledOnce(spyPretty);
            sinon.assert.calledWith(spyPretty, 'foobar');
        });

        it('should not error when the transaction returns an array of primitive values', async () => {
            mockBusinessNetworkConnection.submitTransaction.resolves(['foobar', 'doge', 'cat']);
            sandbox.stub(CmdUtil, 'prompt').resolves(ENROLL_SECRET);

            let argv = {
                card: 'cardname',
                data: '{"$class": "org.acme.MyTransaction", "success": true}'
            };

            await Submit.handler(argv);
            sinon.assert.calledWith(mockBusinessNetworkConnection.connect,'cardname');
            sinon.assert.calledOnce(spyPretty);
            sinon.assert.calledWith(spyPretty, ['foobar', 'doge', 'cat']);
        });

        it('should not error when the transaction returns a concept value', async () => {
            const concept = factory.newConcept('org.acme', 'MyConcept');
            concept.value = 'foobar';
            mockBusinessNetworkConnection.submitTransaction.resolves(concept);
            sandbox.stub(CmdUtil, 'prompt').resolves(ENROLL_SECRET);

            let argv = {
                card: 'cardname',
                data: '{"$class": "org.acme.MyTransaction", "success": true}'
            };

            await Submit.handler(argv);
            sinon.assert.calledWith(mockBusinessNetworkConnection.connect,'cardname');
            sinon.assert.calledOnce(spyPretty);
            sinon.assert.calledWith(spyPretty, { $class: 'org.acme.MyConcept', value: 'foobar' });
        });

        it('should not error when the transaction returns an array of concept values', async () => {
            const concept1 = factory.newConcept('org.acme', 'MyConcept');
            concept1.value = 'foobar';
            const concept2 = factory.newConcept('org.acme', 'MyConcept');
            concept2.value = 'doge';
            const concept3 = factory.newConcept('org.acme', 'MyConcept');
            concept3.value = 'cat';
            mockBusinessNetworkConnection.submitTransaction.resolves([concept1, concept2, concept3]);
            sandbox.stub(CmdUtil, 'prompt').resolves(ENROLL_SECRET);

            let argv = {
                card: 'cardname',
                data: '{"$class": "org.acme.MyTransaction", "success": true}'
            };

            await Submit.handler(argv);
            sinon.assert.calledWith(mockBusinessNetworkConnection.connect,'cardname');
            sinon.assert.calledOnce(spyPretty);
            sinon.assert.calledWith(spyPretty, [{ $class: 'org.acme.MyConcept', value: 'foobar' }, { $class: 'org.acme.MyConcept', value: 'doge' }, { $class: 'org.acme.MyConcept', value: 'cat' }]);
        });

        it('should  error when can not parse the json (card based)', async () => {
            let argv = {
                card: 'cardname',
                data: '{"$class": "org.acme.MyTransaction", "success": true'
            };

            await Submit.handler(argv).should.be.rejectedWith(/JSON error/);
        });

        it('should error when the transaction fails to submit', async () => {
            let argv = {
                card: 'cardname',
                data: '{"$class": "org.acme.MyTransaction", "success": true}'
            };

            mockBusinessNetworkConnection.submitTransaction.rejects(new Error('some error'));
            await Submit.handler(argv)
                .should.be.rejectedWith(/some error/);
        });

        it('should error if data is not a string', async () => {
            let argv = {
                card: 'cardname',
                data: {}
            };

            await Submit.handler(argv)
                .should.be.rejectedWith(/Data must be a string/);
        });

        it('should error if data class is not supplied', async () => {
            let argv = {
                card: 'cardname',
                data: '{"success": true}'
            };

            await Submit.handler(argv)
                .should.be.rejectedWith(/\$class attribute not supplied/);
        });
    });
});
