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

chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

const NAMESPACE = 'net.biz.TestNetwork';
const ENROLL_SECRET = 'SuccessKidWin';



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

        it('should not error when all requred params (card based) are specified', () => {
            sandbox.stub(CmdUtil, 'prompt').resolves(ENROLL_SECRET);

            let argv = {
                card: 'cardname',
                data: '{"$class": "'+NAMESPACE+'", "success": true}'
            };

            return Submit.handler(argv)
            .then((res) => {
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect,'cardname');

            });
        });

        it('should  error when can not parse the json (card based)', () => {
            sandbox.stub(JSON, 'parse').throws(new Error('failure'));

            let argv = {
                card: 'cardname',
                data: '{"$class": "'+NAMESPACE+'", "success": true}'
            };

            return Submit.handler(argv).should.be.rejectedWith(/JSON error/);
        });

        it('should error when the transaction fails to submit', () => {
            let argv = {
                card: 'cardname',
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
                card: 'cardname',
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
                card: 'cardname',
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
