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

const Bind = require('../../lib/cmds/identity/bindCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const fs = require('fs');

describe('composer identity bind CLI unit tests', () => {

    const pem = '-----BEGIN CERTIFICATE-----\nMIIB8TCCAZegAwIBAgIUKhzgF0nmP1Zl6uubdgq6wFohMC8wCgYIKoZIzj0EAwIw\nczELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\nbiBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT\nE2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMTcwNzEyMjIzNzAwWhcNMTgwNzEyMjIz\nNzAwWjAQMQ4wDAYDVQQDEwVhZG1pbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IA\nBPnG/X+v7R2ljdtRoreLnub9vlvU9BmF7LTuklTC0iHJr96ecQRkx6OCE8nDK09G\n5P6LvL95PUxlhDDdlStqASGjbDBqMA4GA1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8E\nAjAAMB0GA1UdDgQWBBQl3QT+2qX5eTM2zaJ+MjU4vF+NQDArBgNVHSMEJDAigCAZ\nq2WruwSAfa0S5MCpqqZknnCGjjq9AhejItieR+GmrjAKBggqhkjOPQQDAgNIADBF\nAiEAok4RzwsOX7lSkUmGK+yfr9reJxvtyCHxQ68YC7blAQECIB3T3H0iwX+2MZaX\nmJucq33qkeHpFiq1focn3o6WAx/x\n-----END CERTIFICATE-----\n';

    let sandbox;
    let mockBusinessNetworkConnection;


    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkConnection.connect.withArgs('cardName').resolves();
        mockBusinessNetworkConnection.bindIdentity.withArgs('org.doge.Doge#DOGE_1', pem, sinon.match.object).resolves({
            userID: 'dogeid1',
            userSecret: 'suchsecret'
        });
        sandbox.stub(fs, 'readFileSync').withArgs('admin.pem').returns(pem);
        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should bind an existing identity using the specified profile', () => {
        let argv = {
            card:'cardName',
            participantId: 'org.doge.Doge#DOGE_1',
            certificateFile: 'admin.pem'
        };
        return Bind.handler(argv)
            .then((res) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardName');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.bindIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.bindIdentity, 'org.doge.Doge#DOGE_1', pem);
            });
    });

    it('should error when the certificate file cannot be read', () => {
        fs.readFileSync.withArgs('admin.pem').throws(new Error('such error'));
        let argv = {
            card:'cardName',
            participantId: 'org.doge.Doge#DOGE_1',
            certificateFile: 'admin.pem'
        };
        return Bind.handler(argv)
            .should.be.rejectedWith(/such error/);
    });

    it('should error when the existing identity cannot be bound', () => {
        mockBusinessNetworkConnection.bindIdentity.withArgs('org.doge.Doge#DOGE_1', pem).rejects(new Error('such error'));
        let argv = {
            card:'cardName',
            participantId: 'org.doge.Doge#DOGE_1',
            certificateFile: 'admin.pem'
        };
        return Bind.handler(argv)
            .should.be.rejectedWith(/such error/);
    });

});
