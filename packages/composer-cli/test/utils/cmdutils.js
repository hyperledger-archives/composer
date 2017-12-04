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

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const IdCard = require('composer-common').IdCard;
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');
const prompt = require('prompt');

const fs = require('fs');
const chai = require('chai');
const sinon = require('sinon');


chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

describe('composer transaction cmdutils unit tests', () => {

    const pem1 = '-----BEGIN CERTIFICATE-----\nsuch admin1\n-----END CERTIFICATE-----\n';
    const pem2 = '-----BEGIN CERTIFICATE-----\nsuch admin2\n-----END CERTIFICATE-----\n';
    const pem3 = '-----BEGIN CERTIFICATE-----\nsuch admin3\n-----END CERTIFICATE-----\n';

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(fs, 'readFileSync');
        fs.readFileSync.withArgs('admin1.pem').returns(pem1);
        fs.readFileSync.withArgs('admin2.pem').returns(pem2);
        fs.readFileSync.withArgs('admin3.pem').returns(pem3);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#parseOptions', () => {
        it('should return an empty object if no options to parse', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'};
            CmdUtil.parseOptions(argv).should.deep.equal({});
        });

        it('should handle only optionsFile', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,optionsFile: '/path/to/options.json'};
            const optionsFileContents = '{"opt1": "value1", "opt2": "value2"}';
            fs.readFileSync.withArgs('/path/to/options.json').returns(optionsFileContents);
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(true);
            CmdUtil.parseOptions(argv).should.deep.equal({opt1: 'value1', opt2: 'value2'});
        });

        it ('should handle options file not found', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,optionsFile: '/path/to/options.json'};
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(false);
            CmdUtil.parseOptions(argv).should.deep.equal({});
        });

        it('should handle only a single option', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,option: 'opt1=value1'};
            CmdUtil.parseOptions(argv).should.deep.equal({opt1: 'value1'});
        });

        it('should handle multiple options', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,option: ['opt1=value1', 'opt2=value2', 'opt3=value3']};
            CmdUtil.parseOptions(argv).should.deep.equal({opt1: 'value1', opt2: 'value2', opt3: 'value3'});
        });

        it('should handle a single option (exists in options file) and options file', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,option: 'opt1=newvalue1'
                       ,optionsFile: '/path/to/options.json'};
            const optionsFileContents = '{"opt1": "value1", "opt2": "value2"}';
            fs.readFileSync.withArgs('/path/to/options.json').returns(optionsFileContents);
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(true);
            CmdUtil.parseOptions(argv).should.deep.equal({opt1: 'newvalue1', opt2: 'value2'});
        });

        it('should handle a single option (does not exist in options file) and options file', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,option: 'opt4=newvalue1'
                       ,optionsFile: '/path/to/options.json'};
            const optionsFileContents = '{"opt1": "value1", "opt2": "value2"}';
            fs.readFileSync.withArgs('/path/to/options.json').returns(optionsFileContents);
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(true);
            CmdUtil.parseOptions(argv).should.deep.equal({opt1: 'value1', opt2: 'value2', opt4: 'newvalue1'});
        });


        it('should handle a multiple options and options file', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,option: ['opt1=newvalue1', 'opt5=newvalue5']
                       ,optionsFile: '/path/to/options.json'};
            const optionsFileContents = '{"opt1": "value1", "opt2": "value2"}';
            fs.readFileSync.withArgs('/path/to/options.json').returns(optionsFileContents);
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(true);
            CmdUtil.parseOptions(argv).should.deep.equal({opt1: 'newvalue1', opt2: 'value2', opt5: 'newvalue5'});
        });

        it('should handle a missing options file and single option provided', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,option: 'opt1=value1'
                       ,optionsFile: '/path/to/options.json'};
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(false);
            CmdUtil.parseOptions(argv).should.deep.equal({opt1: 'value1'});
        });
    });

    describe('#arrayify', () => {

        it('should handle undefined values', () => {
            CmdUtil.arrayify(undefined).should.deep.equal([]);
        });

        it('should handle null values', () => {
            CmdUtil.arrayify(null).should.deep.equal([]);
        });

        it('should handle array values', () => {
            CmdUtil.arrayify([3, 2, 1]).should.deep.equal([3, 2, 1]);
        });

        it('should handle string values', () => {
            CmdUtil.arrayify('foobar').should.deep.equal(['foobar']);
        });

    });

    describe('#parseNetworkAdminsWithCertificateFiles', () => {

        it('should parse a single network admin', () => {
            const result = CmdUtil.parseNetworkAdminsWithCertificateFiles(['admin1'], ['admin1.pem']);
            result.should.deep.equal([{
                userName: 'admin1',
                certificate: pem1
            }]);
        });

        it('should parse multiple network admins', () => {
            const result = CmdUtil.parseNetworkAdminsWithCertificateFiles(['admin1', 'admin2', 'admin3'], ['admin1.pem', 'admin2.pem', 'admin3.pem']);
            result.should.deep.equal([{
                userName: 'admin1',
                certificate: pem1
            }, {
                userName: 'admin2',
                certificate: pem2
            }, {
                userName: 'admin3',
                certificate: pem3
            }]);
        });

    });

    describe('#parseNetworkAdminsWithEnrollSecrets', () => {

        it('should parse a single network admin', () => {
            const result = CmdUtil.parseNetworkAdminsWithEnrollSecrets(['admin1'], [true]);
            result.should.deep.equal([{
                userName: 'admin1',
                enrollmentSecret: true
            }]);
        });

        it('should parse multiple network admins', () => {
            const result = CmdUtil.parseNetworkAdminsWithEnrollSecrets(['admin1', 'admin2', 'admin3'], [true, true, true]);
            result.should.deep.equal([{
                userName: 'admin1',
                enrollmentSecret: true
            }, {
                userName: 'admin2',
                enrollmentSecret: true
            }, {
                userName: 'admin3',
                enrollmentSecret: true
            }]);
        });

    });

    describe('#parseNetworkAdmins', () => {

        it('should handle no network admins', () => {
            const result = CmdUtil.parseNetworkAdmins({});
            result.should.deep.equal([]);
        });

        it('should throw if both certificates and enrollment secrets are specified', () => {
            (() => {
                CmdUtil.parseNetworkAdmins({
                    networkAdmin: ['admin1'],
                    networkAdminCertificateFile: [pem1],
                    networkAdminEnrollSecret: [true]
                });
            }).should.throw(/You cannot specify both certificate files and enrollment secrets for network administrators/);
        });

        it('should handle certificates', () => {
            const result = CmdUtil.parseNetworkAdmins({
                networkAdmin: ['admin1'],
                networkAdminCertificateFile: ['admin1.pem']
            });
            result.should.deep.equal([{
                userName: 'admin1',
                certificate: pem1
            }]);
        });

        it('should handle secrets', () => {
            const result = CmdUtil.parseNetworkAdmins({
                networkAdmin: ['admin1'],
                networkAdminEnrollSecret: [true]
            });
            result.should.deep.equal([{
                userName: 'admin1',
                enrollmentSecret: true
            }]);
        });

        it('should throw if not enough certificates', () => {
            (() => {
                CmdUtil.parseNetworkAdmins({
                    networkAdmin: ['admin1', 'admin2', 'admin3'],
                    networkAdminCertificateFile: [pem1]
                });
            }).should.throw(/You must specify certificate files or enrollment secrets for all network administrators/);
        });

        it('should throw if not enough enrollment secrets', () => {
            (() => {
                CmdUtil.parseNetworkAdmins({
                    networkAdmin: ['admin1', 'admin2', 'admin3'],
                    networkAdminEnrollSecret: [true]
                });
            }).should.throw(/You must specify certificate files or enrollment secrets for all network administrators/);
        });

        it('should handle an empty array of file names', () => {
            const result = CmdUtil.parseNetworkAdmins({
                networkAdmin: ['admin1'],
                networkAdminEnrollSecret: [true],
                file: []
            });
            result.should.deep.equal([{
                userName: 'admin1',
                enrollmentSecret: true
            }]);
        });

        it('should throw if not enough file names', () => {
            (() => {
                CmdUtil.parseNetworkAdmins({
                    networkAdmin: ['admin1', 'admin2', 'admin3'],
                    networkAdminEnrollSecret: [true, true, true],
                    file: 'file1.card'
                });
            }).should.throw(/If you specify a network administrators card file name, you must specify one for all network administrators/);
        });

        it('should handle secrets amd file names', () => {
            const result = CmdUtil.parseNetworkAdmins({
                networkAdmin: ['admin1'],
                networkAdminEnrollSecret: [true],
                file: ['admin1-doggo.card']
            });
            result.should.deep.equal([{
                userName: 'admin1',
                enrollmentSecret: true,
                file: 'admin1-doggo.card'
            }]);
        });

        it('should handle certificates amd file names', () => {
            const result = CmdUtil.parseNetworkAdmins({
                networkAdmin: ['admin1'],
                networkAdminCertificateFile: ['admin1.pem'],
                file: ['admin1-doggo.card']
            });
            result.should.deep.equal([{
                userName: 'admin1',
                certificate: pem1,
                file: 'admin1-doggo.card'
            }]);
        });

    });

    describe('#prompt', () => {

        it('should prompt and return the result', () => {
            sandbox.stub(prompt, 'get').yields(null, 'foobar');
            return CmdUtil.prompt({ hello: 'world' })
                .should.eventually.be.equal('foobar')
                .then(() => {
                    sinon.assert.calledOnce(prompt.get);
                    sinon.assert.calledWith(prompt.get, [{ hello: 'world' }]);
                });
        });

        it('should prompt and handle an error', () => {
            sandbox.stub(prompt, 'get').yields(new Error('such error'));
            return CmdUtil.prompt({ hello: 'world' })
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#createAdminConnection', () => {

        it('should create a new admin connection', () => {
            CmdUtil.createAdminConnection().should.be.an.instanceOf(AdminConnection);
        });

    });

    describe('#createBusinessNetworkConnection', () => {

        it('should create a new business network connection', () => {
            CmdUtil.createBusinessNetworkConnection().should.be.an.instanceOf(BusinessNetworkConnection);
        });

    });

    describe('#getDefaultCardName', () => {
        it('should return name for user card', () => {
            const metadata = { userName: 'conga', businessNetwork: 'penguin-network' };
            const connectionProfile = { name: 'profile-name' };
            const card = new IdCard(metadata, connectionProfile);
            const result = CmdUtil.getDefaultCardName(card);
            result.should.be.a('String').that.is.not.empty;
        });

        it('should return name for PeerAdmin card', () => {
            const metadata = { userName: 'PeerAdmin', roles: [ 'PeerAdmin', 'ChannelAdmin' ] };
            const connectionProfile = { name: 'profile-name' };
            const card = new IdCard(metadata, connectionProfile);
            const result = CmdUtil.getDefaultCardName(card);
            result.should.be.a('String').that.is.not.empty;
        });
    });

});
