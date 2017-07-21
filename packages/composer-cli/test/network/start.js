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
const fs = require('fs');
const Start = require('../../lib/cmds/network/lib/start.js');
const StartCmd = require('../../lib/cmds/network/startCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

let testBusinessNetworkArchive = {bna: 'TBNA'};
let testBusinessNetworkId = 'net-biz-TestNetwork-0.0.1';
let testBusinessNetworkDescription = 'Test network description';
let mockBusinessNetworkDefinition;
let mockAdminConnection;

const VALID_ENDORSEMENT_POLICY_STRING = '{"identities":[{ "role": { "name": "member", "mspId": "Org1MSP" }}], "policy": {"1-of": [{"signed-by":0}]}}';

describe('composer start network CLI unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetworkDefinition.getIdentifier.returns(testBusinessNetworkId);
        mockBusinessNetworkDefinition.getDescription.returns(testBusinessNetworkDescription);

        mockAdminConnection = sinon.createStubInstance(Admin.AdminConnection);
        mockAdminConnection.createProfile.resolves();
        mockAdminConnection.connect.resolves();
        mockAdminConnection.start.resolves();

        sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Deploy handler() method tests', function () {

        it('Good path, optional parameter -O /path/to/options.json specified.', function () {

            let argv = {startId: 'WebAppAdmin'
                       ,startSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'testProfile'
                       ,optionsFile: '/path/to/options.json'};
            sandbox.stub(Start, 'getArchiveFileContents');
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

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, argv.connectionProfileName, argv.startId, argv.startSecret);
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, mockBusinessNetworkDefinition,
                    {
                        endorsementPolicy: optionsObject.endorsementPolicy
                    });
            });
        });

        it('Good path, optional parameter -o endorsementPolicyFile= specified.', function () {

            let argv = {startId: 'WebAppAdmin'
                       ,startSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'testProfile'
                       ,option: 'endorsementPolicyFile=/path/to/some/file.json'};
            sandbox.stub(Start, 'getArchiveFileContents');

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, argv.connectionProfileName, argv.startId, argv.startSecret);
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, mockBusinessNetworkDefinition,
                    {
                        endorsementPolicyFile: '/path/to/some/file.json'
                    });
            });
        });


        it('Good path, optional parameter -o endorsementPolicy= specified.', function () {

            let argv = {startId: 'WebAppAdmin'
                       ,startSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'testProfile'
                       ,option: 'endorsementPolicy=' + VALID_ENDORSEMENT_POLICY_STRING};

            sandbox.stub(Start, 'getArchiveFileContents');

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, argv.connectionProfileName, argv.startId, argv.startSecret);
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, mockBusinessNetworkDefinition,
                    {
                        endorsementPolicy: VALID_ENDORSEMENT_POLICY_STRING
                    });
            });
        });


        it('Good path, all parms correctly specified.', function () {

            let argv = {startId: 'WebAppAdmin'
                       ,startSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'testProfile'};

            sandbox.stub(Start, 'getArchiveFileContents');

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, argv.connectionProfileName, argv.startId, argv.startSecret);
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, mockBusinessNetworkDefinition);
            });
        });

        it('Good path, all parms correctly specified, including optional loglevel.', function () {

            let argv = {startId: 'WebAppAdmin'
                       ,startSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'testProfile'
                       ,loglevel: 'DEBUG'};

            sandbox.stub(Start, 'getArchiveFileContents');

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, argv.connectionProfileName, argv.startId, argv.startSecret);
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, mockBusinessNetworkDefinition, {logLevel: 'DEBUG'});
            });
        });

        it('Good path, no startment secret, all other parms correctly specified.', function () {

            let startmentSecret = 'DJY27pEnl16d';
            sandbox.stub(CmdUtil, 'prompt').resolves(startmentSecret);

            let argv = {startId: 'WebAppAdmin'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'testProfile'};

            sandbox.stub(Start, 'getArchiveFileContents');

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return Start.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, argv.connectionProfileName, argv.startId, argv.startSecret);
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, mockBusinessNetworkDefinition);
            });
        });

        it('show throw an error if loglevel not valid', function() {
            let argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,loglevel: 'BAD'
                       ,archiveFile: 'testArchiveFile.zip'};
            return Start.handler(argv)
                .should.be.rejectedWith(/or not one of/);

        });

    });

    describe('Deploy getArchiveFileContents() method tests', function () {

        it('Archive file exists', function () {

            sandbox.stub(fs, 'existsSync').returns(true);
            let testArchiveFileContents = JSON.stringify(testBusinessNetworkArchive);
            sandbox.stub(fs, 'readFileSync').returns(testArchiveFileContents);

            let testArchiveFile = 'testfile.zip';
            let archiveFileContents = Start.getArchiveFileContents(testArchiveFile);

            archiveFileContents.should.deep.equal(testArchiveFileContents);

        });

        it('Archive file does not exist', function () {

            sandbox.stub(fs, 'existsSync').returns(false);
            let testArchiveFileContents = JSON.stringify(testBusinessNetworkArchive);
            sandbox.stub(fs, 'readFileSync').returns(testArchiveFileContents);

            let testArchiveFile = 'testfile.zip';
            (() => {Start.getArchiveFileContents(testArchiveFile);}).should.throw('Archive file '+testArchiveFile+' does not exist.');

        });

    });

});
