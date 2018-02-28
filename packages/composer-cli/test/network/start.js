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
const fs = require('fs');
const StartCmd = require('../../lib/cmds/network/startCommand.js');
const cmdUtil = require('../../lib/cmds/utils/cmdutils.js');
const Export = require('../../lib/cmds/card/lib/export');
const IdCard = require('composer-common').IdCard;

require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

/**
 * Create a map of cards keyed by user name.
 * @param {IdCard} cards business network cards.
 * @return {Map} card map.
 */
function createCardMap(...cards) {
    const result = new Map();
    cards.forEach(card => result.set(card.getUserName(), card));
    return result;
}

describe('composer start network CLI unit tests', function () {

    const sandbox = sinon.sandbox.create();
    const networkName = 'test-network';
    const networkVersion = '1.0.0';
    const validEndorsementPolicy = {
        identities: [ { role: { name: 'member', mspId: 'Org1MSP' } } ],
        policy: { '1-of': [ { 'signed-by': 0 } ] }
    };
    let mockAdminConnection;
    let testCard;
    let adminCard;

    beforeEach(() => {
        testCard = new IdCard({ userName: 'conga', businessNetwork : networkName }, { name: 'profileName' });
        adminCard = new IdCard({ userName: 'admin' }, { name: 'profileName' }, {file : '/tmp/adminCardFile'});

        mockAdminConnection = sinon.createStubInstance(Admin.AdminConnection);

        mockAdminConnection.connect.resolves();
        mockAdminConnection.start.resolves();
        mockAdminConnection.exportCard.resolves(testCard);
        mockAdminConnection.start.resolves(createCardMap(testCard, adminCard));
        sandbox.stub(cmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(process, 'exit');
        sandbox.stub(fs, 'writeFileSync');
        sandbox.stub(Export, 'writeCardToFile').resolves();
        sandbox.stub(cmdUtil, 'log');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Deploy handler() method tests', function () {
        it('should correctly execute with all required parameters and enrollment secret', function () {
            let argv = {
                card: 'cardname',
                networkName: networkName,
                networkVersion: networkVersion,
                networkAdmin: 'admin',
                networkAdminEnrollSecret:'true'
            };
            return StartCmd.handler(argv).then(result => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, networkName, networkVersion,
                    {
                        networkAdmins: [{ enrollmentSecret : 'true', userName: 'admin' }]
                    });
            });
        });

        it('should correctly execute with all required parameters and certificate file', function () {
            const certificate = 'this-is-a-certificate-honest-guv';
            sandbox.stub(fs,'readFileSync').withArgs('certificate-file').returns(certificate);

            let argv = {
                card: 'cardname',
                networkName: networkName,
                networkVersion: networkVersion,
                networkAdmin: 'admin',
                networkAdminCertificateFile: 'certificate-file'
            };
            return StartCmd.handler(argv).then(result => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.start);
                sinon.assert.calledWith(mockAdminConnection.start, networkName, networkVersion,
                    {
                        networkAdmins: [{ certificate: certificate, userName: 'admin' }]
                    });
            });
        });

        it('should pass options specified by -O /path/to/options.json to AdminConnection.start()', function () {
            const optionsObject = { endorsementPolicy: validEndorsementPolicy };
            // This would also work.
            //const optionsObject = {
            //    endorsementPolicy: '{"identities": [{"role": {"name": "member","mspId": "Org1MSP"}}],"policy": {"1-of": [{"signed-by": 0}]}}';
            //};
            const optionFileContents = JSON.stringify(optionsObject);
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(optionFileContents);
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(true);

            let argv = {
                card: 'cardname',
                networkName: networkName,
                networkVersion: networkVersion,
                optionsFile: '/path/to/options.json',
                networkAdmin: 'admin',
                networkAdminEnrollSecret:'true'
            };
            return StartCmd.handler(argv).then(result => {
                sinon.assert.calledWith(mockAdminConnection.start, networkName, networkVersion,
                    {
                        endorsementPolicy: optionsObject.endorsementPolicy,  networkAdmins: [{ enrollmentSecret : 'true', userName: 'admin' }]
                    });
            });
        });

        it('should pass options specified by -o endorsementPolicyFile= to AdminConnection.start()', function () {
            let argv = {
                card: 'cardname',
                networkName: networkName,
                networkVersion: networkVersion,
                option: 'endorsementPolicyFile=/path/to/some/file.json',
                networkAdmin: 'admin',
                networkAdminEnrollSecret:'true'
            };
            return StartCmd.handler(argv).then(result => {
                sinon.assert.calledWith(mockAdminConnection.start, networkName, networkVersion,
                    {
                        endorsementPolicyFile: '/path/to/some/file.json', networkAdmins: [{ enrollmentSecret : 'true', userName: 'admin' }]
                    });
            });
        });

        it('should pass options specified by -o endorsementPolicy= specified to AdminConnection.start()', function () {
            const endorsementPolicyString = JSON.stringify(validEndorsementPolicy);
            let argv = {
                card: 'cardname',
                networkName: networkName,
                networkVersion: networkVersion,
                option: 'endorsementPolicy=' + endorsementPolicyString,
                networkAdmin: 'admin',
                networkAdminEnrollSecret:'true'
            };
            return StartCmd.handler(argv).then(result => {
                sinon.assert.calledWith(mockAdminConnection.start, networkName, networkVersion,
                    {
                        endorsementPolicy: endorsementPolicyString, networkAdmins: [{ enrollmentSecret : 'true', userName: 'admin' }]
                    });
            });
        });

        it('should use specified card output file name', function() {
            const cardFileName = 'network-admin-card-file.card';
            const networkAdmin = adminCard.getUserName();
            let argv = {
                card: 'cardname',
                file: cardFileName,
                networkName: networkName,
                networkVersion: networkVersion,
                networkAdmin: networkAdmin,
                networkAdminEnrollSecret:'true'
            };
            return StartCmd.handler(argv).then(result => {
                sinon.assert.calledWith(Export.writeCardToFile,
                    cardFileName,
                    sinon.match(card => card.getUserName() === networkAdmin));
            });
        });

        it('should include specified loglevel in start options', function () {
            const logLevel = 'debug-log-level';
            let argv = {
                card: 'cardname',
                networkName: networkName,
                networkVersion: networkVersion,
                networkAdmin: 'admin',
                networkAdminEnrollSecret:'true',
                loglevel: logLevel
            };
            return StartCmd.handler(argv).then(result => {
                sinon.assert.calledWith(mockAdminConnection.start, networkName, networkVersion,
                    {
                        networkAdmins: [{ enrollmentSecret : 'true', userName: 'admin' }],
                        logLevel: logLevel
                    });
            });
        });

        it('should report correct error if connect fails', () => {
            const connectErrorMessage = 'connect-error';
            mockAdminConnection.connect.rejects(new Error(connectErrorMessage));
            let argv = {
                card: 'cardname',
                networkName: networkName,
                networkVersion: networkVersion,
                networkAdmin: 'admin',
                networkAdminEnrollSecret:'true'
            };
            return StartCmd.handler(argv).should.be.rejectedWith(connectErrorMessage);
        });

        it('should report correct error if writing card fails', () => {
            const writeErrorMessage = 'card-write-error';
            Export.writeCardToFile.rejects(new Error(writeErrorMessage));
            let argv = {
                card: 'cardname',
                networkName: networkName,
                networkVersion: networkVersion,
                networkAdmin: 'admin',
                networkAdminEnrollSecret:'true'
            };
            return StartCmd.handler(argv).should.be.rejectedWith(writeErrorMessage);
        });

        it('should output correct message for multiple network admin cards', function () {
            mockAdminConnection.start.resolves(createCardMap(testCard, adminCard));
            let argv = {
                card: 'cardname',
                networkName: networkName,
                networkVersion: networkVersion,
                networkAdmin: 'admin',
                networkAdminEnrollSecret:'true'
            };
            return StartCmd.handler(argv).then(result => {
                sinon.assert.calledWithMatch(cmdUtil.log, arg => /Successfully created business network cards:/.test(arg));
            });
        });

        it('should output correct message for single network admin card', function () {
            mockAdminConnection.start.resolves(createCardMap(testCard));
            let argv = {
                card: 'cardname',
                networkName: networkName,
                networkVersion: networkVersion,
                networkAdmin: 'admin',
                networkAdminEnrollSecret:'true'
            };
            return StartCmd.handler(argv).then(result => {
                sinon.assert.calledWithMatch(cmdUtil.log, arg => /Successfully created business network card:/.test(arg));
            });
        });

    });

});
