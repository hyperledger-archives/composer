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

/* const startRestServer = */ require('../..').startRestServer;

require('chai').should();
const proxyquire =  require('proxyquire').noPreserveCache();
const sinon = require('sinon');


describe('servercmd', () => {

    const composerConfig = {
        connectionProfileName: 'defaultProfile',
        businessNetworkIdentifier: 'bond-network',
        participantId: 'admin',
        participantPwd: 'adminpw'
    };

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.spy(console, 'log');
        sandbox.spy(console, 'error');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should be exported from the module', () => {
        const module = require('../..');
        const servercmd = require('../../server/servercmd');
        module.startRestServer.should.equal(servercmd.startRestServer);
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
        return proxyquire('../../server/servercmd', {
            './server': server
        }).startRestServer(composerConfig)
            .then(() => {
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
        return proxyquire('../../server/servercmd', {
            './server': server
        }).startRestServer(composerConfig)
            .then(() => {
                sinon.assert.calledOnce(listen);
                listen.args[0][0]();
                sinon.assert.calledOnce(emit);
                sinon.assert.calledWith(emit, 'started');
                sinon.assert.calledWith(console.log, sinon.match(/Web server listening at/));
                sinon.assert.neverCalledWith(console.log, sinon.match(/Browse your REST API at/));
            });
    });

});
