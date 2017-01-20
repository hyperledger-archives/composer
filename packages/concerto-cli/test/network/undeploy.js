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

const Admin = require('@ibm/concerto-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const homedir = require('homedir');
const fs = require('fs');
const Deploy = require('../../lib/cmds/network/lib/undeploy.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

//require('../lib/deploy.js');
require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
require('sinon-as-promised');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

let testBusinessNetworkArchive = {bna: 'TBNA'};
let testBusinessNetworkId = 'net.biz.TestNetwork-0.0.1';
let testBusinessNetworkDescription = 'Test network description';

//const DEFAULT_PROFILE_NAME = 'defaultProfile';
const CREDENTIALS_ROOT = homedir() + '/.concerto-credentials';

let mockBusinessNetworkDefinition;
const DEFAULT_PROFILE_NAME = 'defaultProfile';

let mockAdminConnection;

describe('concerto deploy network CLI unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockAdminConnection = sinon.createStubInstance(Admin.AdminConnection);
        mockAdminConnection.createProfile.resolves();
        mockAdminConnection.connect.resolves();
        mockAdminConnection.deploy.resolves();

        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);

    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Deploy handler() method tests', function () {

        it('Good path, all parms correctly specified.', function () {

            let argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'testProfile'};
            let connectionProfileName = argv.connectionProfileName;
            let keyValStore = CREDENTIALS_ROOT;

            let connectionProfileData = {type: 'hlf'
                                        ,membershipServicesURL: 'grpc://localhost:7054'
                                        ,peerURL: 'grpc://localhost:7051'
                                        ,eventHubURL: 'grpc://localhost:7053'
                                        ,keyValStore: keyValStore
                                        ,deployWaitTime: '300'
                                        ,invokeWaitTime: '100'};
            let connectOptions = JSON.stringify(connectionProfileData);

            sandbox.stub(Deploy, 'getArchiveFileContents');
            sandbox.stub(Deploy, 'getConnectOptions');

            Deploy.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);
            Deploy.getConnectOptions.withArgs(connectionProfileName).returns(connectOptions);

            return Deploy.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.createProfile);
                sinon.assert.calledWith(mockAdminConnection.createProfile, connectionProfileName, connectOptions);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, connectionProfileName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockAdminConnection.deploy);
                sinon.assert.calledWith(mockAdminConnection.deploy, mockBusinessNetworkDefinition);
            });
        });

        it('Good path, default connection profile, all other parms correctly specified.', function () {

            let argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'};
            let connectionProfileName = DEFAULT_PROFILE_NAME;
            let keyValStore = CREDENTIALS_ROOT;

            let connectionProfileData = {type: 'hlf'
                                        ,membershipServicesURL: 'grpc://localhost:7054'
                                        ,peerURL: 'grpc://localhost:7051'
                                        ,eventHubURL: 'grpc://localhost:7053'
                                        ,keyValStore: keyValStore
                                        ,deployWaitTime: '300'
                                        ,invokeWaitTime: '100'};
            let connectOptions = JSON.stringify(connectionProfileData);

            sandbox.stub(Deploy, 'getArchiveFileContents');
            sandbox.stub(Deploy, 'getConnectOptions');

            Deploy.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);
            Deploy.getConnectOptions.withArgs(connectionProfileName).returns(connectOptions);

            return Deploy.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.createProfile);
                sinon.assert.calledWith(mockAdminConnection.createProfile, connectionProfileName, connectOptions);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, connectionProfileName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockAdminConnection.deploy);
                sinon.assert.calledWith(mockAdminConnection.deploy, mockBusinessNetworkDefinition);
            });
        });

        it('Good path, no enrollment secret, all other parms correctly specified.', function () {

            let enrollmentSecret = 'DJY27pEnl16d';
            sandbox.stub(CmdUtil, 'prompt').resolves(enrollmentSecret);

            let argv = {enrollId: 'WebAppAdmin'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'testProfile'};
            let connectionProfileName = argv.connectionProfileName;
            let keyValStore = CREDENTIALS_ROOT;

            let connectionProfileData = {type: 'hlf'
                                        ,membershipServicesURL: 'grpc://localhost:7054'
                                        ,peerURL: 'grpc://localhost:7051'
                                        ,eventHubURL: 'grpc://localhost:7053'
                                        ,keyValStore: keyValStore
                                        ,deployWaitTime: '300'
                                        ,invokeWaitTime: '100'};
            let connectOptions = JSON.stringify(connectionProfileData);

            sandbox.stub(Deploy, 'getArchiveFileContents');
            sandbox.stub(Deploy, 'getConnectOptions');

            Deploy.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);
            Deploy.getConnectOptions.withArgs(connectionProfileName).returns(connectOptions);

            return Deploy.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.createProfile);
                sinon.assert.calledWith(mockAdminConnection.createProfile, connectionProfileName, connectOptions);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, connectionProfileName, argv.enrollId, enrollmentSecret);
                sinon.assert.calledOnce(mockAdminConnection.deploy);
                sinon.assert.calledWith(mockAdminConnection.deploy, mockBusinessNetworkDefinition);
            });
        });
    });

    describe('Deploy getConnectOption() method tests', function () {

        it('Connection profile exists', function () {

            sandbox.stub(fs, 'existsSync').returns(true);
            let keyValStore = CREDENTIALS_ROOT;
            let testConnectOptions = {type: 'hlf'
                                     ,membershipServicesURL: 'grpc://localhost:7054'
                                     ,peerURL: 'grpc://localhost:7051'
                                     ,eventHubURL: 'grpc://localhost:7053'
                                     ,keyValStore: keyValStore
                                     ,deployWaitTime: '300'
                                     ,invokeWaitTime: '100'};
            let connectionProfileContents = JSON.stringify(testConnectOptions);
            sandbox.stub(fs, 'readFileSync').returns(connectionProfileContents);

            let connectionProfileName = 'testProfile';
            let connectOptions = Deploy.getConnectOptions(connectionProfileName);

            connectOptions.should.deep.equal(testConnectOptions);

        });

        it('Connection profile does not exist', function () {

            sandbox.stub(fs, 'existsSync').returns(false);
            let keyValStore = CREDENTIALS_ROOT;
            let testConnectOptions = {type: 'hlf'
                                     ,membershipServicesURL: 'grpc://localhost:7054'
                                     ,peerURL: 'grpc://localhost:7051'
                                     ,eventHubURL: 'grpc://localhost:7053'
                                     ,keyValStore: keyValStore
                                     ,deployWaitTime: '300'
                                     ,invokeWaitTime: '100'};

            let connectionProfileName = 'testProfile';
            // set up some bad options, to ensure file contents are not read...
            let badConnectOptions = {type: 'bad'
                                    ,membershipServicesURL: 'grpc://localhost:7054'
                                    ,peerURL: 'grpc://localhost:7051'
                                    ,eventHubURL: 'grpc://localhost:7053'
                                    ,keyValStore: keyValStore
                                    ,deployWaitTime: '300'
                                    ,invokeWaitTime: '100'};
            let connectionProfileContents = JSON.stringify(badConnectOptions);
            sandbox.stub(fs, 'readFileSync').returns(connectionProfileContents);

            let connectOptions = Deploy.getConnectOptions(connectionProfileName);

            connectOptions.should.deep.equal(testConnectOptions);
            connectOptions.should.not.deep.equal(badConnectOptions);

        });

    });

});
