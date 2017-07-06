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
require('sinon-as-promised');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const NAMESPACE = 'net.biz.TestNetwork';
const BUSINESS_NETWORK_NAME = 'net.biz.TestNetwork-0.0.1';
const DEFAULT_PROFILE_NAME = 'defaultProfile';
const ENROLL_ID = 'SuccessKid';
const ENROLL_SECRET = 'SuccessKidWin';

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
        mockBusinessNetworkConnection.connect.resolves();
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

    it('should add a new participant using the default profile', () => {
        let argv = {
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET,
            data: '{"$class": "'+NAMESPACE+'", "success": "true"}'
        };
        return Add.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, DEFAULT_PROFILE_NAME, argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockParticipantRegistry.add);
                sinon.assert.calledWith(mockParticipantRegistry.add, mockResource);

            });
    });

    it('should add a new participant using the specified profile', () => {
        let argv = {
            connectionProfileName: 'someOtherProfile',
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET,
            data: '{"$class": "'+NAMESPACE+'", "success": "true"}'
        };
        return Add.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, argv.connectionProfileName, argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockParticipantRegistry.add);
                sinon.assert.calledWith(mockParticipantRegistry.add, mockResource);

            });
    });

    it('should prompt for the enrollment secret if not specified', () => {
        sandbox.stub(CmdUtil, 'prompt').resolves(ENROLL_SECRET);
        let argv = {
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            data: '{"$class": "'+NAMESPACE+'", "success": "true"}'
        };
        return Add.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, DEFAULT_PROFILE_NAME, argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockParticipantRegistry.add);
                sinon.assert.calledWith(mockParticipantRegistry.add, mockResource);

            });
    });

    it('should error when the participant cannot be added', () => {
        mockParticipantRegistry.add.rejects(new Error('such error'));
        let argv = {
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET,
            data: '{"$class": "'+NAMESPACE+'", "success": "true"}'
        };
        return Add.handler(argv)
            .should.be.rejectedWith(/such error/);
    });

});
