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
const Admin = require('composer-admin');
const AdminConnection = Admin.AdminConnection;
const IdCard = require('composer-common').IdCard;
const Issue = require('../../lib/cmds/identity/issueCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');
const Export = require('../../lib/cmds/card/lib/export.js');
const Create = require('../../lib/cmds/card/lib/create');
const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const fs = require('fs');

const BUSINESS_NETWORK_NAME = 'net.biz.TestNetwork-0.0.1';
const ENROLL_ID = 'SuccessKid';
const ENROLL_SECRET = 'SuccessKidWin';

describe('composer identity issue CLI unit tests', () => {

    let sandbox;
    let mockBusinessNetworkConnection;
    let mockAdminConnection;
    let testCard;
    let cardCreateSpy;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockAdminConnection = sinon.createStubInstance(AdminConnection);
        mockBusinessNetworkConnection.connect.withArgs('cardname').resolves();
        mockBusinessNetworkConnection.issueIdentity.withArgs('org.doge.Doge#DOGE_1', 'dogeid1', sinon.match.object).resolves({
            userID: 'dogeid1',
            userSecret: 'suchsecret'
        });
        sandbox.stub(fs,'writeFileSync');
        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);

        testCard = new IdCard({ userName: 'conga' , businessNetwork :'penguin-network'}, { name: 'profileName' });

        cardCreateSpy = sandbox.spy(Create,'createCard');

        mockAdminConnection.exportCard.returns(testCard);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should issue a new identity using the specified profile', () => {
        let argv = {
            card:'cardname',
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1'
        };
        return Issue.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { issuer: false });
                sinon.assert.calledOnce(cardCreateSpy);
                sinon.assert.calledWith(cardCreateSpy,{
                    businessNetwork: 'penguin-network',
                    enrollmentSecret: 'suchsecret',
                    userName: 'dogeid1',
                    version: 1
                },{ name: 'profileName' },sinon.match(argv));
            });
    });

    it('should handle optional arguments', () => {
        let argv = {
            card:'cardname',
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1',
            option: ['opt1=value1', 'opt2=value2']
        };
        return Issue.handler(argv)
            .then((res) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect,'cardname');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { opt1: 'value1', opt2: 'value2', issuer: false });
                sinon.assert.calledOnce(cardCreateSpy);
                sinon.assert.calledWith(cardCreateSpy,{
                    businessNetwork: 'penguin-network',
                    enrollmentSecret: 'suchsecret',
                    userName: 'dogeid1',
                    version: 1
                },{ name: 'profileName' },sinon.match(argv));
            });
    });

    it('should handle optional arguments file', () => {
        let argv = {
            card:'cardname',
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1',
            optionsFile: '/path/to/options.json'
        };
        const optionsObject = {
            affiliation: 'example.com',
            role: 'admin'
        };
        const optionFileContents = JSON.stringify(optionsObject);
        sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(optionFileContents);
        sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(true);

        return Issue.handler(argv)
            .then((res) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { affiliation: 'example.com', role: 'admin', issuer: false });
                sinon.assert.calledOnce(cardCreateSpy);
                sinon.assert.calledWith(cardCreateSpy,{
                    businessNetwork: 'penguin-network',
                    enrollmentSecret: 'suchsecret',
                    userName: 'dogeid1',
                    version: 1
                },{ name: 'profileName' },sinon.match(argv));
            });
    });



    it('should issue a new identity with issuer priviledges', () => {
        mockBusinessNetworkConnection.issueIdentity.withArgs('org.doge.Doge#DOGE_1', 'dogeid1', { issuer: true }).resolves({
            userID: 'dogeid1',
            userSecret: 'suchsecret'
        });
        let argv = {
            card:'cardname',
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1',
            issuer: true
        };
        return Issue.handler(argv)
            .then((res) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { issuer: true });
                sinon.assert.calledOnce(cardCreateSpy);
                sinon.assert.calledWith(cardCreateSpy,{
                    businessNetwork: 'penguin-network',
                    enrollmentSecret: 'suchsecret',
                    userName: 'dogeid1',
                    version: 1
                },{ name: 'profileName' },sinon.match(argv));
            });
    });

    it('should error when the new identity cannot be issued', () => {
        mockBusinessNetworkConnection.issueIdentity.withArgs('org.doge.Doge#DOGE_1', 'dogeid1', { issuer: false }).rejects(new Error('such error'));
        let argv = {
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET,
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1'
        };
        return Issue.handler(argv)
            .should.be.rejectedWith(/such error/);
    });

    it('should issue a new card using the specified profile', () => {
        let argv = {
            card:'cardname',
            file: 'filename',
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1'
        };
        sandbox.stub(fs,'readFileSync').resolves();
        sandbox.stub(Export,'writeCardToFile').resolves();

        return Issue.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { issuer: false });
                sinon.assert.calledOnce(cardCreateSpy);
                sinon.assert.calledWith(cardCreateSpy,{
                    businessNetwork: 'penguin-network',
                    enrollmentSecret: 'suchsecret',
                    userName: 'dogeid1',
                    version: 1
                },{ name: 'profileName' },sinon.match(argv));
            });
    });

});
