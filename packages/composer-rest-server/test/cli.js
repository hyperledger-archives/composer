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

const Util = require('../lib/util');

require('chai').should();
const proxyquire =  require('proxyquire').noPreserveCache();
const sinon = require('sinon');
require('sinon-as-promised');

describe('composer-rest-server CLI unit tests', () => {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(Util, 'getConnectionSettings').resolves({
            profilename: 'defaultProfile',
            businessNetworkId: 'org-acme-biznet',
            userid: 'admin',
            secret: 'adminpw',
            namespaces: 'always',
            security: false
        });
        sandbox.stub(process, 'exit');
        sandbox.spy(console, 'log');
        sandbox.spy(console, 'error');
        Object.keys(process.env).forEach((key) => {
            if (key.match(/^COMPOSER_/)) {
                delete process.env[key];
            }
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should call inquirer if no arguments specified and start the server', () => {
        let listen = sinon.stub();
        process.argv = [ process.argv0 ];
        const server = sinon.stub();
        server.resolves({
            listen: listen
        });
        return proxyquire('../cli', {
            clear: () => { },
            chalk: {
                yellow: () => { return ''; }
            },
            './server/server': server
        }).then(() => {
            sinon.assert.calledOnce(Util.getConnectionSettings);
            const settings = {
                businessNetworkIdentifier: 'org-acme-biznet',
                connectionProfileName: 'defaultProfile',
                namespaces: 'always',
                participantId: 'admin',
                participantPwd: 'adminpw',
                security: false
            };
            sinon.assert.calledWith(server, settings);
            sinon.assert.calledOnce(listen);
        });
    });

    it('should throw an error if command line arguments specified but some are missing', () => {
        let listen = sinon.stub();
        process.argv = [ process.argv0, 'cli.js', '-n', 'org-acme-biznet' ];
        delete require.cache[require.resolve('yargs')];
        return proxyquire('../cli', {
            clear: () => { },
            chalk: {
                yellow: () => { return ''; }
            },
            './server/server': () => {
                return Promise.resolve({
                    listen: listen
                });
            }
        }).then(() => {
            sinon.assert.notCalled(Util.getConnectionSettings);
            sinon.assert.calledOnce(process.exit);
            sinon.assert.calledWith(process.exit, 1);
            sinon.assert.calledWith(console.error, sinon.match(/to see usage details/));
        });
    });

    it('should use the argumemts from yargs and start the server', () => {
        let listen = sinon.stub();
        process.argv = [
            process.argv0, 'cli.js',
            '-p', 'defaultProfile',
            '-n', 'org-acme-biznet',
            '-i', 'admin',
            '-s', 'adminpw'
        ];
        delete require.cache[require.resolve('yargs')];
        const server = sinon.stub();
        server.resolves({
            listen: listen
        });
        return proxyquire('../cli', {
            clear: () => { },
            chalk: {
                yellow: () => { return ''; }
            },
            './server/server': server
        }).then(() => {
            sinon.assert.notCalled(Util.getConnectionSettings);
            const settings = {
                businessNetworkIdentifier: 'org-acme-biznet',
                connectionProfileName: 'defaultProfile',
                namespaces: 'always',
                participantId: 'admin',
                participantPwd: 'adminpw',
                port: undefined,
                security: false
            };
            sinon.assert.calledWith(server, settings);
            sinon.assert.calledOnce(listen);
        });
    });

    it('should start and log information when running with explorer', () => {
        let listen = sinon.stub();
        let emit = sinon.stub();
        let get = sinon.stub();
        get.withArgs('url').returns('http://localhost:3000');
        get.withArgs('loopback-component-explorer').returns(true);
        process.argv = [
            process.argv0, 'cli.js',
            '-p', 'defaultProfile',
            '-n', 'org-acme-biznet',
            '-i', 'admin',
            '-s', 'adminpw'
        ];
        delete require.cache[require.resolve('yargs')];
        const server = sinon.stub();
        server.resolves({
            listen: listen,
            emit: emit,
            get: get
        });
        return proxyquire('../cli', {
            clear: () => { },
            chalk: {
                yellow: () => { return ''; }
            },
            './server/server': server
        }).then(() => {
            sinon.assert.calledOnce(listen);
            listen.args[0][0]();
            sinon.assert.calledOnce(emit);
            sinon.assert.calledWith(emit, 'started');
            sinon.assert.calledWith(console.log, sinon.match(/Web server listening at/));
            sinon.assert.calledWith(console.log, sinon.match(/Browse your REST API at/));
        });
    });

    it('should start and log information when running without explorer', () => {
        let listen = sinon.stub();
        let emit = sinon.stub();
        let get = sinon.stub();
        get.withArgs('url').returns('http://localhost:3000');
        process.argv = [
            process.argv0, 'cli.js',
            '-p', 'defaultProfile',
            '-n', 'org-acme-biznet',
            '-i', 'admin',
            '-s', 'adminpw'
        ];
        delete require.cache[require.resolve('yargs')];
        const server = sinon.stub();
        server.resolves({
            listen: listen,
            emit: emit,
            get: get
        });
        return proxyquire('../cli', {
            clear: () => { },
            chalk: {
                yellow: () => { return ''; }
            },
            './server/server': server
        }).then(() => {
            sinon.assert.calledOnce(listen);
            listen.args[0][0]();
            sinon.assert.calledOnce(emit);
            sinon.assert.calledWith(emit, 'started');
            sinon.assert.calledWith(console.log, sinon.match(/Web server listening at/));
            sinon.assert.neverCalledWith(console.log, sinon.match(/Browse your REST API at/));
        });
    });

});
