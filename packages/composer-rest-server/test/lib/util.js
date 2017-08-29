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

        it('should interactively ask for the connection settings', () => {
            return Util.getConnectionSettings()
                .then(() => {
                    sinon.assert.calledOnce(inquirer.prompt);
                    const questions = inquirer.prompt.args[0][0]; // First call, first argument.
                    const names = questions.map((question) => {
                        return question.name;
                    });
                    names.should.deep.equal(['profilename', 'businessNetworkId', 'userid', 'secret', 'namespaces', 'authentication', 'multiuser', 'websockets', 'tls', 'tlscert', 'tlskey']);
                });
        });

        it('should validate the length of the connection profile name', () => {
            return Util.getConnectionSettings()
                .then(() => {
                    sinon.assert.calledOnce(inquirer.prompt);
                    const questions = inquirer.prompt.args[0][0]; // First call, first argument.
                    const question = questions.find((question) => {
                        return question.name === 'profilename';
                    });
                    question.validate('').should.match(/Please enter/);
                    question.validate('hlfabric').should.be.true;
                });
        });

        it('should validate the length of the business network identifier', () => {
            return Util.getConnectionSettings()
                .then(() => {
                    sinon.assert.calledOnce(inquirer.prompt);
                    const questions = inquirer.prompt.args[0][0]; // First call, first argument.
                    const question = questions.find((question) => {
                        return question.name === 'businessNetworkId';
                    });
                    question.validate('').should.match(/Please enter/);
                    question.validate('org-acme-biznet').should.be.true;
                });
        });

        it('should validate the length of the enrollment ID', () => {
            return Util.getConnectionSettings()
                .then(() => {
                    sinon.assert.calledOnce(inquirer.prompt);
                    const questions = inquirer.prompt.args[0][0]; // First call, first argument.
                    const question = questions.find((question) => {
                        return question.name === 'userid';
                    });
                    question.validate('').should.match(/Please enter/);
                    question.validate('admin').should.be.true;
                });
        });

        it('should validate the length of the enrollment secret', () => {
            return Util.getConnectionSettings()
                .then(() => {
                    sinon.assert.calledOnce(inquirer.prompt);
                    const questions = inquirer.prompt.args[0][0]; // First call, first argument.
                    const question = questions.find((question) => {
                        return question.name === 'secret';
                    });
                    question.validate('').should.match(/Please enter/);
                    question.validate('adminpw').should.be.true;
                });
        });

        it('should only enable the multiuser question if TLS enabled', () => {
            return Util.getConnectionSettings()
                .then(() => {
                    sinon.assert.calledOnce(inquirer.prompt);
                    const questions = inquirer.prompt.args[0][0]; // First call, first argument.
                    const question = questions.find((question) => {
                        return question.name === 'multiuser';
                    });
                    question.when({ authentication: false }).should.be.false;
                    question.when({ authentication: true }).should.be.true;
                });
        });

        it('should only enable the TLS certificate question if TLS enabled', () => {
            return Util.getConnectionSettings()
                .then(() => {
                    sinon.assert.calledOnce(inquirer.prompt);
                    const questions = inquirer.prompt.args[0][0]; // First call, first argument.
                    const question = questions.find((question) => {
                        return question.name === 'tlscert';
                    });
                    question.when({ tls: false }).should.be.false;
                    question.when({ tls: true }).should.be.true;
                });
        });

        it('should only enable the TLS key question if TLS enabled', () => {
            return Util.getConnectionSettings()
                .then(() => {
                    sinon.assert.calledOnce(inquirer.prompt);
                    const questions = inquirer.prompt.args[0][0]; // First call, first argument.
                    const question = questions.find((question) => {
                        return question.name === 'tlskey';
                    });
                    question.when({ tls: false }).should.be.false;
                    question.when({ tls: true }).should.be.true;
                });
        });

    });

});
