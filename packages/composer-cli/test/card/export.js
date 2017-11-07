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
const ExportCmd = require('../../lib/cmds/card/exportCommand.js');


const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-as-promised'));

describe('composer card export CLI', function() {
    const sandbox = sinon.sandbox.create();
    const cardFileName = '/TestCard.card';
    let adminConnectionStub;
    let consoleLogSpy;
    let testCard;

    beforeEach(function() {
        adminConnectionStub = sinon.createStubInstance(AdminConnection);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(adminConnectionStub);
        consoleLogSpy = sandbox.spy(console, 'log');
        sandbox.stub(process, 'exit');

        testCard = new IdCard({ userName: 'conga' }, { name: 'profileName' });
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('should export to specified file name', function() {
        sandbox.stub(fs, 'writeFileSync').withArgs(cardFileName);
        const args = {
            file: cardFileName,
            name : 'CARD_NAME'
        };

        adminConnectionStub.exportCard.resolves(testCard);
        return ExportCmd.handler(args).then(() => {
            sinon.assert.calledOnce(adminConnectionStub.exportCard);
            sinon.assert.calledWith(consoleLogSpy, sinon.match(args.name));
        });
    });

    it('should export to default file name if none specified', function() {
        const args = {
            name : 'CARD_NAME'
        };
        const expectedFileName = args.name + '.card';
        sandbox.stub(fs, 'writeFileSync').withArgs(expectedFileName);

        adminConnectionStub.exportCard.resolves(testCard);
        return ExportCmd.handler(args).then(() => {
            sinon.assert.calledOnce(adminConnectionStub.exportCard);
            sinon.assert.calledWith(consoleLogSpy, sinon.match(expectedFileName));
        });
    });

    it('should copy with the file system write failing', function() {
        sandbox.stub(fs, 'writeFileSync').withArgs(cardFileName).throws(new Error('Failed to write'));
        const args = {
            file: cardFileName,
            name : 'CARD_NAME'
        };

        adminConnectionStub.exportCard.resolves(testCard);
        return ExportCmd.handler(args).should.be.rejectedWith(/Unable to write card file/);
    });

});
