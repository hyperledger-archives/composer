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

const Ping = require('../../lib/cmds/network/pingCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

const sinon = require('sinon');

const BUSINESS_NETWORK_NAME = 'net.biz.TestNetwork-0.0.1';
const DEFAULT_PROFILE_NAME = 'defaultProfile';
const ENROLL_ID = 'SuccessKid';
const ENROLL_SECRET = 'SuccessKidWin';

describe('composer network ping CLI unit tests', () => {

    let sandbox;
    let mockBusinessNetworkConnection;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkConnection.connect.resolves();
        mockBusinessNetworkConnection.ping.resolves({
            version: '9.9.9',
            participant: null
        });
        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should test the connection to the business network using the default profile', () => {
        let argv = {
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET
        };
        return Ping.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, DEFAULT_PROFILE_NAME, argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
                sinon.assert.calledWith(mockBusinessNetworkConnection.ping);
            });
    });

    it('should test the connection to the business network using the specified profile', () => {
        let argv = {
            connectionProfileName: 'someOtherProfile',
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET
        };
        return Ping.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'someOtherProfile', argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
                sinon.assert.calledWith(mockBusinessNetworkConnection.ping);
            });
    });

    it('should prompt for the enrollment secret if not specified', () => {
        sandbox.stub(CmdUtil, 'prompt').resolves(ENROLL_SECRET);
        let argv = {
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID
        };
        return Ping.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, DEFAULT_PROFILE_NAME, argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
                sinon.assert.calledWith(mockBusinessNetworkConnection.ping);
            });
    });

    it('should display the participant if a participant was found', () => {
        mockBusinessNetworkConnection.ping.resolves({
            version: '9.9.9',
            participant: 'org.doge.Doge#DOGE_1'
        });
        let argv = {
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET
        };
        return Ping.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, DEFAULT_PROFILE_NAME, argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
                sinon.assert.calledWith(mockBusinessNetworkConnection.ping);
            });
    });

    it('should error when the connection cannot be tested', () => {
        mockBusinessNetworkConnection.ping.rejects(new Error('such error'));
        let argv = {
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET
        };
        return Ping.handler(argv)
            .catch((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, DEFAULT_PROFILE_NAME, argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
                sinon.assert.calledWith(mockBusinessNetworkConnection.ping);
            });
    });

});
