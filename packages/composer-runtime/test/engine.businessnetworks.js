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


const Container = require('../lib/container');
const Context = require('../lib/context');
const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const Engine = require('../lib/engine');
const LoggingService = require('../lib/loggingservice');
const RegistryManager = require('../lib/registrymanager');
const version = require('../package.json').version;
const Serializer = require('composer-common').Serializer;
const AccessController = require('../lib/accesscontroller');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('EngineBusinessNetworks', () => {

    let mockContainer;
    let mockLoggingService;
    let mockContext;
    let mockDataService;
    let mockRegistryManager;
    let engine;
    let sandbox;
    let mockSerializer, mockAccessController;

    beforeEach(() => {
        mockSerializer = sinon.createStubInstance(Serializer);
        mockLoggingService = sinon.createStubInstance(LoggingService);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);

        mockContainer = sinon.createStubInstance(Container);
        mockContainer.getLoggingService.returns(mockLoggingService);
        mockContainer.getVersion.returns(version);

        mockDataService = sinon.createStubInstance(DataService);
        const sysdata = sinon.createStubInstance(DataCollection);
        mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);

        mockContext = sinon.createStubInstance(Context);
        mockContext.initialize.resolves();
        mockContext.transactionStart.resolves();
        mockContext.transactionPrepare.resolves();
        mockContext.transactionCommit.resolves();
        mockContext.transactionRollback.resolves();
        mockContext.transactionEnd.resolves();
        mockContext.getSerializer.returns(mockSerializer);
        mockContext.getDataService.returns(mockDataService);
        mockContext.getRegistryManager.returns(mockRegistryManager);

        mockAccessController = sinon.createStubInstance(AccessController);
        mockContext.getAccessController.returns(mockAccessController);

        engine = new Engine(mockContainer);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#getBusinessNetwork', () => {
        const businessNetworkArchive = 'aGVsbG8gd29ybGQ=';

        beforeEach(() => {
            mockContext.getBusinessNetworkArchive.returns(businessNetworkArchive);
        });

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'getBusinessNetwork', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "getBusinessNetwork", expecting "\[\]"/);
        });

        it('should return the business network archive', () => {
            return engine.query(mockContext, 'getBusinessNetwork', [])
                .should.become({ data: businessNetworkArchive });
        });

        it('should check READ access', () => {
            return engine.query(mockContext, 'getBusinessNetwork', []).then(() => {
                sinon.assert.calledWithExactly(mockAccessController.check, sinon.match.any, 'READ');
            });
        });
    });

});
