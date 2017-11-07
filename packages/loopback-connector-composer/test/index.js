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

const BusinessNetworkConnector = require('../lib/businessnetworkconnector');
const connectorModule = require('..');

require('chai').should();
const sinon = require('sinon');

describe('loopback-connector-composer', () => {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#createConnector', () => {

        it('should create and return a new instance of the connector', () => {
            const settings = {
                card : 'admin@biznet'
            };
            let connector = connectorModule.createConnector(settings);
            connector.should.be.an.instanceOf(BusinessNetworkConnector);
        });

    });

    describe('#initialize', () => {

        let mockBusinessNetworkConnector;

        beforeEach(() => {
            mockBusinessNetworkConnector = sinon.createStubInstance(BusinessNetworkConnector);
            mockBusinessNetworkConnector.connect.onFirstCall().yields();
            sandbox.stub(connectorModule, 'createConnector').returns(mockBusinessNetworkConnector);
        });

        it('should create, connect, and return a new instance of the connector', () => {
            let dataSource = {
                settings : {}
            };
            return new Promise((resolve, reject) => {
                connectorModule.initialize(dataSource, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    dataSource.connector.should.be.an.instanceOf(BusinessNetworkConnector);
                    sinon.assert.calledOnce(connectorModule.createConnector);
                    sinon.assert.calledWith(connectorModule.createConnector, dataSource.settings);
                    sinon.assert.calledOnce(mockBusinessNetworkConnector.connect);
                    mockBusinessNetworkConnector.connecting = true;
                });
        });

        it('should handle missing data source settings', () => {
            let dataSource = {
                settings : null
            };
            return new Promise((resolve, reject) => {
                connectorModule.initialize(dataSource, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    dataSource.connector.should.be.an.instanceOf(BusinessNetworkConnector);
                    sinon.assert.calledOnce(connectorModule.createConnector);
                    sinon.assert.calledWith(connectorModule.createConnector, {});
                    sinon.assert.calledOnce(mockBusinessNetworkConnector.connect);
                    mockBusinessNetworkConnector.connecting = true;
                });
        });

        it('should handle missing callback parameter', () => {
            let dataSource = {
                settings : {}
            };
            connectorModule.initialize(dataSource);
            dataSource.connector.should.be.an.instanceOf(BusinessNetworkConnector);
            sinon.assert.calledOnce(connectorModule.createConnector);
            sinon.assert.calledWith(connectorModule.createConnector, {});
            mockBusinessNetworkConnector.connecting = false;
        });
    });
});
