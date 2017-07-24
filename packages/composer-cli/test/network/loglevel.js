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

const Client = require('composer-admin');

const LogLevel = require('../../lib/cmds/network/loglevelCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const BUSINESS_NETWORK_NAME = 'net.biz.TestNetwork-0.0.1';
const PROFILE_NAME = 'defaultProfile';
const ENROLL_ID = 'SuccessKid';
const ENROLL_SECRET = 'SuccessKidWin';

describe('composer network logLevel CLI unit tests', () => {

    let sandbox;
    let mockAdminConnection;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockAdminConnection = sinon.createStubInstance(Client.AdminConnection);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        mockAdminConnection.getLogLevel.resolves('INFO');
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should query the current loglevel', () => {
        let argv = {
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET,
            connectionProfileName: PROFILE_NAME
        };

        return LogLevel.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, PROFILE_NAME, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockAdminConnection.getLogLevel);
            });
    });

    it('should set the loglevel', () => {
        let argv = {
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET,
            connectionProfileName: PROFILE_NAME,
            newlevel: 'DEBUG'
        };

        return LogLevel.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, PROFILE_NAME, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockAdminConnection.setLogLevel);
                sinon.assert.calledWith(mockAdminConnection.setLogLevel, 'DEBUG');
            });
    });


});
