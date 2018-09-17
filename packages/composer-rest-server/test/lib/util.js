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

const inquirer    = require('inquirer');
const Util = require('../../lib/util');

require('chai').should();
const sinon = require('sinon');


describe('Util', () => {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(inquirer, 'prompt').resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#getConnectionSettings', () => {
        /**
         * Get all questions from the interactive start up
         * @param {String} name question name
         * @return {Promise<List>} a list of questions
         */
        async function getAllQuestions() {
            await Util.getConnectionSettings();
            return inquirer.prompt.args[0][0]; // First call, first argument.
        }

        /**
         * Get a named question from the interactive start up
         * @param {String} name question name
         * @return {Promise} a question
         */
        async function getQuestion(name) {
            const questions = await getAllQuestions();
            return questions.find((question) => question.name === name);
        }

        it('should call inquirer.prompt()', async () => {
            await Util.getConnectionSettings();
            sinon.assert.calledOnce(inquirer.prompt);
        });

        it('should interactively ask for the connection settings', async () => {
            const questions = await getAllQuestions();
            const names = questions.map((question) => question.name);
            names.should.include.members(['card', 'namespaces', 'apikey', 'authentication', 'multiuser', 'websockets', 'tls', 'tlscert', 'tlskey', 'explorer', 'loggingkey']);
        });

        it('should validate the length of the business network card', async () => {
            const question = await getQuestion('card');
            question.validate('').should.match(/Please enter/);
            question.validate('admin@org-acme-biznet').should.be.true;
        });

        it('should ask for an API key if API key enabled', async () => {
            const question = await getQuestion('apikey');
            question.when({ useApikey: true }).should.be.true;
        });

        it('should not ask for an API key if API key not enabled', async () => {
            const question = await getQuestion('apikey');
            question.when({ useApikey: false }).should.be.false;
        });

        it('should fail validation for empty API key', async () => {
            const question = await getQuestion('apikey');
            question.validate('').should.match(/Please enter/);
        });

        it('should pass validation for non-empty API key', async () => {
            const question = await getQuestion('apikey');
            question.validate('xyz').should.be.true;
        });

        it('should only enable the multiuser question if TLS enabled', async () => {
            const question = await getQuestion('multiuser');
            question.when({ authentication: false }).should.be.false;
            question.when({ authentication: true }).should.be.true;
        });

        it('should only enable the TLS certificate question if TLS enabled', async () => {
            const question = await getQuestion('tlscert');
            question.when({ tls: false }).should.be.false;
            question.when({ tls: true }).should.be.true;
        });

        it('should only enable the TLS key question if TLS enabled', async () => {
            const question = await getQuestion('tlskey');
            question.when({ tls: false }).should.be.false;
            question.when({ tls: true }).should.be.true;
        });
    });

    describe('#generateKey', () => {

        it('should generate a key', () => {
            const key = Util.generateKey('password');
            key.should.be.a('string');
            key.should.have.lengthOf(40);
        });

        it('should generate a key using a specified algorithm', () => {
            const key = Util.generateKey('password', 'sha256');
            key.should.be.a('string');
            key.should.have.lengthOf(64);
        });

        it('should generate a key using a specified encoding', () => {
            const key = Util.generateKey('password', null, 'base64');
            key.should.be.a('string');
            key.should.have.lengthOf(28);
        });

        it('should generate a different key each time', () => {
            const key1 = Util.generateKey('password');
            const key2 = Util.generateKey('password');
            key1.should.be.a('string');
            key2.should.be.a('string');
            key1.should.not.equal(key2);
        });

    });

    describe('#profileToUser', () => {

        it('should generate a profile for a user with a username', () => {
            const user = Util.profileToUser('saml', { username: 'alice' });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                email: 'alice@loopback.saml.com',
                username: 'saml.alice'
            });
        });


        it('should generate a profile for a user with a username and provider', () => {
            const user = Util.profileToUser('saml', { username: 'alice', provider: 'doge' });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                email: 'alice@loopback.doge.com',
                username: 'doge.alice'
            });
        });

        it('should generate a profile for a user with an email username', () => {
            const user = Util.profileToUser('saml', { username: 'alice@example.org' });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                email: '616c696365406578616d706c652e6f7267@loopback.saml.com',
                username: 'saml.616c696365406578616d706c652e6f7267'
            });
        });


        it('should generate a profile for a user with an email username and provider', () => {
            const user = Util.profileToUser('saml', { username: 'alice@example.org', provider: 'doge' });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                email: '616c696365406578616d706c652e6f7267@loopback.doge.com',
                username: 'doge.616c696365406578616d706c652e6f7267'
            });
        });

        it('should generate a profile for a user with an id', () => {
            const user = Util.profileToUser('saml', { id: 'alice' });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                email: 'alice@loopback.saml.com',
                username: 'saml.alice'
            });
        });

        it('should generate a profile for a user with an id and provider', () => {
            const user = Util.profileToUser('saml', { id: 'alice', provider: 'doge' });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                email: 'alice@loopback.doge.com',
                username: 'doge.alice'
            });
        });

        it('should generate a profile for a user with an email id', () => {
            const user = Util.profileToUser('saml', { id: 'alice@example.org' });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                email: '616c696365406578616d706c652e6f7267@loopback.saml.com',
                username: 'saml.616c696365406578616d706c652e6f7267'
            });
        });

        it('should generate a profile for a user with an email id and provider', () => {
            const user = Util.profileToUser('saml', { id: 'alice@example.org', provider: 'doge' });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                email: '616c696365406578616d706c652e6f7267@loopback.doge.com',
                username: 'doge.616c696365406578616d706c652e6f7267'
            });
        });

        it('should generate a profile for a user with an email id and special provider', () => {
            const user = Util.profileToUser('saml_is_cool', { id: 'alice@example.org' });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                email: '616c696365406578616d706c652e6f7267@loopback.73616d6c5f69735f636f6f6c.com',
                username: '73616d6c5f69735f636f6f6c.616c696365406578616d706c652e6f7267'
            });
        });

        it('should generate a profile for a user with an email id and special profile provider', () => {
            const user = Util.profileToUser('saml', { id: 'alice@example.org', provider: 'doge_is_cool' });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                email: '616c696365406578616d706c652e6f7267@loopback.646f67655f69735f636f6f6c.com',
                username: '646f67655f69735f636f6f6c.616c696365406578616d706c652e6f7267'
            });
        });

        it('should generate a profile for an LDAP user with a username and email', () => {
            const user = Util.profileToUser('ldap', { username: 'alice', emails: [{ value: 'alice@example.org' }] });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                email: 'alice@example.org',
                username: 'ldap.alice'
            });
        });

        it('should generate a profile for an LDAP user with an id and email', () => {
            const user = Util.profileToUser('ldap', { id: 'alice', emails: [{ value: 'alice@example.org' }] });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                email: 'alice@example.org',
                username: 'ldap.alice'
            });
        });

        it('should generate a profile for an LDAP user with a username and no emails', () => {
            const user = Util.profileToUser('ldap', { username: 'alice' });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                username: 'ldap.alice'
            });
        });

        it('should generate a profile for an LDAP user with an id and no emails', () => {
            const user = Util.profileToUser('ldap', { id: 'alice' });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                username: 'ldap.alice'
            });
        });

        it('should generate a profile for an LDAP user with a username and empty emails', () => {
            const user = Util.profileToUser('ldap', { username: 'alice', emails: [] });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                username: 'ldap.alice'
            });
        });

        it('should generate a profile for an LDAP user with an id and empty emails', () => {
            const user = Util.profileToUser('ldap', { id: 'alice', emails: [] });
            user.password.should.be.a('string');
            delete user.password;
            user.should.deep.equal({
                username: 'ldap.alice'
            });
        });

    });

});
