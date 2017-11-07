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
const ListCmd = require('../../lib/cmds/card/listCommand.js');
const IdCard = require('composer-common').IdCard;
const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-as-promised'));

describe('composer card list CLI', function() {
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

    it('should succeed for no cards', function() {
        adminConnectionStub.getAllCards.resolves(new Map());
        const args = {};
        return ListCmd.handler(args).then(() => {
            sinon.assert.calledWith(consoleLogSpy, 'There are no Business Network Cards available.');
        });
    });

    it('should succeed for some cards', function() {
        const cardName = 'CARD_NAME';
        let testCard = new IdCard({ userName: 'conga' }, { name: 'profileName' });
        const cardMap = new Map([[cardName, testCard]]);
        adminConnectionStub.getAllCards.resolves(cardMap);
        const args = {};
        return ListCmd.handler(args).then(() => {
            sinon.assert.calledWith(consoleLogSpy, sinon.match(cardName));
        });
    });

});
