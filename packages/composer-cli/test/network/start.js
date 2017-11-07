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
const IdCard = require('composer-common').IdCard;
require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

let testBusinessNetworkArchive;

let businessNetworkDefinition;

const VALID_ENDORSEMENT_POLICY_STRING = '{"identities":[{ "role": { "name": "member", "mspId": "Org1MSP" }}], "policy": {"1-of": [{"signed-by":0}]}}';
let mockAdminConnection;

describe('composer start network CLI unit tests', function () {

    let sandbox;
    let testCard;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        testCard = new IdCard({ userName: 'conga' }, { name: 'profileName' });
        businessNetworkDefinition = new BusinessNetworkDefinition('my-network@1.0.0');

        mockAdminConnection = sinon.createStubInstance(Admin.AdminConnection);
        mockAdminConnection.createProfile.resolves();
        mockAdminConnection.connect.resolves();
        mockAdminConnection.start.resolves();
        mockAdminConnection.getCard.resolves(testCard);
        sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(businessNetworkDefinition);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(process, 'exit');

        return businessNetworkDefinition.toArchive()
            .then((archive) => {
                testBusinessNetworkArchive = archive;
            });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Deploy handler() method tests', function () {

        it('Good path, optional parameter -O /path/to/options.json specified.', function () {

            let argv = {card:'cardname'
                        ,archiveFile: 'testArchiveFile.zip'
                       ,optionsFile: '/path/to/options.json'
                       ,networkAdmin: 'admin'
                       ,networkAdminEnrollSecret:'true'};
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
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, businessNetworkDefinition,
                   sinon.match( {
                       bootstrapTransactions: [
                           {
                               $class: 'org.hyperledger.composer.system.AddParticipant',
                               resources: [{ $class: 'org.hyperledger.composer.system.NetworkAdmin', participantId: 'admin' }],
                               targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                               timestamp: sinon.match.any,
                               transactionId: sinon.match.any
                           }, {
                               $class: 'org.hyperledger.composer.system.IssueIdentity',
                               identityName: 'admin',
                               participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                               timestamp: sinon.match.any,
                               transactionId: sinon.match.any
                           }

                       ],
                       endorsementPolicy: optionsObject.endorsementPolicy
                   }));
            });
        });

        it('Good path, optional parameter -o endorsementPolicyFile= specified.', function () {

            let argv = {card:'cardname'
                       ,option: 'endorsementPolicyFile=/path/to/some/file.json'
                       ,networkAdmin: 'admin'
                       ,networkAdminEnrollSecret:'true'};
            sandbox.stub(Start, 'getArchiveFileContents');

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, businessNetworkDefinition,
                    sinon.match( {
                        bootstrapTransactions: [
                            {
                                $class: 'org.hyperledger.composer.system.AddParticipant',
                                resources: [{ $class: 'org.hyperledger.composer.system.NetworkAdmin', participantId: 'admin' }],
                                targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                                timestamp: sinon.match.any,
                                transactionId: sinon.match.any
                            }, {
                                $class: 'org.hyperledger.composer.system.IssueIdentity',
                                identityName: 'admin',
                                participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                                timestamp: sinon.match.any,
                                transactionId: sinon.match.any
                            }

                        ],
                        endorsementPolicyFile: '/path/to/some/file.json'
                    }));
            });
        });


        it('Good path, optional parameter -o endorsementPolicy= specified.', function () {

            let argv = {card:'cardname'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,option: 'endorsementPolicy=' + VALID_ENDORSEMENT_POLICY_STRING
                       ,networkAdmin: 'admin'
                       ,networkAdminEnrollSecret:'true'};

            sandbox.stub(Start, 'getArchiveFileContents');

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect,'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, businessNetworkDefinition,
                    sinon.match( {
                        bootstrapTransactions: [
                            {
                                $class: 'org.hyperledger.composer.system.AddParticipant',
                                resources: [{ $class: 'org.hyperledger.composer.system.NetworkAdmin', participantId: 'admin' }],
                                targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                                timestamp: sinon.match.any,
                                transactionId: sinon.match.any
                            }, {
                                $class: 'org.hyperledger.composer.system.IssueIdentity',
                                identityName: 'admin',
                                participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                                timestamp: sinon.match.any,
                                transactionId: sinon.match.any
                            }

                        ],
                        endorsementPolicy: VALID_ENDORSEMENT_POLICY_STRING
                    }));
            });
        });


        it('Good path, all parms correctly specified.', function () {

            let argv = {card:'cardname'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,networkAdmin: 'admin'
                       ,networkAdminEnrollSecret:'true'};

            sandbox.stub(Start, 'getArchiveFileContents');

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, businessNetworkDefinition,sinon.match( {
                    bootstrapTransactions: [
                        {
                            $class: 'org.hyperledger.composer.system.AddParticipant',
                            resources: [{ $class: 'org.hyperledger.composer.system.NetworkAdmin', participantId: 'admin' }],
                            targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                            timestamp: sinon.match.any,
                            transactionId: sinon.match.any
                        }, {
                            $class: 'org.hyperledger.composer.system.IssueIdentity',
                            identityName: 'admin',
                            participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                            timestamp: sinon.match.any,
                            transactionId: sinon.match.any
                        }

                    ]}));
            });
        });

        it('Good path, all parms correctly specified, including optional logLevel.', function () {

            let argv = {card:'cardname'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,loglevel: 'DEBUG'
                       ,networkAdmin: 'admin'
                       ,networkAdminEnrollSecret:'true'};

            sandbox.stub(Start, 'getArchiveFileContents');

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, businessNetworkDefinition,sinon.match( {
                    bootstrapTransactions: [
                        {
                            $class: 'org.hyperledger.composer.system.AddParticipant',
                            resources: [{ $class: 'org.hyperledger.composer.system.NetworkAdmin', participantId: 'admin' }],
                            targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                            timestamp: sinon.match.any,
                            transactionId: sinon.match.any
                        }, {
                            $class: 'org.hyperledger.composer.system.IssueIdentity',
                            identityName: 'admin',
                            participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                            timestamp: sinon.match.any,
                            transactionId: sinon.match.any
                        }

                    ], logLevel: 'DEBUG' }));
            });
        });

        it('Good path, no secret, all other parms correctly specified.', function () {

            let argv = {card:'cardname'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,networkAdmin: 'admin'
                       ,networkAdminEnrollSecret:'true'};

            sandbox.stub(Start, 'getArchiveFileContents');

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect,'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, businessNetworkDefinition, sinon.match( {
                    bootstrapTransactions: [
                        {
                            $class: 'org.hyperledger.composer.system.AddParticipant',
                            resources: [{ $class: 'org.hyperledger.composer.system.NetworkAdmin', participantId: 'admin' }],
                            targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                            timestamp: sinon.match.any,
                            transactionId: sinon.match.any
                        }, {
                            $class: 'org.hyperledger.composer.system.IssueIdentity',
                            identityName: 'admin',
                            participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                            timestamp: sinon.match.any,
                            transactionId: sinon.match.any
                        }
                    ]
                }));
            });
        });

        const sanitize = (result) => {
            result.forEach((tx) => {
                delete tx.timestamp;
                delete tx.transactionId;
                return tx;
            });
        };

        it('Good path, network administrator specified', function () {

            let argv = {card:'cardname'
                        ,archiveFile: 'testArchiveFile.zip'
                        ,networkAdmin: ['admin1']
                        ,networkAdminEnrollSecret: [true]};

            sandbox.stub(Start, 'getArchiveFileContents');

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                const deployOptions = mockAdminConnection.start.args[0][1];
                sanitize(deployOptions.bootstrapTransactions);
                deployOptions.bootstrapTransactions.should.deep.equal([
                    {
                        $class: 'org.hyperledger.composer.system.AddParticipant',
                        resources: [
                            {
                                $class: 'org.hyperledger.composer.system.NetworkAdmin',
                                participantId: 'admin1'
                            }
                        ],
                        targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin'
                    },
                    {
                        $class: 'org.hyperledger.composer.system.IssueIdentity',
                        participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#admin1',
                        identityName: 'admin1'
                    }
                ]);
            });
        });

        it('Good path, network administrator and bootstrap transactions specified', function () {

            let argv = {card:'cardname'
                        ,archiveFile: 'testArchiveFile.zip'

                        ,networkAdmin: ['admin1']
                        ,networkAdminEnrollSecret: [true]
                        ,optionsFile: '/path/to/options.json'};


            sandbox.stub(Start, 'getArchiveFileContents');
            const optionsObject = {
                bootstrapTransactions: [{
                    $class: 'org.acme.foobar.MyTransaction'
                }]
            };

            const optionFileContents = JSON.stringify(optionsObject);
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(optionFileContents);
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(true);

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);

                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                const startOptions = mockAdminConnection.start.args[0][1];
                sanitize(startOptions.bootstrapTransactions);
                startOptions.bootstrapTransactions.should.deep.equal([
                    {
                        $class: 'org.hyperledger.composer.system.AddParticipant',
                        resources: [
                            {
                                $class: 'org.hyperledger.composer.system.NetworkAdmin',
                                participantId: 'admin1'
                            }
                        ],
                        targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin'
                    },
                    {
                        $class: 'org.hyperledger.composer.system.IssueIdentity',
                        participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#admin1',
                        identityName: 'admin1'
                    },
                    {
                        $class: 'org.acme.foobar.MyTransaction'
                    }
                ]);
            });
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
