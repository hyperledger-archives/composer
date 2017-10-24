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

const Client = require('composer-client');
const BusinessNetworkConnection = Client.BusinessNetworkConnection;
const AdminConnection = require('composer-admin').AdminConnection;
const IssueCard = require('../../lib/cmds/identity/issuecardCommand.js');
const Export = require('../../lib/cmds/card/lib/export.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');
const IdCard = require('composer-common').IdCard;
const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const ENROLL_ID = 'SuccessKid';
const ENROLL_SECRET = 'SuccessKidWin';

describe('composer identity card issue CLI unit tests', () => {

    let sandbox;
    let mockBusinessNetworkConnection;
    let mockAdminConnection;
    let mockIdCard;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockAdminConnection = sinon.createStubInstance(AdminConnection);
        mockIdCard = sinon.createStubInstance(IdCard);
        mockIdCard.getBusinessNetworkName.returns('network');
        mockIdCard.getConnectionProfile.returns({name:'network'});
        mockAdminConnection.getCard.resolves(mockIdCard);
        mockBusinessNetworkConnection.connectWithCard.resolves();
        mockBusinessNetworkConnection.issueIdentity.withArgs('org.doge.Doge#DOGE_1', 'dogeid1', sinon.match.object).resolves({
            userID: 'dogeid1',
            userSecret: 'suchsecret'
        });
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should issue a new card using the specified profile', () => {
        let argv = {
            card: 'cardname',
            enrollId: ENROLL_ID,
            enrollSecret: ENROLL_SECRET,
            newUserId: 'dogeid1',
            participantId: 'org.doge.Doge#DOGE_1'
        };
        sandbox.stub(Export,'writeCardToFile').resolves();
        return IssueCard.handler(argv)
            .then((res) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connectWithCard);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connectWithCard, 'cardname');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1', { issuer: false });

            });
    });



});
