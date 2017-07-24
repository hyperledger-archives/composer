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

const Admin = require('composer-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const homedir = require('homedir');
const fs = require('fs');
const Deploy = require('../../lib/cmds/network/lib/deploy.js');
const DeployCmd = require('../../lib/cmds/network/deployCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

//require('../lib/deploy.js');
require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

let testBusinessNetworkArchive = {bna: 'TBNA'};
let testBusinessNetworkId = 'net.biz.TestNetwork-0.0.1';
let testBusinessNetworkDescription = 'Test network description';

//const DEFAULT_PROFILE_NAME = 'defaultProfile';
const CREDENTIALS_ROOT = homedir() + '/.composer-credentials';

let mockBusinessNetworkDefinition;
const DEFAULT_PROFILE_NAME = 'defaultProfile';

const VALID_ENDORSEMENT_POLICY_STRING = '{"identities":[{ "role": { "name": "member", "mspId": "Org1MSP" }}], "policy": {"1-of": [{"signed-by":0}]}}';
let mockAdminConnection;

describe('composer deploy network CLI unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetworkDefinition.getIdentifier.returns(testBusinessNetworkId);
        mockBusinessNetworkDefinition.getDescription.returns(testBusinessNetworkDescription);

        mockAdminConnection = sinon.createStubInstance(Admin.AdminConnection);
        mockAdminConnection.createProfile.resolves();
        mockAdminConnection.connect.resolves();
        mockAdminConnection.deploy.resolves();

        sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Deploy handler() method tests', function () {

        it('Good path, optional parameter -O /path/to/options.json specified.', function () {

            let argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'testProfile'
                       ,optionsFile: '/path/to/options.json'};
            let connectionProfileName = argv.connectionProfileName;
            let keyValStore = CREDENTIALS_ROOT;

            let connectOptions = {type: 'hlf'
                                        ,membershipServicesURL: 'grpc://localhost:7054'
                                        ,peerURL: 'grpc://localhost:7051'
                                        ,eventHubURL: 'grpc://localhost:7053'
                                        ,keyValStore: keyValStore
                                        ,deployWaitTime: '300'
                                        ,invokeWaitTime: '100'};

            sandbox.stub(Deploy, 'getArchiveFileContents');
            sandbox.stub(Deploy, 'getConnectOptions');
            const optionsObject = {
                endorsementPolicy: {
                    identities: [{role: {name: 'member',mspId: 'Org1MSP'}}],
                    policy: {'1-of': [{'signed-by': 0}]}
                }
            };

            // This would also work.
            //const optionsObject = {
            //    endorsementPolicy: '{"identities": [{"role": {"name": "member","mspId": "Org1MSP"}}],"policy": {"1-of": [{"signed-by": 0}]}}';
            //};

            const optionFileContents = JSON.stringify(optionsObject);
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(optionFileContents);
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(true);

            Deploy.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);
            Deploy.getConnectOptions.withArgs(connectionProfileName).returns(connectOptions);

            return DeployCmd.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.createProfile);
                sinon.assert.calledWith(mockAdminConnection.createProfile, connectionProfileName, connectOptions);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, connectionProfileName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockAdminConnection.deploy);
                sinon.assert.calledWith(mockAdminConnection.deploy, mockBusinessNetworkDefinition,
                    {
                        endorsementPolicy: optionsObject.endorsementPolicy
                    });
            });
        });

        it('Good path, optional parameter -o endorsementPolicyFile= specified.', function () {

            let argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'testProfile'
                       ,option: 'endorsementPolicyFile=/path/to/some/file.json'};
            let connectionProfileName = argv.connectionProfileName;
            let keyValStore = CREDENTIALS_ROOT;

            let connectOptions = {type: 'hlf'
                                        ,membershipServicesURL: 'grpc://localhost:7054'
                                        ,peerURL: 'grpc://localhost:7051'
                                        ,eventHubURL: 'grpc://localhost:7053'
                                        ,keyValStore: keyValStore
                                        ,deployWaitTime: '300'
                                        ,invokeWaitTime: '100'};

            sandbox.stub(Deploy, 'getArchiveFileContents');
            sandbox.stub(Deploy, 'getConnectOptions');

            Deploy.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);
            Deploy.getConnectOptions.withArgs(connectionProfileName).returns(connectOptions);

            return DeployCmd.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.createProfile);
                sinon.assert.calledWith(mockAdminConnection.createProfile, connectionProfileName, connectOptions);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, connectionProfileName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockAdminConnection.deploy);
                sinon.assert.calledWith(mockAdminConnection.deploy, mockBusinessNetworkDefinition,
                    {
                        endorsementPolicyFile: '/path/to/some/file.json'
                    });
            });
        });


        it('Good path, optional parameter -o endorsementPolicy= specified.', function () {

            let argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'testProfile'
                       ,option: 'endorsementPolicy=' + VALID_ENDORSEMENT_POLICY_STRING};
            let connectionProfileName = argv.connectionProfileName;
            let keyValStore = CREDENTIALS_ROOT;

            let connectOptions = {type: 'hlf'
                                        ,membershipServicesURL: 'grpc://localhost:7054'
                                        ,peerURL: 'grpc://localhost:7051'
                                        ,eventHubURL: 'grpc://localhost:7053'
                                        ,keyValStore: keyValStore
                                        ,deployWaitTime: '300'
                                        ,invokeWaitTime: '100'};

            sandbox.stub(Deploy, 'getArchiveFileContents');
            sandbox.stub(Deploy, 'getConnectOptions');

            Deploy.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);
            Deploy.getConnectOptions.withArgs(connectionProfileName).returns(connectOptions);

            return DeployCmd.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.createProfile);
                sinon.assert.calledWith(mockAdminConnection.createProfile, connectionProfileName, connectOptions);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, connectionProfileName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockAdminConnection.deploy);
                sinon.assert.calledWith(mockAdminConnection.deploy, mockBusinessNetworkDefinition,
                    {
                        endorsementPolicy: VALID_ENDORSEMENT_POLICY_STRING
                    });
            });
        });


        it('Good path, all parms correctly specified.', function () {

            let argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'testProfile'};
            let connectionProfileName = argv.connectionProfileName;
            let keyValStore = CREDENTIALS_ROOT;

            let connectOptions = {type: 'hlf'
                                        ,membershipServicesURL: 'grpc://localhost:7054'
                                        ,peerURL: 'grpc://localhost:7051'
                                        ,eventHubURL: 'grpc://localhost:7053'
                                        ,keyValStore: keyValStore
                                        ,deployWaitTime: '300'
                                        ,invokeWaitTime: '100'};

            sandbox.stub(Deploy, 'getArchiveFileContents');
            sandbox.stub(Deploy, 'getConnectOptions');

            Deploy.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);
            Deploy.getConnectOptions.withArgs(connectionProfileName).returns(connectOptions);

            return DeployCmd.handler(argv)
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

        it('Good path, all parms correctly specified, including optional loglevel.', function () {

            let argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'testProfile'
                       ,loglevel: 'DEBUG'};
            let connectionProfileName = argv.connectionProfileName;
            let keyValStore = CREDENTIALS_ROOT;

            let connectOptions = {type: 'hlf'
                                        ,membershipServicesURL: 'grpc://localhost:7054'
                                        ,peerURL: 'grpc://localhost:7051'
                                        ,eventHubURL: 'grpc://localhost:7053'
                                        ,keyValStore: keyValStore
                                        ,deployWaitTime: '300'
                                        ,invokeWaitTime: '100'};

            sandbox.stub(Deploy, 'getArchiveFileContents');
            sandbox.stub(Deploy, 'getConnectOptions');

            Deploy.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);
            Deploy.getConnectOptions.withArgs(connectionProfileName).returns(connectOptions);

            return DeployCmd.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.createProfile);
                sinon.assert.calledWith(mockAdminConnection.createProfile, connectionProfileName, connectOptions);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, connectionProfileName, argv.enrollId, argv.enrollSecret);
                sinon.assert.calledOnce(mockAdminConnection.deploy);
                sinon.assert.calledWith(mockAdminConnection.deploy, mockBusinessNetworkDefinition, {logLevel: 'DEBUG'});
            });
        });



        it('Good path, default connection profile, all other parms correctly specified.', function () {

            let argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'};
            let connectionProfileName = DEFAULT_PROFILE_NAME;
            let keyValStore = CREDENTIALS_ROOT;

            let connectOptions = {type: 'hlf'
                                        ,membershipServicesURL: 'grpc://localhost:7054'
                                        ,peerURL: 'grpc://localhost:7051'
                                        ,eventHubURL: 'grpc://localhost:7053'
                                        ,keyValStore: keyValStore
                                        ,deployWaitTime: '300'
                                        ,invokeWaitTime: '100'};

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

            let connectOptions = {type: 'hlf'
                                        ,membershipServicesURL: 'grpc://localhost:7054'
                                        ,peerURL: 'grpc://localhost:7051'
                                        ,eventHubURL: 'grpc://localhost:7053'
                                        ,keyValStore: keyValStore
                                        ,deployWaitTime: '300'
                                        ,invokeWaitTime: '100'};

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

        it('show throw an error if loglevel not valid', function() {
            let argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,loglevel: 'BAD'
                       ,archiveFile: 'testArchiveFile.zip'};
            return Deploy.handler(argv)
                .should.be.rejectedWith(/or not one of/);

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

    describe('Deploy getArchiveFileContents() method tests', function () {

        it('Archive file exists', function () {

            sandbox.stub(fs, 'existsSync').returns(true);
            let testArchiveFileContents = JSON.stringify(testBusinessNetworkArchive);
            sandbox.stub(fs, 'readFileSync').returns(testArchiveFileContents);

            let testArchiveFile = 'testfile.zip';
            let archiveFileContents = Deploy.getArchiveFileContents(testArchiveFile);

            archiveFileContents.should.deep.equal(testArchiveFileContents);

        });

        it('Archive file does not exist', function () {

            sandbox.stub(fs, 'existsSync').returns(false);
            let testArchiveFileContents = JSON.stringify(testBusinessNetworkArchive);
            sandbox.stub(fs, 'readFileSync').returns(testArchiveFileContents);

            let testArchiveFile = 'testfile.zip';
            (() => {Deploy.getArchiveFileContents(testArchiveFile);}).should.throw('Archive file '+testArchiveFile+' does not exist.');

        });

    });

    describe('Deploy getDefaultProfileName() method tests', function () {

        it('profile name specified in argv', function () {

            let argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'testProfile'};

            let connectionProfileName = Deploy.getDefaultProfileName(argv);
            connectionProfileName.should.equal(argv.connectionProfileName);

        });

        it('Profile name not specified in argv', function () {

            let argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'};

            let connectionProfileName = Deploy.getDefaultProfileName(argv);
            connectionProfileName.should.equal(DEFAULT_PROFILE_NAME);

        });

    });

});
