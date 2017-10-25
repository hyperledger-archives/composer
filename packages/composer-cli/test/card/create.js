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

describe('composer card import CLI', function() {
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

    it('should create a valid card file with supplied details', function() {
        sandbox.stub(fs, 'writeFileSync').withArgs(cardFileName).returns(cardBuffer);
        sandbox.stub(fs, 'readFileSync').returns(cardBuffer);
        sandbox.stub(JSON, 'parse').returns({name:'network'});
        const args = {
            connectionProfileFile: 'filename',
            businessNetworkName : 'network',
            file: 'filename',
            enrollSecret:'password',
            enrollId:'fred'
        };

        return CreateCmd.handler(args).then(() => {
            sinon.assert.calledOnce(fs.readFileSync);
            sinon.assert.calledWith(fs.readFileSync,sinon.match(/filename/));
            sinon.assert.calledWith(consoleLogSpy, sinon.match('Successfully created business network card'));
        });
    });


});
