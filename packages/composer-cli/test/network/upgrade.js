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
const InstallCmd = require('../../lib/cmds/network/upgradeCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

let mockAdminConnection;

describe('composer network ugprade CLI', function () {
    const sandbox = sinon.sandbox.create();

    beforeEach(() => {
        mockAdminConnection = sinon.createStubInstance(Admin.AdminConnection);
        mockAdminConnection.connect.resolves();
        mockAdminConnection.upgrade.resolves();

        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Upgrade handler() method tests', function () {

        it('should correctly execute when all parms correctly specified.', function () {

            let argv = {
                card:'cardname',
                networkName: 'org-acme-biznet',
                networkVersion: '2.0.0',
                loglevel: 'debug'
            };


            return InstallCmd.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(CmdUtil.createAdminConnection);
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, argv.card);
                sinon.assert.calledOnce(mockAdminConnection.upgrade);
                sinon.assert.calledWith(mockAdminConnection.upgrade, argv.networkName, argv.networkVersion, sinon.match({'logLevel': argv.loglevel}));
            });
        });
        it('error path  upgrade method fails', ()=>{
            let argv = {card:'cardname'};
            mockAdminConnection.upgrade.rejects(new Error('computer says no'));


            return InstallCmd.handler(argv).should.eventually.be.rejectedWith(/computer says no/);

        });
    });

});
