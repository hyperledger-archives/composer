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
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');
const fs = require('fs');

const IdCard = require('composer-common').IdCard;
const CreateCmd = require('../../lib/cmds/card/createCommand.js');


const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-as-promised'));

describe('composer card create CLI', function() {
    const sandbox = sinon.sandbox.create();
    const cardFileName = '/TestCard.card';
    let cardBuffer;
    let adminConnectionStub;
    let consoleLogSpy;
    let testCard;

    beforeEach(function() {
        adminConnectionStub = sinon.createStubInstance(AdminConnection);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(adminConnectionStub);
        consoleLogSpy = sandbox.spy(console, 'log');
        sandbox.stub(process, 'exit');

        testCard = new IdCard({ userName: 'conga' }, { name: 'profileName' });
        return testCard.toArchive({ type:'nodebuffer' }).then(buffer => {
            cardBuffer = buffer;
        });
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('should create a valid card file with (secret) supplied details', function() {
        sandbox.stub(fs, 'writeFileSync').withArgs(cardFileName);
        sandbox.stub(fs, 'readFileSync').returns(cardBuffer);
        sandbox.stub(JSON, 'parse').returns({name:'network'});
        const args = {
            connectionProfileFile: 'filename',
            file: 'filename',
            enrollSecret:'password',
            user:'fred'
        };

        return CreateCmd.handler(args).then(() => {
            sinon.assert.calledOnce(fs.readFileSync);
            sinon.assert.calledWith(fs.readFileSync,sinon.match(/filename/));
            sinon.assert.calledOnce(fs.writeFileSync);
            sinon.assert.calledWith(consoleLogSpy, sinon.match(/Successfully created business network card/));
        });
    });

    it('create card with minimal options - user and profile',()=>{
        sandbox.stub(fs, 'writeFileSync');
        sandbox.stub(fs, 'readFileSync').returns(cardBuffer);
        sandbox.stub(JSON, 'parse').returns({name:'network'});
        const args = {
            connectionProfileFile: 'filename',
            user:'fred'
        };

        return CreateCmd.handler(args).then(() => {
            sinon.assert.calledOnce(fs.readFileSync);
            sinon.assert.calledWith(fs.readFileSync,sinon.match(/filename/));
            sinon.assert.calledOnce(fs.writeFileSync);
            sinon.assert.calledWith(consoleLogSpy, sinon.match(/Successfully created business network card/));
        });
    });

    it('create card with minimal options & with the profile having no name',()=>{
        sandbox.stub(fs, 'writeFileSync');
        sandbox.stub(fs, 'readFileSync').returns(cardBuffer);
        sandbox.stub(JSON, 'parse').returns({anonymus:'network'});
        const args = {
            connectionProfileFile: '/fred/filename',
            user:'fred'
        };

        return CreateCmd.handler(args).should.be.rejectedWith(/Required connection field not found: name/);
    });



    it('create card with certificate and private key',()=>{
        sandbox.stub(fs, 'writeFileSync');
        let readFileStub = sandbox.stub(fs, 'readFileSync');
        readFileStub.withArgs(sinon.match(/certfile/)).returns('I am certificate');
        readFileStub.withArgs(sinon.match(/keyfile/)).returns('I am keyfile');
        sandbox.stub(JSON, 'parse').returns({name:'network'});
        const args = {
            connectionProfileFile: 'filename',
            certificate : 'certfile',
            privateKey:'keyfile',
            user:'fred'
        };

        return CreateCmd.handler(args).then(() => {
            sinon.assert.calledThrice(fs.readFileSync);
            sinon.assert.calledWith(fs.readFileSync,sinon.match(/filename/));
            sinon.assert.calledOnce(fs.writeFileSync);
            sinon.assert.calledWith(consoleLogSpy, sinon.match(/Successfully created business network card/));
        });
    });

    it('create card with roles',()=>{
        sandbox.stub(fs, 'writeFileSync');
        let readFileStub = sandbox.stub(fs, 'readFileSync');
        readFileStub.withArgs(sinon.match(/certfile/)).returns('I am certificate');
        readFileStub.withArgs(sinon.match(/keyfile/)).returns('I am keyfile');
        sandbox.stub(JSON, 'parse').returns({name:'network'});
        const args = {
            connectionProfileFile: 'filename',
            roles : 'PeerAdmin,Issuer,ChannelAdmin',
            user:'fred'
        };

        return CreateCmd.handler(args).then(() => {
            sinon.assert.calledOnce(fs.readFileSync);
            sinon.assert.calledWith(fs.readFileSync,sinon.match(/filename/));
            sinon.assert.calledOnce(fs.writeFileSync);
            sinon.assert.calledWith(consoleLogSpy, sinon.match(/Successfully created business network card/));
        });
    });

    it('error case - check with connection profile file read fail',()=>{
        sandbox.stub(fs, 'writeFileSync');
        let readFileStub = sandbox.stub(fs, 'readFileSync');
        readFileStub.withArgs(sinon.match(/notexist/)).throws(new Error('read failure'));

        sandbox.stub(JSON, 'parse').returns({name:'network'});
        const args = {
            connectionProfileFile: 'notexist',
            user:'fred'
        };

        return CreateCmd.handler(args).should.be.rejectedWith(/Unable to read/);
    });

    it('error case - check with certificate file read fail',()=>{
        sandbox.stub(fs, 'writeFileSync');
        let readFileStub = sandbox.stub(fs, 'readFileSync');
        readFileStub.withArgs(sinon.match(/certfile/)).throws(new Error('read failure'));
        readFileStub.withArgs(sinon.match(/keyfile/)).returns('I am keyfile');
        sandbox.stub(JSON, 'parse').returns({name:'network'});
        const args = {
            connectionProfileFile: 'filename',
            certificate : 'certfile',
            privateKey:'keyfile',
            user:'fred'
        };

        return CreateCmd.handler(args).should.be.rejectedWith(/Unable to read/);
    });

    it('error case - check with certificate file read fail',()=>{
        sandbox.stub(fs, 'writeFileSync');
        let readFileStub = sandbox.stub(fs, 'readFileSync');
        readFileStub.withArgs(sinon.match(/certfile/)).returns('I am certificate');
        readFileStub.withArgs(sinon.match(/keyfile/)).throws(new Error('read failure'));
        sandbox.stub(JSON, 'parse').returns({name:'network'});
        const args = {
            connectionProfileFile: 'filename',
            certificate : 'certfile',
            privateKey:'keyfile',
            user:'fred'
        };

        return CreateCmd.handler(args).should.be.rejectedWith(/Unable to read/);
    });

    it('write valid card with default filename - based on network name',()=>{
        sandbox.stub(fs, 'writeFileSync');
        sandbox.stub(fs, 'readFileSync').returns(cardBuffer);

        const args = {
            connectionProfileFile: 'filename',
            businessNetworkName: 'penguin-network',
            user:'fred'
        };
        sandbox.stub(JSON, 'parse').returns({name:args.businessNetworkName});
        return CreateCmd.handler(args).then(() => {
            sinon.assert.calledOnce(fs.readFileSync);
            sinon.assert.calledWith(fs.writeFileSync,sinon.match(/fred@penguin-network.card/),sinon.match.any);
            sinon.assert.calledWith(consoleLogSpy, sinon.match(/Successfully created business network card/));
        });
    });
    it('write valid card with default filename - based on profile name',()=>{
        sandbox.stub(fs, 'writeFileSync');
        sandbox.stub(fs, 'readFileSync').returns(cardBuffer);
        sandbox.stub(JSON, 'parse').returns({name:'network'});
        const args = {
            connectionProfileFile: 'filename',
            user:'fred'
        };

        return CreateCmd.handler(args).then(() => {
            sinon.assert.calledOnce(fs.readFileSync);
            sinon.assert.calledWith(fs.writeFileSync,sinon.match(/fred@network.card/),sinon.match.any);
            sinon.assert.calledWith(consoleLogSpy, sinon.match(/Successfully created business network card/));
        });
    });

});
