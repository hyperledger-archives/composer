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
const Admin = require('composer-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;

const Ping = require('../../lib/cmds/network/pingCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

describe('composer network ping CLI unit tests', () => {

    let sandbox;
    let mockBusinessNetworkConnection;
    let mockBusinessNetworkDefinition;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);

        mockBusinessNetworkConnection.connect.resolves(mockBusinessNetworkDefinition);
        mockBusinessNetworkConnection.ping.resolves({
            version: '9.9.9',
            participant: null
        });
        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.stub(process, 'exit');

    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should test the connection to the business network using the supplied card', () => {
        let argv = {
            card:'cardname'
        };
        return Ping.handler(argv)
            .then((res) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
                sinon.assert.calledWith(mockBusinessNetworkConnection.ping);
            });
    });



    it('should display the participant if a participant was found', () => {
        mockBusinessNetworkConnection.ping.resolves({
            version: '9.9.9',
            participant: 'org.doge.Doge#DOGE_1'
        });
        let argv = {card:'cardname'};
        return Ping.handler(argv)
            .then((res) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
                sinon.assert.calledWith(mockBusinessNetworkConnection.ping);
            });
    });

    it('should error when the connection cannot be tested', () => {
        mockBusinessNetworkConnection.ping.rejects(new Error('such error'));
        let argv = {
            card:'cardname'
        };
        return Ping.handler(argv)
            .catch((res) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardname');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
                sinon.assert.calledWith(mockBusinessNetworkConnection.ping);
            });
    });

});
