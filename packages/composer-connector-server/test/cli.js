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
const FileSystemCardStore = require('composer-common').FileSystemCardStore;
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const Logger = require('composer-common').Logger;

const proxyquire = require('proxyquire');
const sinon = require('sinon');

describe('composer-connector-server CLI unit tests', () => {

    let originalArgv = process.argv;
    let sandbox;
    let mockSocket;
    let mockSocketIO;
    let mockConnectorServer;

    beforeEach(() => {
        delete require.cache[require.resolve('yargs')];
        sandbox = sinon.sandbox.create();
        sandbox.stub(process, 'exit');
        mockSocket = {
            on : sinon.stub()
        };
        mockSocketIO = sinon.stub();
        mockConnectorServer = sinon.stub();
    });

    afterEach(() => {
        sandbox.restore();
        process.argv = originalArgv;
        Logger.setFunctionalLogger(null);
    });

    it('should start a connector server on the default port', () => {
        mockSocketIO.returns(mockSocket);
        proxyquire('../cli.js', {
            'socket.io' : mockSocketIO
        });
        sinon.assert.calledOnce(mockSocketIO);
        sinon.assert.calledWith(mockSocketIO, 15699);
    });

    it('should start a connector server on the specified port', () => {
        process.argv = [process.argv0, 'cli.js', '-p', '23456'];
        mockSocketIO.returns(mockSocket);
        proxyquire('../cli.js', {
            'socket.io' : mockSocketIO
        });
        sinon.assert.calledOnce(mockSocketIO);
        sinon.assert.calledWith(mockSocketIO, 23456);
    });

    it('should register a connect listener', () => {
        const mockClientSocket = {
            id : 1,
            request : {
                connection : {
                    remoteAddress : 'localhost'
                }
            },
            on : sinon.stub()
        };
        mockSocketIO.returns(mockSocket);
        mockSocket.on.withArgs('connect', sinon.match.func).yields(mockClientSocket);
        proxyquire('../cli.js', {
            'socket.io' : mockSocketIO,
            '.' : mockConnectorServer
        });
        sinon.assert.calledOnce(mockConnectorServer);
        sinon.assert.calledWith(mockConnectorServer, sinon.match.instanceOf(FileSystemCardStore), sinon.match.instanceOf(ConnectionProfileManager), mockClientSocket);
    });

    it('should register a disconnect listener', () => {
        const mockClientSocket = {
            id : 1,
            request : {
                connection : {
                    remoteAddress : 'localhost'
                }
            },
            on : sinon.stub()
        };
        mockSocketIO.returns(mockSocket);
        mockSocket.on.withArgs('disconnect', sinon.match.func).yields(mockClientSocket);
        proxyquire('../cli.js', {
            'socket.io' : mockSocketIO,
            '.' : mockConnectorServer
        });
    });

});
