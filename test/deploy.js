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

const Admin = require('@ibm/ibm-concerto-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const fs = require('fs');
const Deploy = require('../lib/deploy.js');
const CmdUtil = require('../lib/utils/cmdutils.js');

require('../lib/deploy.js');
require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
require('sinon-as-promised');
require('sinon-as-promised');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

let testBusinessNetworkArchive = {bna: 'TBNA'};
let testBusinessNetworkId = 'net.biz.TestNetwork-0.0.1';
let testBusinessNetworkDescription = 'Test network description';
let testEnrollmentSecret = 'DJY27pEnl16d';

let testConnectOptions = {type: 'hlf'
                         ,membershipServicesURL: 'grpc://localhost:7054'
                         ,peerURL: 'grpc://localhost:7051'
                         ,eventHubURL: 'grpc://localhost:7053'
                         ,keyValStore: '/tmp/keyValStore'
                         ,deployWaitTime: '300'
                         ,invokeWaitTime: '100'};


let mockBusinessNetworkDefinition;
mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
mockBusinessNetworkDefinition.getIdentifier.returns(testBusinessNetworkId);
mockBusinessNetworkDefinition.getDescription.returns(testBusinessNetworkDescription);

let mockAdminConnection;
mockAdminConnection = sinon.createStubInstance(Admin.AdminConnection);
mockAdminConnection.createProfile.resolves();
mockAdminConnection.connect.resolves();
mockAdminConnection.deploy.resolves();

describe('concerto deploy network CLI unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(fs,'readFileSync').returns(testBusinessNetworkArchive);
        sandbox.stub(BusinessNetworkDefinition, 'fromArchive').returns(mockBusinessNetworkDefinition);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);

    });

    afterEach(() => {
        sandbox.restore();
    });

    it('Good path, all parms correctly specified.', function () {
        sandbox.stub(fs,'existsSync').returns(true);

        let argv = {enrollId: 'WebAppAdmin'
                   ,enrollSecret: 'DJY27pEnl16d'
                   ,archiveFile: 'testArchiveFile.zip'
        };

        return Deploy.handler(argv)
        .then ((result) => {
            sinon.assert.calledOnce(fs.existsSync);
            sinon.assert.calledWith(fs.existsSync, argv.archiveFile);
            sinon.assert.calledOnce(fs.readFileSync);
            sinon.assert.calledWith(fs.readFileSync, argv.archiveFile);
            sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
            sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
            sinon.assert.calledOnce(CmdUtil.createAdminConnection);

            sinon.assert.calledOnce(mockBusinessNetworkDefinition.getIdentifier);
            sinon.assert.calledOnce(mockBusinessNetworkDefinition.getDescription);

            sinon.assert.calledOnce(mockAdminConnection.createProfile);
            sinon.assert.calledWith(mockAdminConnection.createProfile, 'cliDeploy', testConnectOptions);
            sinon.assert.calledOnce(mockAdminConnection.connect);
            sinon.assert.calledWith(mockAdminConnection.connect, 'cliDeploy', argv.enrollId, argv.enrollSecret);
            sinon.assert.calledOnce(mockAdminConnection.deploy);
            sinon.assert.calledWith(mockAdminConnection.deploy, mockBusinessNetworkDefinition);
        });
    });

    it('Archive file does not exist.', function () {
        sandbox.stub(fs,'existsSync').returns(false);

        let argv = {enrollId: 'WebAppAdmin'
                   ,enrollSecret: 'DJY27pEnl16d'
                   ,archiveFile: 'testArchiveFile.zip'
        };

        return Deploy.handler(argv)
        .should.be.rejected
        .then (() => {
            sinon.assert.calledOnce(fs.existsSync);
            sinon.assert.calledWith(fs.existsSync, argv.archiveFile);
        });
    });

    it('Enrollment secret provided via prompt.', function () {
        sandbox.stub(fs,'existsSync').returns(true);
        sandbox.stub(CmdUtil, 'prompt').resolves(testEnrollmentSecret);

        let argv = {enrollId: 'WebAppAdmin'
                   ,archiveFile: 'testArchiveFile.zip'
        };

        return Deploy.handler(argv)
        .then ((result) => {
            // Given first test works, we only need to check prompt is called
            sinon.assert.calledOnce(CmdUtil.prompt);
        });
    });


});
