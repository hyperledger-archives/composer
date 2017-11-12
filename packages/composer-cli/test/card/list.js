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
        const cardName1 = 'BlueCard';
        const cardName2a= 'GreenCard=a';
        const cardName2b = 'GreenCard=b';
        let testCard1 = new IdCard({ userName: 'conga1' }, { name: 'blue-profileName' });

        let testCard2a = new IdCard({ userName: 'conga2' }, { name: 'green-profileName' });
        let testCard2b = new IdCard({ userName: 'conga3' }, { name: 'green-profileName' });
        const cardMap = new Map([[cardName1, testCard1],[cardName2a, testCard2a],[cardName2b, testCard2b]]);

        adminConnectionStub.getAllCards.resolves(cardMap);
        const args = {};
        return ListCmd.handler(args).then(() => {
            sinon.assert.calledWith(consoleLogSpy, sinon.match(cardName1));
            sinon.assert.calledWith(consoleLogSpy, sinon.match(cardName2a));
            sinon.assert.calledWith(consoleLogSpy, sinon.match(cardName2b));
        });
    });

    describe('should handle the information for one card',()=>{
        it('show card details for one card',()=>{
            let x;
            let testCard = new IdCard({ userName: 'conga' ,description:x }, { name: 'profileName' });
            testCard.setCredentials({certificate:'cert',privateKey:'key'});
            let args={'name':'cardname'};

            adminConnectionStub.exportCard.resolves(testCard);
            return ListCmd.handler(args).then(()=>{


            });
        });

        it('show card details for one card',()=>{
            let testCard = new IdCard({ userName: 'conga',enrollmentSecret:'secret' }, { name: 'profileName' });
            let args={'name':'cardname'};
            adminConnectionStub.exportCard.resolves(testCard);
            return ListCmd.handler(args).then(()=>{


            });
        });

    });

});
