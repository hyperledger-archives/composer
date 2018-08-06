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

const createServer = require('..');
const http = require('http');
const io = require('socket.io-client');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-http'));
const sinon = require('sinon');

describe('#createServer', () => {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should start a server and return the port', async () => {
        const app = await createServer(0, false);
        app.get('port').should.be.greaterThan(0);
    });

    it('should start a socket.io server', async () => {
        const app = await createServer(0, false);
        const port = app.get('port');
        const socket = io(`http://localhost:${port}`, {
            autoConnect: false
        });
        await new Promise((resolve, reject) => {
            socket.once('connect', () => {
                resolve();
            });
            socket.open();
        });
        const result = await new Promise((resolve, reject) => {
            socket.emit('/api/ping', (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            });
        });
        result.version.should.be.a('string');
        await new Promise((resolve, reject) => {
            socket.once('disconnect', () => {
                resolve();
            });
            socket.close();
        });
    });

    it('should start a server in test mode', async () => {
        const app = await createServer(0, true);
        const result = await chai.request(app).get('/api/getSampleList');
        result.body.should.deep.equal([{ name: 'basic-sample-network' }]);
    });

    it('should throw an error if listen throws an error', async () => {
        const server = http.createServer();
        sandbox.stub(http, 'createServer').returns(server);
        sinon.stub(server, 'listen').throws(new Error('such throw error'));
        await createServer(0, false)
            .should.be.rejectedWith(/such throw error/);
    });

    it('should throw an error if listen calls the callback with an error', async () => {
        const server = http.createServer();
        sandbox.stub(http, 'createServer').returns(server);
        sinon.stub(server, 'listen').yields(new Error('such callback error'));
        await createServer(0, false)
            .should.be.rejectedWith(/such callback error/);
    });

});