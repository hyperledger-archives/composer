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

const Request = require('../../lib/cmds/identity/requestCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');
const fs = require('fs');
const os = require('os');
const mkdirp = require('mkdirp');
const IdCard = require('composer-common').IdCard;
const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const PROFILE_NAME = 'myprofile';
const USER_ID = 'SuccessKid';
const USER_SECRET = 'humbolt';

describe('composer identity request CLI unit tests', () => {

    let sandbox;
    let mockAdminConnection;
    let testCard;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockAdminConnection = sinon.createStubInstance(Client.AdminConnection);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(process, 'exit');
        sandbox.stub(mkdirp, 'sync').returns();

        testCard = new IdCard({ userName: 'SuccessKid' , businessNetwork :'penguin-network',enrollmentSecret:'humbolt'}, { name: 'myprofile' });
        testCard.setCredentials({certificate:'cert',privateKey:'nottelling'});
        mockAdminConnection.getCard.resolves(testCard);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should request an identity using the specified profile and store in specified path', () => {
        let argv = {
            cardName : 'cardName',
            path: '/'
        };
        let fsStub = sandbox.stub(fs, 'writeFileSync');
        mockAdminConnection.requestIdentity.withArgs(PROFILE_NAME, USER_ID, USER_SECRET).resolves({
            certificate: 'a',
            key: 'b',
            rootCertificate: 'c',
            caName: 'caName'
        });
        return Request.handler(argv)
            .then(() => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockAdminConnection.requestIdentity);
                sinon.assert.calledWith(mockAdminConnection.requestIdentity, PROFILE_NAME, USER_ID, USER_SECRET);
                sinon.assert.calledThrice(fsStub);
                sinon.assert.calledWith(fsStub, '/SuccessKid-pub.pem', 'a');
                sinon.assert.calledWith(fsStub, '/SuccessKid-priv.pem', 'b');
                sinon.assert.calledWith(fsStub, '/caName-root.pem', 'c');
            });
    });

    it('should request an identity using the specified profile', () => {
        let argv = {
            cardName : 'cardName',
        };
        let fsStub = sandbox.stub(fs, 'writeFileSync');
        sandbox.stub(os, 'homedir').returns('/x');
        mockAdminConnection.requestIdentity.withArgs(PROFILE_NAME, USER_ID, USER_SECRET).resolves({
            certificate: 'a',
            key: 'b',
            rootCertificate: 'c',
            caName: 'caName'
        });
        return Request.handler(argv)
            .then(() => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockAdminConnection.requestIdentity);
                sinon.assert.calledWith(mockAdminConnection.requestIdentity, PROFILE_NAME, USER_ID, USER_SECRET);
                sinon.assert.calledThrice(fsStub);
                sinon.assert.calledWith(fsStub, '/x/.identityCredentials/SuccessKid-pub.pem', 'a');
                sinon.assert.calledWith(fsStub, '/x/.identityCredentials/SuccessKid-priv.pem', 'b');
                sinon.assert.calledWith(fsStub, '/x/.identityCredentials/caName-root.pem', 'c');
            });
    });


    it('should fail gracefully if requestIdentity fails', () => {
        let argv = {
            cardName : 'cardName',
        };

        mockAdminConnection.requestIdentity.withArgs(PROFILE_NAME, USER_ID, USER_SECRET).rejects('Error', 'some error');
        return Request.handler(argv)
            .should.be.rejectedWith(/some error/);
    });
});
