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
    let mockIdCard;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockAdminConnection = sinon.createStubInstance(AdminConnection);
        mockIdCard = sinon.createStubInstance(IdCard);
        mockBusinessNetworkConnection.connect.resolves();
        mockBusinessNetworkConnection.issueIdentity.withArgs('org.doge.Doge#DOGE_1', 'dogeid1', sinon.match.object).resolves({
            userID: 'dogeid1',
            userSecret: 'suchsecret'
        });
        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        mockAdminConnection.getCard.returns(mockIdCard);

        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('test the yargs builder function', ()=>{
        let mockYargs = {options:()=>{},conflicts:()=>{},check:()=>{},group:()=>{}};

        sinon.stub(mockYargs,'options').returns();
        sinon.stub(mockYargs,'conflicts').returns();
        sinon.spy(mockYargs,'check');
        sinon.stub(mockYargs,'group').returns();

        Issue.builder(mockYargs);
        sinon.assert.calledOnce(mockYargs.options);
        sinon.assert.calledOnce(mockYargs.conflicts);
        sinon.assert.calledOnce(mockYargs.check);
        sinon.assert.calledThrice(mockYargs.group);
    });

    it('should issue a new identity using the specified profile', () => {
        let argv = {
            connectionProfileName: 'someOtherProfile',
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET,
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1'
        };
        return Issue.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connectWithDetails);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connectWithDetails, 'someOtherProfile', argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { issuer: false });

            });
    });

    it('should handle optional arguments', () => {
        let argv = {
            connectionProfileName: 'someOtherProfile',
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET,
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1',
            option: ['opt1=value1', 'opt2=value2']
        };
        return Issue.handler(argv)
            .then((res) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connectWithDetails);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connectWithDetails, 'someOtherProfile', argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { opt1: 'value1', opt2: 'value2', issuer: false });

            });
    });

    it('should handle optional arguments file', () => {
        let argv = {
            connectionProfileName: 'someOtherProfile',
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET,
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
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connectWithDetails);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connectWithDetails, 'someOtherProfile', argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { affiliation: 'example.com', role: 'admin', issuer: false });
            });
    });


    it('should prompt for the enrollment secret if not specified', () => {
        sandbox.stub(CmdUtil, 'prompt').resolves(ENROLL_SECRET);
        let argv = {
            connectionProfileName: 'someOtherProfile',
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1'
        };
        return Issue.handler(argv)
            .then((res) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connectWithDetails);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connectWithDetails, 'someOtherProfile', argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { issuer: false });

            });
    });

    it('should issue a new identity with issuer priviledges', () => {
        mockBusinessNetworkConnection.issueIdentity.withArgs('org.doge.Doge#DOGE_1', 'dogeid1', { issuer: true }).resolves({
            userID: 'dogeid1',
            userSecret: 'suchsecret'
        });
        let argv = {
            connectionProfileName: 'someOtherProfile',
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET,
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1',
            issuer: true
        };
        return Issue.handler(argv)
            .then((res) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connectWithDetails);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connectWithDetails, 'someOtherProfile', argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { issuer: true });

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
            c: 'cardname',card:'cardname',   // needed as yargs would do this
            file: 'filename',
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1'
        };
        sandbox.stub(fs,'readFileSync').resolves();
        sandbox.stub(Export,'writeCardToFile').resolves();
        mockIdCard.getBusinessNetworkName.returns('networkname');
        mockIdCard.getConnectionProfile.returns({name:'networkname'});
        return Issue.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { issuer: false });
            });
    });

});
