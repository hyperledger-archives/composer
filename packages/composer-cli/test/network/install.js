//import { BusinessNetworkDefinition } from '../../../composer-admin/index';

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
const InstallCmd = require('../../lib/cmds/network/installCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

let mockAdminConnection;

describe('composer network install CLI', function () {

    let sandbox;

    const archiveFileName = 'archiveFileName';
    const businessNetworkDefinition = new BusinessNetworkDefinition('my-network@1.0.0');

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockAdminConnection = sinon.createStubInstance(Admin.AdminConnection);

        mockAdminConnection.connect.resolves();
        mockAdminConnection.deploy.resolves();

        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Install handler()', function () {

        it('should correctly execute when mandatory parameters correctly specified', function () {
            sandbox.stub(fs, 'existsSync').withArgs(archiveFileName).returns(true);
            sandbox.stub(fs, 'readFileSync').withArgs(archiveFileName).returns(businessNetworkDefinition.toArchive());

            const argv = {
                card: 'cardname',
                archiveFile: 'archiveFileName'
            };

            return InstallCmd.handler(argv).then(result => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect,'cardname');
                sinon.assert.calledOnce(mockAdminConnection.install);
                sinon.assert.calledWith(mockAdminConnection.install, sinon.match.instanceOf(BusinessNetworkDefinition), {});
            });
        });

        it('should error if card archive file does not exist', function () {
            sandbox.stub(fs, 'existsSync').withArgs(archiveFileName).returns(false);
            sandbox.stub(fs, 'readFileSync').withArgs(archiveFileName).throws(new Error(archiveFileName));

            const argv = {
                card: 'cardname',
                archiveFile: archiveFileName
            };

            return InstallCmd.handler(argv).should.be.rejectedWith(archiveFileName);
        });

        it('error path #1 - creating an adminConnection is rejected.. .', ()=>{
            let argv = {card:'cardname'};
            mockAdminConnection.connect.rejects(new Error('computer says no'));


            return InstallCmd.handler(argv).should.eventually.be.rejectedWith(/computer says no/);

        });

        it('error path #2 - adminconncection.conntext is rejected,', ()=>{
            let argv = {card:'cardname'};
            mockAdminConnection.connect.rejects(new Error('computer says no'));


            return InstallCmd.handler(argv).should.eventually.be.rejectedWith(/computer says no/);

        });

    });

});
