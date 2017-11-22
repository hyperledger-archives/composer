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
const ResetCMD = require('../../lib/cmds/network/resetCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');
const Reset = require('../../lib/cmds/network/lib/reset.js');
const ora = require('ora');

require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));


let mockAdminConnection;
let mockIdCard;

describe('composer reset network CLI unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockAdminConnection = sinon.createStubInstance(Admin.AdminConnection);

        mockAdminConnection.connect.resolves();
        mockAdminConnection.undeploy.resolves();
        mockIdCard = sinon.createStubInstance(IdCard);
        mockIdCard.getBusinessNetworkName.returns('penguin-network');
        mockAdminConnection.exportCard.resolves(mockIdCard);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(process, 'exit');


    });

    afterEach(() => {
        sandbox.restore();
    });


    describe('update command method tests', () => {

        it('should contain update in the command and describe', () => {
            ResetCMD.command.should.include('reset');
            ResetCMD.describe.should.match(/Resets/);
        });

        it('should invoke the Update handler correctly', () => {
            sandbox.stub(Reset, 'handler');
            let argv = {};
            ResetCMD.handler(argv);
            sinon.assert.calledOnce(Reset.handler);
            sinon.assert.calledWith(Reset.handler, argv);
            argv.should.have.property('thePromise');
        });


    });

    describe('test main reset logic', () =>{
        it('main line code path', ()=>{
            let argv = {card:'cardname'};
            mockAdminConnection.reset.resolves();
            return Reset.handler(argv).then(()=>{
                sinon.assert.calledWith(mockAdminConnection.reset);
            });

        });

        it('error path #2 prompt method fails, along with the spinner class', ()=>{
            let argv = {card:'cardname'};
            mockAdminConnection.reset.rejects(new Error('computer says no'));
            sandbox.stub(ora,'start').returns({});
            sandbox.stub(ora,'fail').returns();

            return Reset.handler(argv).should.eventually.be.rejectedWith(/computer says no/);

        });

        it('Should report correct error if connect fails', () => {
            let argv = {card:'cardname'};
            mockAdminConnection.connect.rejects(new Error('some error'));
            let oraStart = sandbox.stub(ora,'start');
            return Reset.handler(argv).should.eventually.be.rejectedWith(/some error/)
                .then(() => {
                    sinon.assert.notCalled(oraStart);
                });
        });

        it('Should report correct error if export card fails', () => {
            let argv = {card:'cardname'};
            mockAdminConnection.connect.resolves();
            mockAdminConnection.exportCard.rejects(new Error('export error'));
            let oraStart = sandbox.stub(ora,'start');
            return Reset.handler(argv).should.eventually.be.rejectedWith(/export error/)
                .then(() => {
                    sinon.assert.notCalled(oraStart);
                });
        });

    });

});
