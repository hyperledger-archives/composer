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
const ora = require('ora');

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
    let adminCard;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        testCard = new IdCard({ userName: 'conga', businessNetwork : 'a' }, { name: 'profileName' });
        adminCard = new IdCard({ userName: 'admin' }, { name: 'profileName' }, {file : '/tmp/adminCardFile'});
        businessNetworkDefinition = new BusinessNetworkDefinition('my-network@1.0.0');

        mockAdminConnection = sinon.createStubInstance(Admin.AdminConnection);

        mockAdminConnection.connect.resolves();
        mockAdminConnection.start.resolves();
        mockAdminConnection.update.resolves();
        mockAdminConnection.exportCard.resolves(testCard);
        let mapCards = new Map();
        mapCards.set('conga', testCard);
        mapCards.set('admin', adminCard);
        mockAdminConnection.start.resolves(mapCards);
        sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(businessNetworkDefinition);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(process, 'exit');

        sandbox.stub(fs, 'writeFileSync');

        return businessNetworkDefinition.toArchive()
            .then((archive) => {
                testBusinessNetworkArchive = archive;
            });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Deploy handler() method tests', function () {

        it('should correctly execute when optional parameter -O /path/to/options.json specified.', function () {

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
                sinon.assert.calledTwice(fs.writeFileSync);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, businessNetworkDefinition,
                    {
                        endorsementPolicy: optionsObject.endorsementPolicy,  networkAdmins: [{ enrollmentSecret : 'true', userName: 'admin' }]
                    });
            });
        });

        it('should correctly execute when optional parameter -o endorsementPolicyFile= specified.', function () {

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
                sinon.assert.calledTwice(fs.writeFileSync);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, businessNetworkDefinition,
                    {                       endorsementPolicyFile: '/path/to/some/file.json', networkAdmins: [{ enrollmentSecret : 'true', userName: 'admin' }]

                    });
            });
        });


        it('should correctly execute when optional parameter -o endorsementPolicy= specified.', function () {

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
                sinon.assert.calledTwice(fs.writeFileSync);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect,'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, businessNetworkDefinition,
                    {
                        endorsementPolicy: VALID_ENDORSEMENT_POLICY_STRING, networkAdmins: [{ enrollmentSecret : 'true', userName: 'admin' }]
                    });
            });
        });


        it('should correctly execute when all parms correctly specified.', function () {

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
                sinon.assert.calledTwice(fs.writeFileSync);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, businessNetworkDefinition,
                {    networkAdmins: [{ enrollmentSecret : 'true', userName: 'admin' }]}  );
            });
        });

        it('should correctly execute when all parms correctly specified. with the certificate', function () {

            let argv = {card:'cardname'
                                   ,archiveFile: 'testArchiveFile.zip'
                                   ,networkAdmin: 'admin'
                                   ,networkAdminCertificateFile:'certificate-file'};

            sandbox.stub(Start, 'getArchiveFileContents');
            sandbox.stub(fs,'readFileSync').withArgs('certificate-file').returns('asdasdasd');
            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
                        .then ((result) => {
                            argv.thePromise.should.be.a('promise');
                            sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                            sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                            sinon.assert.calledOnce(CmdUtil.createAdminConnection);
                            sinon.assert.calledTwice(fs.writeFileSync);
                            sinon.assert.calledOnce(mockAdminConnection.connect);
                            sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                            sinon.assert.calledOnce(mockAdminConnection.start);


                        });
        });
        it('should correctly execute when all parms correctly specified. File output set for the card', function () {

            let argv = {card:'cardname'
                                   ,archiveFile: 'testArchiveFile.zip'
                                   ,networkAdmin: 'admin'
                                   ,networkAdminEnrollSecret:'true'
                                ,file:'mycardfile'};

            sandbox.stub(Start, 'getArchiveFileContents');

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
                        .then ((result) => {
                            argv.thePromise.should.be.a('promise');
                            sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                            sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                            sinon.assert.calledOnce(CmdUtil.createAdminConnection);
                            sinon.assert.calledTwice(fs.writeFileSync);
                            sinon.assert.calledOnce(mockAdminConnection.connect);
                            sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                            sinon.assert.calledOnce(mockAdminConnection.start);
                            sinon.assert.calledWith(mockAdminConnection.start, businessNetworkDefinition,
                               { networkAdmins: [{ file: 'mycardfile', enrollmentSecret : 'true', userName: 'admin' }] } );
                        }       );
        });

        it('should correctly execute when all parms correctly specified, including optional logLevel.', function () {

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
                sinon.assert.calledTwice(fs.writeFileSync);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, businessNetworkDefinition,{ networkAdmins: [{ enrollmentSecret : 'true', userName: 'admin' }],logLevel: 'DEBUG' });
            });
        });

        it('should correctly execute when no secret, all other parms correctly specified.', function () {

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
                sinon.assert.calledTwice(fs.writeFileSync);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect,'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, businessNetworkDefinition,  {
                    networkAdmins: [{ enrollmentSecret : 'true', userName: 'admin' }]
                });
            });
        });

        const sanitize = (result) => {
            result.forEach((tx) => {
                delete tx.timestamp;
                delete tx.transactionId;
                return tx;
            });
        };

        it('should correctly execute when, network administrator specified', function () {

            let argv = {card:'cardname'
                        ,archiveFile: 'testArchiveFile.zip'
                        ,networkAdmin: 'admin1'
                        ,networkAdminEnrollSecret: true};

            sandbox.stub(Start, 'getArchiveFileContents');

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);
                sinon.assert.calledTwice(fs.writeFileSync);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);

            });
        });

        it('should correctly execute when network administrator and bootstrap transactions specified', function () {

            let argv = {card:'cardname'
                        ,archiveFile: 'testArchiveFile.zip'

                        ,networkAdmin: 'admin1'
                        ,networkAdminEnrollSecret: true
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
                sinon.assert.calledTwice(fs.writeFileSync);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                const startOptions = mockAdminConnection.start.args[0][1];
                sanitize(startOptions.bootstrapTransactions);
                startOptions.bootstrapTransactions.should.deep.equal([

                    {
                        $class: 'org.acme.foobar.MyTransaction'
                    }
                ]);
            });
        });

        it('Should report correct error if connect fails', () => {
            let argv = {card:'cardname'
                ,archiveFile: 'testArchiveFile.zip'
                ,networkAdmin: 'admin1'
                ,networkAdminEnrollSecret: true
                ,optionsFile: '/path/to/options.json'};

            sandbox.stub(Start, 'getArchiveFileContents');
            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);
            mockAdminConnection.connect.rejects(new Error('some error'));
            let oraStart = sandbox.stub(ora,'start');
            return Start.handler(argv).should.eventually.be.rejectedWith(/some error/)
                .then(() => {
                    sinon.assert.notCalled(oraStart);
                });
        });

        it('Should report correct error if export card fails', () => {
            let argv = {card:'cardname'
            ,archiveFile: 'testArchiveFile.zip'

            ,networkAdmin: 'admin1'
            ,networkAdminEnrollSecret: true
            ,optionsFile: '/path/to/options.json'};

            sandbox.stub(Start, 'getArchiveFileContents');
            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);
            mockAdminConnection.connect.resolves();
            mockAdminConnection.start.rejects(new Error('export error'));
            let oraStart = sandbox.stub(ora,'start');
            return Start.handler(argv).should.eventually.be.rejectedWith(/export error/)
                .then(() => {
                    sinon.assert.notCalled(oraStart);
                });
        });

        it('should correctly execute when network administrator specified', function () {

            let argv = {card:'cardname'
                                    ,archiveFile: 'testArchiveFile.zip'
                                    ,networkAdmin: 'admin1'
                                    ,networkAdminEnrollSecret: true
                                    ,file: 'mycard'};

            sandbox.stub(Start, 'getArchiveFileContents');

            Start.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return StartCmd.handler(argv)
                        .then ((result) => {
                            argv.thePromise.should.be.a('promise');
                            sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                            sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, testBusinessNetworkArchive);
                            sinon.assert.calledOnce(CmdUtil.createAdminConnection);
                            sinon.assert.calledTwice(fs.writeFileSync);
                            sinon.assert.calledOnce(mockAdminConnection.connect);
                            sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                            sinon.assert.calledOnce(mockAdminConnection.start);

                        });
        });

    });

    describe('Deploy getArchiveFileContents() method tests', function () {

        it('Should correctly get the archive file contents if it exists', function () {

            sandbox.stub(fs, 'existsSync').returns(true);
            let testArchiveFileContents = JSON.stringify(testBusinessNetworkArchive);
            sandbox.stub(fs, 'readFileSync').returns(testArchiveFileContents);

            let testArchiveFile = 'testfile.zip';
            let archiveFileContents = Start.getArchiveFileContents(testArchiveFile);

            archiveFileContents.should.deep.equal(testArchiveFileContents);

        });

        it('Should throw correct error if archive file does not exist', function () {

            sandbox.stub(fs, 'existsSync').returns(false);
            let testArchiveFileContents = JSON.stringify(testBusinessNetworkArchive);
            sandbox.stub(fs, 'readFileSync').returns(testArchiveFileContents);

            let testArchiveFile = 'testfile.zip';
            (() => {Start.getArchiveFileContents(testArchiveFile);}).should.throw('Archive file '+testArchiveFile+' does not exist.');

        });
        it('Should handle correctly any unexpected errors', function () {

            let argv = {card:'cardname'
                                               ,archiveFile: 'testArchiveFile.zip'
                                               ,networkAdmin: 'admin'
                                               ,networkAdminCertificateFile:'certificate-file'};


            sandbox.stub(Start, 'getArchiveFileContents').withArgs('testArchiveFile.zip').throws(new Error('computer says no'));

            return Start.handler(argv).should.be.rejectedWith(/computer says no/);
        });

    });

});
