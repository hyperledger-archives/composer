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

const Import = require('../../lib/cmds/identity/importCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');
const fs = require('fs');

const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const PROFILE_NAME = 'myprofile';
const USER_ID = 'SuccessKid';
const CERT_PATH = 'someCertPath';
const KEY_PATH = 'someKeyPath';

describe('composer identity import CLI unit tests', () => {

    let sandbox;
    let mockAdminConnection;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockAdminConnection = sinon.createStubInstance(Client.AdminConnection);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should import a new identity using the specified profile', () => {
        let argv = {
            connectionProfileName: PROFILE_NAME,
            userId: USER_ID,
            publicKeyFile: CERT_PATH,
            privateKeyFile: KEY_PATH
        };

        let fsStub = sandbox.stub(fs, 'readFileSync').withArgs(CERT_PATH).returns('acert');
        fsStub.withArgs(KEY_PATH).returns('akey');
        mockAdminConnection.importIdentity.withArgs(PROFILE_NAME, USER_ID, 'acert', 'akey').resolves();
        return Import.handler(argv)
            .then(() => {
                sinon.assert.calledOnce(mockAdminConnection.importIdentity);
                sinon.assert.calledWith(mockAdminConnection.importIdentity, PROFILE_NAME, USER_ID, 'acert', 'akey');
            });
    });

    it('should fail gracefully if importIdentity fails', () => {
        let argv = {
            connectionProfileName: PROFILE_NAME,
            userId: USER_ID,
            publicKeyFile: CERT_PATH,
            privateKeyFile: KEY_PATH
        };

        let fsStub = sandbox.stub(fs, 'readFileSync').withArgs(CERT_PATH).returns('acert');
        fsStub.withArgs(KEY_PATH).returns('akey');
        mockAdminConnection.importIdentity.withArgs(PROFILE_NAME, USER_ID, 'acert', 'akey').rejects('Error', 'some error');
        return Import.handler(argv)
            .should.be.rejectedWith(/some error/);
    });

    it('should fail gracefully if cert file cannot be found', () => {
        let argv = {
            connectionProfileName: PROFILE_NAME,
            userId: USER_ID,
            publicKeyFile: CERT_PATH,
            privateKeyFile: KEY_PATH
        };

        let fsStub = sandbox.stub(fs, 'readFileSync').withArgs(CERT_PATH).throws(new Error('no file found'));
        fsStub.withArgs(KEY_PATH).returns('akey');
        mockAdminConnection.importIdentity.withArgs(PROFILE_NAME, USER_ID, 'acert', 'akey').resolves();
        return Import.handler(argv)
            .should.be.rejectedWith(/no file found/);

    });

    it('should fail gracefully if key file cannot be found', () => {
        let argv = {
            connectionProfileName: PROFILE_NAME,
            userId: USER_ID,
            publicKeyFile: CERT_PATH,
            privateKeyFile: KEY_PATH
        };

        let fsStub = sandbox.stub(fs, 'readFileSync').withArgs(CERT_PATH).returns('acert');
        fsStub.withArgs(KEY_PATH).throws(new Error('no key file found'));
        mockAdminConnection.importIdentity.withArgs(PROFILE_NAME, USER_ID, 'acert', 'akey').resolves();
        return Import.handler(argv)
            .should.be.rejectedWith(/no key file found/);

    });

});
