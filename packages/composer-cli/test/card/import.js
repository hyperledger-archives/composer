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
    let cardBuffer;
    let adminConnectionMock;

    beforeEach(function() {
        // TODO: create a stub instance of AdminConnection once it implements importCard()
        const adminConnectionStub = {
            importCard: () => { return Promise.resolve('CARD_NAME'); }
        };

        adminConnectionMock = sandbox.mock(adminConnectionStub);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(adminConnectionStub);
        sandbox.stub(process, 'exit');

        const testCard = new IdCard({ userName: 'conga' }, { name: 'profileName' });
        return testCard.toArchive({ type:'nodebuffer' }).then(buffer => {
            cardBuffer = buffer;
        });
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('should import valid card file with default name', function() {
        sandbox.stub(fs, 'readFileSync').withArgs(cardFileName).returns(cardBuffer);
        const args = {
            file: cardFileName
        };
        adminConnectionMock.expects('importCard')
            .once()
            .withExactArgs(sinon.match.instanceOf(IdCard), sinon.match.falsy);
        return ImportCmd.handler(args).should.not.be.rejected;
    });

    it('should import valid card file with specified name', function() {
        sandbox.stub(fs, 'readFileSync').withArgs(cardFileName).returns(cardBuffer);
        const args = {
            file: cardFileName,
            name: 'CARD_NAME'
        };
        adminConnectionMock.expects('importCard')
            .once()
            .withExactArgs(sinon.match.instanceOf(IdCard), args.name);
        return ImportCmd.handler(args).should.not.be.rejected;
    });

    it('should reject invalid card file with absolute path in message', function() {
        sandbox.stub(fs, 'readFileSync').throws();
        const args = {
            file: 'INVALID_FILE_NAME'
        };
        const expectedError = path.resolve(args.file);
        return ImportCmd.handler(args).should.be.rejectedWith(expectedError);
    });

});
