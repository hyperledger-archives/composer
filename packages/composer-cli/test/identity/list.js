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

const Client = require('composer-client');
const BusinessNetworkConnection = Client.BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const Factory = require('composer-common').Factory;
const IdentityRegistry = Client.IdentityRegistry;
const ModelManager = require('composer-common').ModelManager;
const Serializer = require('composer-common').Serializer;

const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');
const List = require('../../lib/cmds/identity/listCommand.js');

const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

describe('composer identity list CLI unit tests', () => {

    let sandbox;
    let mockBusinessNetworkConnection;
    let mockBusinessNetworkDefinition;
    let mockIdentityRegistry;
    let factory;
    let modelManager;
    let serializer;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        modelManager = new ModelManager();
        factory = new Factory(modelManager);
        serializer = new Serializer(factory, modelManager);
        mockBusinessNetworkDefinition.getSerializer.returns(serializer);
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkConnection.connect.resolves(mockBusinessNetworkDefinition);
        mockBusinessNetworkConnection.connectWithDetails.resolves(mockBusinessNetworkDefinition);
        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.stub(process, 'exit');
        mockIdentityRegistry = sinon.createStubInstance(IdentityRegistry);
        mockBusinessNetworkConnection.getIdentityRegistry.resolves(mockIdentityRegistry);
        const identity1 = factory.newResource('org.hyperledger.composer.system', 'Identity', 'eac9f8ff4e0a0df8017a40313c12bdfb9597928526d651e620598d17c9c875ca');
        Object.assign(identity1, {
            name: 'doge',
            issuer: '27c582d674ddf0f230854814b7cfd04553f3d0eac55e37d915386c614a5a1de9',
            state: 'ISSUED',
            certificate: '',
            participant: factory.newRelationship('org.hyperledger.composer.system', 'Participant', 'doge@email.com')
        });
        const identity2 = factory.newResource('org.hyperledger.composer.system', 'Identity', '3b6cf18fe92474b6bc720401d5fb9590a3e2e3b67b1aa64ba7d3db85e746a3ba');
        Object.assign(identity2, {
            name: 'alice',
            issuer: '88dda6ddb993ad5d0330f4e909ee4daf80571560bc4b8ef8df5a962e69d3fc77',
            state: 'ISSUED',
            certificate: '',
            participant: factory.newRelationship('org.hyperledger.composer.system', 'Participant', 'alice@email.com')
        });
        mockIdentityRegistry.getAll.resolves([identity1, identity2]);
        sandbox.spy(console, 'log');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should list all identities in the business network using the specified profile', () => {
        let argv = {
            card :'cardName',
            participantId: 'org.doge.Doge#DOGE_1',
            certificateFile: 'admin.pem'
        };
        return List.handler(argv)
            .then((res) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardName');
                sinon.assert.calledOnce(mockIdentityRegistry.getAll);
                sinon.assert.calledWith(console.log, sinon.match(/identityId:.*eac9f8ff4e0a0df8017a40313c12bdfb9597928526d651e620598d17c9c875ca/));
                sinon.assert.calledWith(console.log, sinon.match(/identityId:.*3b6cf18fe92474b6bc720401d5fb9590a3e2e3b67b1aa64ba7d3db85e746a3ba/));
            });
    });

    it('should error if the identities cannot be listed', () => {
        mockIdentityRegistry.getAll.rejects(new Error('such error'));

        let argv = {
            card :'cardName',
            participantId: 'org.doge.Doge#DOGE_1',
            certificateFile: 'admin.pem'
        };
        return List.handler(argv)
            .should.be.rejectedWith(/such error/);
    });

});
