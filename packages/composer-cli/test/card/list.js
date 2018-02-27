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
const IdCard = require('composer-common').IdCard;
const ListCmd = require('../../lib/cmds/card/listCommand.js');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('composer card list CLI', () => {

    const certificate = '-----BEGIN CERTIFICATE-----\r\n' +
    'MIICGTCCAb+gAwIBAgIQQhvRH/QkdZTNIwl0yKgAaTAKBggqhkjOPQQDAjBzMQsw\r\n' +
    'CQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMNU2FuIEZy\r\n' +
    'YW5jaXNjbzEZMBcGA1UEChMQb3JnMS5leGFtcGxlLmNvbTEcMBoGA1UEAxMTY2Eu\r\n' +
    'b3JnMS5leGFtcGxlLmNvbTAeFw0xNzA3MjMxMTM4MDFaFw0yNzA3MjExMTM4MDFa\r\n' +
    'MFsxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRYwFAYDVQQHEw1T\r\n' +
    'YW4gRnJhbmNpc2NvMR8wHQYDVQQDDBZBZG1pbkBvcmcxLmV4YW1wbGUuY29tMFkw\r\n' +
    'EwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYhrF0azzb6sL49Y4KQhIfrfrxbIRdmMn\r\n' +
    'fVePZcvpLsyLMUxG+9N2HQSpNcQgZ/bQAcAOh7uyZyhDm1r5Z+qTNKNNMEswDgYD\r\n' +
    'VR0PAQH/BAQDAgeAMAwGA1UdEwEB/wQCMAAwKwYDVR0jBCQwIoAgxPOYr6lOuYwg\r\n' +
    '/zLQtVNayLqVJjBQDU2p/l+DlrFoXSMwCgYIKoZIzj0EAwIDSAAwRQIhANEh3wP7\r\n' +
    '7ncL/IuY0TpMKQSpUIzOcUYITsMQ0TbN6rNEAiB2uFORKQQn1Vb4tcg39Wu0+XnO\r\n' +
    'HFoBC92MQ75d8E1jnw==\r\n' +
    '-----END CERTIFICATE-----\r\n';

    const privateKey = '-----BEGIN PRIVATE KEY-----\r\n' +
    'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgJ+SeTifp+fL+XgJG\r\n' +
    'zlyJjSVjAymNEjehg87lLkNkFPmhRANCAARiGsXRrPNvqwvj1jgpCEh+t+vFshF2\r\n' +
    'Yyd9V49ly+kuzIsxTEb703YdBKk1xCBn9tABwA6Hu7JnKEObWvln6pM0\r\n' +
    '-----END PRIVATE KEY-----\r\n';

    let sandbox;
    let adminConnectionStub;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        adminConnectionStub = sinon.createStubInstance(AdminConnection);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(adminConnectionStub);
        sandbox.stub(CmdUtil, 'log');
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should succeed for no cards', async () => {
        adminConnectionStub.getAllCards.resolves(new Map());
        await ListCmd.handler({});
        sinon.assert.calledWith(CmdUtil.log, 'There are no Business Network Cards available.');
    });

    it('should succeed for some cards', async () => {
        const cardName1 = 'BlueCard';
        const cardName2a = 'GreenCard=a';
        const cardName2b = 'GreenCard=b';
        const testCard1 = new IdCard({ userName: 'conga1' }, { name: 'blue-profileName' });
        const testCard2a = new IdCard({ userName: 'conga2' }, { name: 'green-profileName' });
        const testCard2b = new IdCard({ userName: 'conga3' }, { name: 'green-profileName' });
        const cardMap = new Map([[cardName1, testCard1],[cardName2a, testCard2a],[cardName2b, testCard2b]]);
        adminConnectionStub.getAllCards.resolves(cardMap);
        await ListCmd.handler({});
        sinon.assert.calledWith(CmdUtil.log, sinon.match(cardName1));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(cardName2a));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(cardName2b));
    });

    it('should succeed for some cards when using the "quiet" flag', async () => {
        const cardName1 = 'BlueCard';
        const cardName2a = 'GreenCard=a';
        const cardName2b = 'GreenCard=b';
        const testCard1 = new IdCard({ userName: 'conga1' }, { name: 'blue-profileName' });
        const testCard2a = new IdCard({ userName: 'conga2' }, { name: 'green-profileName' });
        const testCard2b = new IdCard({ userName: 'conga3' }, { name: 'green-profileName' });
        const cardMap = new Map([[cardName1, testCard1],[cardName2a, testCard2a],[cardName2b, testCard2b]]);
        adminConnectionStub.getAllCards.resolves(cardMap);
        await ListCmd.handler({ quiet: true });
        sinon.assert.calledWith(CmdUtil.log, cardName1);
        sinon.assert.calledWith(CmdUtil.log, cardName2a);
        sinon.assert.calledWith(CmdUtil.log, cardName2b);
    });

    it('show card details for one card with certificates', async () => {
        const testCard = new IdCard({ userName: 'conga', description: 'such description', roles: ['PeerAdmin', 'ChannelAdmin'] }, { name: 'profileName' });
        testCard.setCredentials({certificate,privateKey});
        adminConnectionStub.exportCard.resolves(testCard);
        await ListCmd.handler({ name: 'cardname' });
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/userName:.*conga/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/description:.*such description/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/businessNetworkName:/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/identityId:.*[0-9a-z]{64}/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/roles:[^]*PeerAdmin[^]*ChannelAdmin/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/connectionProfile:[^]*name:.*profileName/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/secretSet:.*No secret set/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/credentialsSet:.*Credentials set/));
    });

    it('show card details for one card with certificates', async () => {
        const testCard = new IdCard({ userName: 'conga', description: 'such description', roles: ['PeerAdmin', 'ChannelAdmin'] }, { name: 'profileName' });
        testCard.setCredentials({certificate});
        adminConnectionStub.exportCard.resolves(testCard);
        await ListCmd.handler({ name: 'cardname' });
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/userName:.*conga/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/description:.*such description/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/businessNetworkName:/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/identityId:.*[0-9a-z]{64}/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/roles:[^]*PeerAdmin[^]*ChannelAdmin/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/connectionProfile:[^]*name:.*profileName/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/secretSet:.*No secret set/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/credentialsSet:.*Credentials set, HSM managed/));
    });

    it('show card details for one card without certificates', async () => {
        const testCard = new IdCard({ userName: 'conga', description: '', enrollmentSecret:'secret' }, { name: 'profileName' });
        adminConnectionStub.exportCard.resolves(testCard);
        await ListCmd.handler({ name: 'cardname' });
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/userName:.*conga/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/description:/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/businessNetworkName:/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/identityId:/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/roles:.*none/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/connectionProfile:[^]*name:.*profileName/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/secretSet:.*Secret set/));
        sinon.assert.calledWith(CmdUtil.log, sinon.match(/credentialsSet:.*No Credentials set/));
    });

});
