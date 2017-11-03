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
const Admin = require('composer-admin');
const Common = require('composer-common');
const BusinessNetworkConnection = Client.BusinessNetworkConnection;
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const Serializer = Common.Serializer;
const ParticipantRegistry = require('composer-client/lib/participantregistry');
const Resource = Common.Resource;

const Add = require('../../lib/cmds/participant/addCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const NAMESPACE = 'net.biz.TestNetwork';

describe('composer participant add CLI unit tests', () => {

    let sandbox;
    let mockBusinessNetworkConnection;
    let mockBusinessNetwork;
    let mockSerializer;
    let mockResource;
    let mockParticipantRegistry;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockResource = sinon.createStubInstance(Resource);
        mockBusinessNetworkConnection.getBusinessNetwork.returns(mockBusinessNetwork);
        mockBusinessNetworkConnection.connect.withArgs('cardname').resolves();
        mockBusinessNetwork.getSerializer.returns(mockSerializer);
        mockSerializer.fromJSON.returns(mockResource);
        mockResource.getIdentifier.returns('SuccessKid');
        mockResource.getFullyQualifiedType.returns('org.doge.Doge');
        mockParticipantRegistry = sinon.createStubInstance(ParticipantRegistry);
        mockBusinessNetworkConnection.getParticipantRegistry.withArgs('org.doge.Doge').resolves(mockParticipantRegistry);

        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should add a new participant using the cardname', () => {
        mockBusinessNetworkConnection.connect.resolves();
        let argv = {
            card: 'cardname',
            data: '{"$class": "'+NAMESPACE+'", "success": "true"}'
        };
        return Add.handler(argv)
            .then((res) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockParticipantRegistry.add);
                sinon.assert.calledWith(mockParticipantRegistry.add, mockResource);
            });
    });

    it('should error when the participant cannot be added - registry rejects', () => {
        mockParticipantRegistry.add.rejects(new Error('such error'));

        let argv = {
            card: 'cardname',
            data: '{"$class": "'+NAMESPACE+'", "success": "true"}'
        };

        return Add.handler(argv)
            .should.be.rejectedWith(/such error/);
    });

    it('should error when the participant cannot be added - connect rejects', () => {
        mockBusinessNetworkConnection.connect.rejects(new Error('such error'));
        let argv = {
            card: 'inavlid',
            data: '{"$class": "'+NAMESPACE+'", "success": "true"}'
        };
        return Add.handler(argv)
            .should.be.rejectedWith(/such error/);
    });

});
