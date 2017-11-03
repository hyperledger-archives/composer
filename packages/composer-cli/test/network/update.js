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


const UpdateCMD = require('../../lib/cmds/network/updateCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');
const Update = require('../../lib/cmds/network/lib/update.js');
const Deploy = require('../../lib/cmds/network/lib/deploy.js');

require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));


let mockAdminConnection;

describe('composer update network CLI unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockAdminConnection = sinon.createStubInstance(Admin.AdminConnection);
        mockAdminConnection.createProfile.resolves();
        mockAdminConnection.connect.resolves();
        mockAdminConnection.undeploy.resolves();
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(process, 'exit');

    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('update handler() method tests', () => {

        it('should call deploy with true flag set', () => {
            sandbox.stub(Deploy, 'handler');
            Update.handler('some arg');
            sinon.assert.calledOnce(Deploy.handler);
            sinon.assert.calledWith(Deploy.handler, 'some arg', true);

        });
    });

    describe('update command method tests', () => {

        it('should contain update in the command and describe', () => {
            UpdateCMD.command.should.include('update');
            UpdateCMD.describe.should.include('Update');
        });

        it('should invoke the Update handler correctly', () => {
            sandbox.stub(Update, 'handler');
            let argv = {};
            UpdateCMD.handler(argv);
            sinon.assert.calledOnce(Update.handler);
            sinon.assert.calledWith(Update.handler, argv);
            argv.should.have.property('thePromise');
        });


    });

    describe('using network cards', ()=>{
        it('Good path with update enabled', function () {
            let businessNetworkDefinition = new BusinessNetworkDefinition('my-network@1.0.0');

            let testBusinessNetworkArchive;
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(businessNetworkDefinition);
            let argv = {card: 'cardName'};
            sandbox.stub(Deploy, 'getArchiveFileContents');
            Deploy.getArchiveFileContents.withArgs(argv.archiveFile).returns(testBusinessNetworkArchive);

            return businessNetworkDefinition.toArchive()
                .then((archive) => {
                    testBusinessNetworkArchive = archive;
                    return UpdateCMD.handler(argv,true);
                })
                .then ((result) => {
                    argv.thePromise.should.be.a('promise');
                    sinon.assert.calledOnce(CmdUtil.createAdminConnection);
                    sinon.assert.calledOnce(mockAdminConnection.connect);
                    sinon.assert.calledWith(mockAdminConnection.connect,'cardName');

                });
        });
    });
});
