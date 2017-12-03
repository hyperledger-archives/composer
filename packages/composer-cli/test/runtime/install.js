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
const InstallCmd = require('../../lib/cmds/runtime/installCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

let mockAdminConnection;

describe('composer install runtime CLI unit tests', function () {

    let sandbox;

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

    describe('Install handler() method tests', function () {

        it('Good path, all parms correctly specified.', function () {

            let argv = {card:'cardname'
                       ,connectionProfileName: 'testProfile'};


            return InstallCmd.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect,'cardname');
                sinon.assert.calledOnce(mockAdminConnection.install);
                sinon.assert.calledWith(mockAdminConnection.install, argv.businessNetworkName, {});
            });
        });

        it('Good path, all params correctly specified (card base)', function () {

            let argv = {card:'cardname'};
            return InstallCmd.handler(argv)
                        .then ((result) => {
                            argv.thePromise.should.be.a('promise');
                            sinon.assert.calledOnce(mockAdminConnection.connect);
                            sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                        });
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
