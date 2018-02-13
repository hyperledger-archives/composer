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

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-admin').BusinessNetworkDefinition;
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');
const Ping = require('../../lib/cmds/network/pingCommand.js');

const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

describe('composer network ping CLI unit tests', () => {

    let sandbox;
    let argv;
    let mockBusinessNetworkConnection;
    let mockBusinessNetworkDefinition;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        argv = { card: 'cardname' };
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetworkConnection.connect.resolves(mockBusinessNetworkDefinition);
        mockBusinessNetworkConnection.ping.resolves({
            version: '9.9.9',
            participant: null,
            identity: null
        });
        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.spy(CmdUtil, 'log');
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should test the connection to the business network using the supplied card', async () => {
        await Ping.handler(argv);
        argv.thePromise.should.be.a('promise');
        sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
        sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardname');
        sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
        sinon.assert.calledWith(mockBusinessNetworkConnection.ping);
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/version:.*?9.9.9/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/participant:.*?<no participant found>/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/identity:.*?<no identity found>/));
    });

    it('should display the participant if a participant was found', async () => {
        mockBusinessNetworkConnection.ping.resolves({
            version: '9.9.9',
            participant: 'org.doge.Doge#DOGE_1',
            identity: null
        });
        await Ping.handler(argv);
        argv.thePromise.should.be.a('promise');
        sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
        sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardname');
        sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
        sinon.assert.calledWith(mockBusinessNetworkConnection.ping);
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/version:.*?9.9.9/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/participant:.*?org.doge.Doge#DOGE_1/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/identity:.*?<no identity found>/));
    });

    it('should display the identity if an identity was found', async () => {
        mockBusinessNetworkConnection.ping.resolves({
            version: '9.9.9',
            participant: null,
            identity: 'org.hyperledger.composer.system.Identity#IDENTITY_1'
        });
        await Ping.handler(argv);
        argv.thePromise.should.be.a('promise');
        sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
        sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardname');
        sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
        sinon.assert.calledWith(mockBusinessNetworkConnection.ping);
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/version:.*?9.9.9/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/participant:.*?<no participant found>/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/identity:.*?org.hyperledger.composer.system.Identity#IDENTITY_1/));
    });

    it('should display the participant and identity if both a participant and an identity was found', async () => {
        mockBusinessNetworkConnection.ping.resolves({
            version: '9.9.9',
            participant: 'org.doge.Doge#DOGE_1',
            identity: 'org.hyperledger.composer.system.Identity#IDENTITY_1'
        });
        await Ping.handler(argv);
        argv.thePromise.should.be.a('promise');
        sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
        sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardname');
        sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
        sinon.assert.calledWith(mockBusinessNetworkConnection.ping);
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/version:.*?9.9.9/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/participant:.*?org.doge.Doge#DOGE_1/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/identity:.*?org.hyperledger.composer.system.Identity#IDENTITY_1/));
    });

    it('should error when the connection cannot be tested', async () => {
        mockBusinessNetworkConnection.ping.rejects(new Error('such error'));
        await Ping.handler(argv)
            .should.be.rejectedWith(/such error/);
    });

});
