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
const Resource = Common.Resource;

const Submit = require('../../lib/cmds/transaction/submitCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

const chai = require('chai');
const sinon = require('sinon');

require('sinon-as-promised');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));
// let expect = chai.expect;

const NAMESPACE = 'net.biz.TestNetwork';
const BUSINESS_NETWORK_NAME = 'net.biz.TestNetwork-0.0.1';
const DEFAULT_PROFILE_NAME = 'defaultProfile';
const ENROLL_ID = 'SuccessKid';
const ENROLL_SECRET = 'SuccessKidWin';

//const DEFAULT_PROFILE_NAME = 'defaultProfile';
// const CREDENTIALS_ROOT = homedir() + '/.composer-credentials';


describe('composer transaction submit CLI unit tests', () => {
    let sandbox;
    let mockBusinessNetworkConnection;
    let mockBusinessNetwork;
    let mockSerializer;
    let mockResource;

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

        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#hander', () => {
        it('should submit a transaction when all requred params are specified', () => {
            let argv = {
                connectionProfileName: DEFAULT_PROFILE_NAME,
                businessNetworkName: BUSINESS_NETWORK_NAME,
                enrollId: ENROLL_ID,
                enrollSecret: ENROLL_SECRET,
                data: '{"$class": "'+NAMESPACE+'", "success": true}'
            };

            return Submit.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, argv.connectionProfileName, argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.getBusinessNetwork);
                sinon.assert.calledOnce(mockBusinessNetwork.getSerializer);
                sinon.assert.calledOnce(mockSerializer.fromJSON);
                sinon.assert.calledWith(mockSerializer.fromJSON, JSON.parse(argv.data));

            });
        });

        it('should not error when connection profile name is not given', () => {

            let argv = {
                businessNetworkName: BUSINESS_NETWORK_NAME,
                enrollId: ENROLL_ID,
                enrollSecret: ENROLL_SECRET,
                data: '{"$class": "'+NAMESPACE+'", "success": true}'
            };

            return Submit.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'defaultProfile', argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.getBusinessNetwork);
                sinon.assert.calledOnce(mockBusinessNetwork.getSerializer);
                sinon.assert.calledOnce(mockSerializer.fromJSON);
                sinon.assert.calledWith(mockSerializer.fromJSON, JSON.parse(argv.data));

            });
        });

        it('should not error when all requred params are specified', () => {
            sandbox.stub(CmdUtil, 'prompt').resolves(ENROLL_SECRET);

            let argv = {
                connectionProfileName: DEFAULT_PROFILE_NAME,
                businessNetworkName: BUSINESS_NETWORK_NAME,
                enrollId: ENROLL_ID,
                data: '{"$class": "'+NAMESPACE+'", "success": true}'
            };

            return Submit.handler(argv)
            .then((res) => {
                sinon.assert.calledWith(CmdUtil.prompt);

            });
        });

        it('should error when the transaction fails to submit', () => {
            let argv = {
                connectionProfileName: DEFAULT_PROFILE_NAME,
                businessNetworkName: BUSINESS_NETWORK_NAME,
                enrollId: ENROLL_ID,
                enrollSecret: ENROLL_SECRET,
                data: '{"$class": "'+NAMESPACE+'", "success": true}'
            };

            mockBusinessNetworkConnection.submitTransaction.rejects(new Error('some error'));
            return Submit.handler(argv)
                .then((res) => {
                    // sinon.assert.calledWith(process.exit, 1);
                }).catch((error) => {
                    error.toString().should.equal('Error: some error');
                });
        });

        it('should error if data is not a string', () => {
            let argv = {
                connectionProfileName: DEFAULT_PROFILE_NAME,
                businessNetworkName: BUSINESS_NETWORK_NAME,
                enrollId: ENROLL_ID,
                enrollSecret: ENROLL_SECRET,
                data: {}
            };

            return Submit.handler(argv)
                .then((res) => {
                }).catch((error) => {
                    error.toString().should.equal('Error: Data must be a string');
                });
        });

        it('should error if data class is not supplied', () => {
            let argv = {
                connectionProfileName: DEFAULT_PROFILE_NAME,
                businessNetworkName: BUSINESS_NETWORK_NAME,
                enrollId: ENROLL_ID,
                enrollSecret: ENROLL_SECRET,
                data: '{"success": true}'
            };

            return Submit.handler(argv)
                .then((res) => {
                }).catch((error) => {
                    error.toString().should.equal('Error: $class attribute not supplied');
                });
        });
    });
});
