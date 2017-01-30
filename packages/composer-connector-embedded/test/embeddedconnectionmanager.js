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

const Connection = require('composer-common').Connection;
const ConnectionManager = require('composer-common').ConnectionManager;
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const EmbeddedConnectionManager = require('..');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('EmbeddedConnectionManager', () => {

    let mockConnectionProfileManager;
    let connectionManager;

    beforeEach(() => {
        mockConnectionProfileManager = sinon.createStubInstance(ConnectionProfileManager);
        connectionManager = new EmbeddedConnectionManager(mockConnectionProfileManager);
    });

    describe('#constructor', () => {

        it('should construct a new connection manager', () => {
            connectionManager.should.be.an.instanceOf(ConnectionManager);
        });

    });

    describe('#connect', () => {

        it('should return a new connection', () => {
            return connectionManager.connect('devFabric1', 'org.acme.Business', {})
                .should.eventually.be.an.instanceOf(Connection);
        });

    });

});
