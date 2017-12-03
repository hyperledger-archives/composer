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
const ImportCmd = require('../../lib/cmds/card/importCommand.js');
const path = require('path');

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-as-promised'));

describe('composer card import CLI', function() {
    const sandbox = sinon.sandbox.create();
    const cardFileName = '/TestCard.card';
    let testCard;
    let testCardBuffer;
    let adminConnectionStub;
    let consoleLogSpy;

    beforeEach(function() {
        adminConnectionStub = sinon.createStubInstance(AdminConnection);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(adminConnectionStub);
        consoleLogSpy = sandbox.spy(console, 'log');
        sandbox.stub(process, 'exit');
        adminConnectionStub.hasCard.resolves(true);
        testCard = new IdCard({ userName: 'conga' }, { name: 'profileName' });
        return testCard.toArchive({ type:'nodebuffer' }).then(buffer => {
            testCardBuffer = buffer;
        });
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('should import valid card file with default name', function() {
        sandbox.stub(fs, 'readFileSync').withArgs(cardFileName).returns(testCardBuffer);
        const args = {
            file: cardFileName
        };
        adminConnectionStub.importCard.resolves();
        adminConnectionStub.hasCard.resolves(false);
        return ImportCmd.handler(args).then(() => {
            sinon.assert.calledOnce(adminConnectionStub.importCard);
            sinon.assert.calledWith(adminConnectionStub.importCard, sinon.match.string, sinon.match.instanceOf(IdCard));
        });
    });

    it('should import valid card file with specified name', function() {
        sandbox.stub(fs, 'readFileSync').withArgs(cardFileName).returns(testCardBuffer);
        const cardName = 'CONGA_CARD';
        const args = {
            file: cardFileName,
            name: cardName
        };
        adminConnectionStub.importCard.resolves();
        adminConnectionStub.hasCard.resolves(false);
        return ImportCmd.handler(args).then(() => {
            sinon.assert.calledOnce(adminConnectionStub.importCard);
            sinon.assert.calledWith(adminConnectionStub.importCard, cardName, sinon.match.instanceOf(IdCard));
            sinon.assert.calledWith(consoleLogSpy, sinon.match(cardName));
        });
    });

    it('should reject invalid card file with absolute path in message', function() {
        sandbox.stub(fs, 'readFileSync').throws();
        const args = {
            file: 'INVALID_FILE_NAME'
        };
        const expectedError = path.resolve(args.file);
        return ImportCmd.handler(args).should.be.rejectedWith(expectedError);
    });

    it('should reject card if already imported', function() {
        sandbox.stub(fs, 'readFileSync').withArgs(cardFileName).returns(testCardBuffer);
        const args = {
            name: 'ALREADY_IMPORTED',
            file: cardFileName
        };
        adminConnectionStub.hasCard.withArgs('ALREADY_IMPORTED').resolves(true);
        return ImportCmd.handler(args).should.be.rejectedWith(/already exists/);
    });

});
