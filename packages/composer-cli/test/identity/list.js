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
const ParticipantRegistry = Client.ParticipantRegistry;
const IdentityRegistry = Client.IdentityRegistry;
const Common = require('composer-common');
const BusinessNetworkDefinition = Common.BusinessNetworkDefinition;
const Factory = Common.Factory;
const Resource = Common.Resource;
const ModelManager = Common.ModelManager;
const Serializer = Common.Serializer;

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
        const identity3 = factory.newResource('org.hyperledger.composer.system', 'Identity', 'bfb8c488c0cdec07d9beeef6d97c27a77965ed9a8e30b57e40ea1eb399d8a1bd');
        Object.assign(identity3, {
            name: 'admin',
            issuer: 'ac3dbcbe135ba48b29f97665bb103f8260c38d3872473e584314392797c595f3',
            state: 'ACTIVATED',
            certificate: '',
            participant: factory.newRelationship('org.hyperledger.composer.system', 'NetworkAdmin', 'admin')
        });

        const identity4 = factory.newResource('org.hyperledger.composer.system', 'Identity', 'd1fa10f09219c13aeecbbbc4823a391f769b64f17124f2c136a9c09d7fd3789f');
        Object.assign(identity4, {
            name: 'bob',
            issuer: 'bfb8c488c0cdec07d9beeef6d97c27a77965ed9a8e30b57e40ea1eb399d8a1be',
            state: 'REVOKED',
            certificate: '',
            participant: factory.newRelationship('org.hyperledger.composer.system', 'Participant', 'bob@email.com')
        });
        mockIdentityRegistry.getAll.resolves([identity1, identity2, identity3, identity4]);
        sandbox.spy(console, 'log');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should list all identities in the business network using the specified profile marking those where the participant does not exist', () => {
        let mockParticpantRegistry = sinon.createStubInstance(ParticipantRegistry);
        let mockParticipant1 = sinon.createStubInstance(Resource);
        mockParticipant1.getFullyQualifiedIdentifier.returns('org.hyperledger.composer.system.Participant#alice@email.com');
        mockParticpantRegistry.getAll.returns([mockParticipant1]);
        mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.resolve([mockParticpantRegistry]));

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
                sinon.assert.calledOnce(mockBusinessNetworkConnection.getAllParticipantRegistries);
                sinon.assert.calledWith(console.log, sinon.match(/identityId:.*eac9f8ff4e0a0df8017a40313c12bdfb9597928526d651e620598d17c9c875ca/));
                sinon.assert.calledWith(console.log, sinon.match(/identityId:.*3b6cf18fe92474b6bc720401d5fb9590a3e2e3b67b1aa64ba7d3db85e746a3ba/));
                sinon.assert.calledWith(console.log, sinon.match(/identityId:.*bfb8c488c0cdec07d9beeef6d97c27a77965ed9a8e30b57e40ea1eb399d8a1bd/));
                sinon.assert.calledWith(console.log, sinon.match(/identityId:.*d1fa10f09219c13aeecbbbc4823a391f769b64f17124f2c136a9c09d7fd3789f/));
                sinon.assert.calledWith(console.log, sinon.match(/state:.*ISSUED/));
                sinon.assert.calledWith(console.log, sinon.match(/state:.*BOUND PARTICIPANT NOT FOUND/));
                sinon.assert.calledWith(console.log, sinon.match(/state:.*ACTIVATED/));
                sinon.assert.calledWith(console.log, sinon.match(/state:.*REVOKED/));
            });
    });

    it('should error if the identities cannot be listed', () => {
        mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.resolve([]));
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
