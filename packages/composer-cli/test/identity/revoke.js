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

const Revoke = require('../../lib/cmds/identity/revokeCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

describe('composer identity revoke CLI unit tests', () => {

    let sandbox;
    let mockBusinessNetworkConnection;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkConnection.connect.resolves();
        mockBusinessNetworkConnection.revokeIdentity.withArgs('dogeid1').resolves();
        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should revoke an existing identity using the default profile', () => {
        let argv = {
            card:'cardName',
            identityId: 'dogeid1'
        };
        return Revoke.handler(argv)
            .then((res) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardName');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.revokeIdentity);
                sinon.assert.calledWith(mockBusinessNetworkConnection.revokeIdentity, 'dogeid1');
            });
    });

    it('should error when the new identity cannot be revoked', () => {
        mockBusinessNetworkConnection.revokeIdentity.withArgs('dogeid1').rejects(new Error('such error'));
        let argv = {
            card:'cardName',
            identityId: 'dogeid1'
        };
        return Revoke.handler(argv)
            .should.be.rejectedWith(/such error/);
    });

});
