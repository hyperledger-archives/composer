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
const DeleteCmd = require('../../lib/cmds/card/deleteCommand.js');

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-as-promised'));

describe('composer card delete CLI', function() {
    const sandbox = sinon.sandbox.create();
    let adminConnectionStub;
    let consoleLogSpy;

    beforeEach(function() {
        adminConnectionStub = sinon.createStubInstance(AdminConnection);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(adminConnectionStub);
        consoleLogSpy = sandbox.spy(console, 'log');
        sandbox.stub(process, 'exit');
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('should delete existing card', function() {
        adminConnectionStub.deleteCard.resolves();
        const cardName = 'CARD_NAME';
        const args = { name: cardName };
        return DeleteCmd.handler(args).then(() => {
            sinon.assert.calledOnce(adminConnectionStub.deleteCard);
            sinon.assert.calledWith(adminConnectionStub.deleteCard, cardName);
            sinon.assert.calledWith(consoleLogSpy, sinon.match(cardName));
        });
    });

    it('should fail deleting non-existent card', function() {
        const errorText = 'ERROR_MESSAGE';
        adminConnectionStub.deleteCard.rejects(new Error(errorText));
        const cardName = 'CARD_NAME';
        const args = { name: cardName };
        return DeleteCmd.handler(args).then((result) => {
            sinon.assert.fail('Expected command to fail but it succeeded');
        }, (error) => {
            sinon.assert.calledOnce(adminConnectionStub.deleteCard);
            sinon.assert.calledWith(adminConnectionStub.deleteCard, cardName);
            error.toString().should.include(errorText);
        });
    });

});
