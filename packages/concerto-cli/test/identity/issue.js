/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const Client = require('@ibm/concerto-client');
const BusinessNetworkConnection = Client.BusinessNetworkConnection;

const Issue = require('../../lib/cmds/identity/issueCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

const sinon = require('sinon');
require('sinon-as-promised');

const BUSINESS_NETWORK_NAME = 'net.biz.TestNetwork-0.0.1';
const DEFAULT_PROFILE_NAME = 'defaultProfile';
const ENROLL_ID = 'SuccessKid';
const ENROLL_SECRET = 'SuccessKidWin';

describe('concerto identity issue CLI unit tests', () => {

    let sandbox;
    let mockBusinessNetworkConnection;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkConnection.connect.resolves();
        mockBusinessNetworkConnection.issueIdentity.withArgs('org.doge.Doge#DOGE_1', 'dogeid1', { issuer: false }).resolves({
            userID: 'dogeid1',
            userSecret: 'suchsecret'
        });
        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should issue a new identity using the default profile', () => {
        let argv = {
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET,
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1'
        };
        return Issue.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, DEFAULT_PROFILE_NAME, argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { issuer: false });
                sinon.assert.calledWith(process.exit, 0);
            });
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
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'someOtherProfile', argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { issuer: false });
                sinon.assert.calledWith(process.exit, 0);
            });
    });

    it('should prompt for the enrollment secret if not specified', () => {
        sandbox.stub(CmdUtil, 'prompt').resolves(ENROLL_SECRET);
        let argv = {
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1'
        };
        return Issue.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, DEFAULT_PROFILE_NAME, argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { issuer: false });
                sinon.assert.calledWith(process.exit, 0);
            });
    });

    it('should issue a new identity with issuer priviledges', () => {
        mockBusinessNetworkConnection.issueIdentity.withArgs('org.doge.Doge#DOGE_1', 'dogeid1', { issuer: true }).resolves({
            userID: 'dogeid1',
            userSecret: 'suchsecret'
        });
        let argv = {
            businessNetworkName: BUSINESS_NETWORK_NAME,
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET,
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1',
            issuer: true
        };
        return Issue.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, DEFAULT_PROFILE_NAME, argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { issuer: true });
                sinon.assert.calledWith(process.exit, 0);
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
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, DEFAULT_PROFILE_NAME, argv.businessNetworkName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { issuer: false });
                sinon.assert.calledWith(process.exit, 1);
            });
    });

});
