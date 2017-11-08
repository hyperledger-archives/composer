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

const path = require('path');
const Util = require('../lib/util');

require('chai').should();
const proxyquire =  require('proxyquire').noPreserveCache();
const sinon = require('sinon');

const defaultTlsCertificate = path.resolve(__dirname, '..', 'cert.pem');
const defaultTlsKey = path.resolve(__dirname, '..', 'key.pem');

describe('composer-rest-server CLI unit tests', () => {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(Util, 'getConnectionSettings').resolves({
            card: 'admin@org-acme-biznet',
            namespaces: 'always',
            authentication: false,
            websockets: true,
            tls: false
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

    it('should call version and give the correct version', () => {
        process.argv = [ process.argv0, 'cli.js', '-v' ];
        delete require.cache[require.resolve('yargs')];
        return proxyquire('../cli', {})
            .then(() => {
                // Meh
            })
            .catch((error) => {
                error.should.be.null;
            });
    });

    it('should call inquirer if no arguments specified and start the server', () => {
        let listen = sinon.stub();
        let get = sinon.stub();
        get.withArgs('port').returns(3000);
        process.argv = [ process.argv0 ];
        const server = sinon.stub().resolves({
            app: {
                get
            },
            server: {
                listen
            }
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
                card: 'admin@org-acme-biznet',
                namespaces: 'always',
                authentication: false,
                multiuser: undefined,
                websockets: true,
                tls: false,
                tlscert: undefined,
                tlskey: undefined
            };
            sinon.assert.calledWith(server, settings);
            sinon.assert.calledOnce(listen);
            listen.args[0][0].should.equal(3000);
            listen.args[0][1].should.be.a('function');
        });
    });

    it('should throw an error if command line arguments specified but some are missing', () => {
        let listen = sinon.stub();
        process.argv = [ process.argv0, 'cli.js', '-a' ];
        delete require.cache[require.resolve('yargs')];
        const server = sinon.stub().resolves({
            app: {

            },
            server: {
                listen
            }
        });
        return proxyquire('../cli', {
            clear: () => { },
            chalk: {
                yellow: () => { return ''; }
            },
            './server/server': server
        }).then(() => {
            sinon.assert.notCalled(Util.getConnectionSettings);
            sinon.assert.calledOnce(process.exit);
            sinon.assert.calledWith(process.exit, 1);
            sinon.assert.calledWith(console.error, sinon.match(/to see usage details/));
        });
    });

    it('should use the arguments from yargs and start the server', () => {
        let listen = sinon.stub();
        let get = sinon.stub();
        get.withArgs('port').returns(3000);
        process.argv = [
            process.argv0, 'cli.js',
            '-c', 'admin@org-acme-biznet'
        ];
        delete require.cache[require.resolve('yargs')];
        const server = sinon.stub().resolves({
            app: {
                get
            },
            server: {
                listen
            }
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
                card: 'admin@org-acme-biznet',
                namespaces: 'always',
                port: undefined,
                authentication: false,
                multiuser: false,
                websockets: true,
                tls: false,
                tlscert: defaultTlsCertificate,
                tlskey: defaultTlsKey
            };
            sinon.assert.calledWith(server, settings);
            sinon.assert.calledOnce(listen);
            listen.args[0][0].should.equal(3000);
            listen.args[0][1].should.be.a('function');
        });
    });

    it('should not enable multiuser if authentication specified', () => {
        let listen = sinon.stub();
        let get = sinon.stub();
        get.withArgs('port').returns(3000);
        process.argv = [
            process.argv0, 'cli.js',
            '-c', 'admin@org-acme-biznet',
            '-a'
        ];
        delete require.cache[require.resolve('yargs')];
        const server = sinon.stub().resolves({
            app: {
                get
            },
            server: {
                listen
            }
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
                card: 'admin@org-acme-biznet',
                namespaces: 'always',
                port: undefined,
                authentication: true,
                multiuser: false,
                websockets: true,
                tls: false,
                tlscert: defaultTlsCertificate,
                tlskey: defaultTlsKey
            };
            sinon.assert.calledWith(server, settings);
            sinon.assert.calledOnce(listen);
            listen.args[0][0].should.equal(3000);
            listen.args[0][1].should.be.a('function');
        });
    });

    it('should automatically enable authentication if multiuser specified', () => {
        let listen = sinon.stub();
        let get = sinon.stub();
        get.withArgs('port').returns(3000);
        process.argv = [
            process.argv0, 'cli.js',
            '-c', 'admin@org-acme-biznet',
            '-m'
        ];
        delete require.cache[require.resolve('yargs')];
        const server = sinon.stub().resolves({
            app: {
                get
            },
            server: {
                listen
            }
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
                card: 'admin@org-acme-biznet',
                namespaces: 'always',
                port: undefined,
                authentication: true,
                multiuser: true,
                websockets: true,
                tls: false,
                tlscert: defaultTlsCertificate,
                tlskey: defaultTlsKey
            };
            sinon.assert.calledWith(server, settings);
            sinon.assert.calledOnce(listen);
            listen.args[0][0].should.equal(3000);
            listen.args[0][1].should.be.a('function');
        });
    });

    it('should start and log information when running with explorer', () => {
        let listen = sinon.stub();
        let emit = sinon.stub();
        let get = sinon.stub();
        get.withArgs('port').returns(3000);
        get.withArgs('url').returns('http://localhost:3000');
        get.withArgs('loopback-component-explorer').returns(true);
        process.argv = [
            process.argv0, 'cli.js',
            '-c', 'admin@org-acme-biznet'
        ];
        delete require.cache[require.resolve('yargs')];
        const server = sinon.stub().resolves({
            app: {
                emit,
                get
            },
            server: {
                listen
            }
        });
        return proxyquire('../cli', {
            clear: () => { },
            chalk: {
                yellow: () => { return ''; }
            },
            './server/server': server
        }).then(() => {
            sinon.assert.calledOnce(listen);
            listen.args[0][0].should.equal(3000);
            listen.args[0][1]();
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
        get.withArgs('port').returns(3000);
        get.withArgs('url').returns('http://localhost:3000');
        process.argv = [
            process.argv0, 'cli.js',
            '-c', 'admin@org-acme-biznet'
        ];
        delete require.cache[require.resolve('yargs')];
        const server = sinon.stub().resolves({
            app: {
                emit,
                get
            },
            server: {
                listen
            }
        });
        return proxyquire('../cli', {
            clear: () => { },
            chalk: {
                yellow: () => { return ''; }
            },
            './server/server': server
        }).then(() => {
            sinon.assert.calledOnce(listen);
            listen.args[0][0].should.equal(3000);
            listen.args[0][1]();
            sinon.assert.calledOnce(emit);
            sinon.assert.calledWith(emit, 'started');
            sinon.assert.calledWith(console.log, sinon.match(/Web server listening at/));
            sinon.assert.neverCalledWith(console.log, sinon.match(/Browse your REST API at/));
        });
    });

});
