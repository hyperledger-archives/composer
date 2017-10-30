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
const IdCard = require('composer-common').IdCard;
const Undeploy = require('../../lib/cmds/network/undeployCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));


let mockAdminConnection;

describe('composer undeploy network CLI unit tests', function () {

    let sandbox;
    let mockIdCard;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockAdminConnection = sinon.createStubInstance(Admin.AdminConnection);
        mockAdminConnection.createProfile.resolves();
        mockAdminConnection.connect.resolves();
        mockAdminConnection.undeploy.resolves();
        mockIdCard = sinon.createStubInstance(IdCard);
        mockIdCard.getBusinessNetworkName.returns('penguin-network');
        mockAdminConnection.getCard.resolves(mockIdCard);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(process, 'exit');

    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Undeploy handler() method tests', function () {

        it('Good path, all parms correctly specified.', function () {

            let argv = {card:'cardname'
                       ,archiveFile: 'testArchiveFile.zip'};


            return Undeploy.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockAdminConnection.connect);
                sinon.assert.calledWith(mockAdminConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockAdminConnection.undeploy);

            });
        });
        it('error path  undeploy method fails', ()=>{
            let argv = {card:'cardname'};

            mockAdminConnection.undeploy.rejects(new Error('computer says no'));


            return Undeploy.handler(argv).should.eventually.be.rejectedWith(/computer says no/);

        });
    });
});
