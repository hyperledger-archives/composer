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

const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const Composer = require('../lib/composer');
const NodeContainer = require('../lib/nodecontainer');
const { Context, Engine, InstalledBusinessNetwork } = require('composer-runtime');
const shim = require('fabric-shim');
const ChaincodeStub = require('fabric-shim/lib/stub');

require('chai').should();
const sinon = require('sinon');

describe('Composer', () => {
    const sandbox = sinon.sandbox.create();

    let composer;
    let mockStub;
    let mockEngine;
    let mockContext;
    let testBusinessNetwork;

    beforeEach(() => {
        mockStub = sinon.createStubInstance(ChaincodeStub);
        mockEngine = sinon.createStubInstance(Engine);
        mockContext = sinon.createStubInstance(Context);
        testBusinessNetwork = new BusinessNetworkDefinition('business-network@1.0.0-test');
        return InstalledBusinessNetwork.newInstance(testBusinessNetwork)
            .then(installedBusinessNetwork => {
                composer = new Composer(installedBusinessNetwork);
            });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#start', () => {
        beforeEach(() => {
            sandbox.stub(BusinessNetworkDefinition, 'fromDirectory').resolves(testBusinessNetwork);
            sandbox.stub(shim, 'start').returns();
        });

        it('should call shim.start()', () => {
            return Composer.start().then(() => {
                sinon.assert.calledOnce(shim.start);
            });
        });

        it('should pass a Composer instance with installed business network', () => {
            return Composer.start().then(() => {
                sinon.assert.calledWith(shim.start,
                    sinon.match(composer => composer.installedBusinessNetwork.getDefinition() === testBusinessNetwork));
            });
        });
    });

    describe('#start error', () => {
        beforeEach(() => {
            sandbox.stub(BusinessNetworkDefinition, 'fromDirectory').throws(new Error('FromDirectory Error'));
        });

        it('should not call shim.start()', () => {
            try {
                return Composer.start().then(() => {
                });
            } catch (error) {
                sinon.assert.not.calledOnce(shim.start);
                sinon.match(error.message, 'FromDirectory Error');
            }
        });
    });

    describe('#constructor', () => {
        it('should construct with a new NodeContainer', () => {
            composer.container.should.be.an.instanceOf(NodeContainer);
        });

    });

    describe('#Init', () => {
        beforeEach(() => {
            sinon.stub(composer, '_createEngine').returns(mockEngine);
            sinon.stub(composer, '_createContext').returns(mockContext);
        });

        it('initialise logging and call engine init', () => {
            sandbox.stub(shim, 'success').returns();
            sinon.stub(composer.container, 'initLogging').resolves();
            mockStub.getFunctionAndParameters.returns({fcn:'init', params:[]});
            mockEngine.init.resolves();

            return composer.Init(mockStub)
                .then(() => {
                    sinon.assert.calledOnce(mockEngine.init);
                    sinon.assert.calledWith(mockEngine.init, mockContext, 'init', []);
                    sinon.assert.calledWith(composer._createContext, mockEngine, mockStub);
                    sinon.assert.calledOnce(shim.success);
                });
        });

        it('initialise logging throws an error', () => {
            sandbox.stub(shim, 'error').returns();
            let error = new Error('some loginit error');
            sinon.stub(composer.container, 'initLogging').rejects(error);
            mockStub.getFunctionAndParameters.returns({fcn:'someFn', params:[]});
            mockEngine.init.resolves();

            return composer.Init(mockStub)
                .then(() => {
                    sinon.assert.notCalled(composer._createContext);
                    sinon.assert.notCalled(mockEngine.init);
                    sinon.assert.calledOnce(shim.error);
                    sinon.assert.calledWith(shim.error, error);
                });
        });

        it('engine invoke throws an error', () => {
            sandbox.stub(shim, 'error').returns();
            sinon.stub(composer.container, 'initLogging').resolves();
            mockStub.getFunctionAndParameters.returns({fcn:'someFn', params:[]});
            let error = new Error('some engine error');
            mockEngine.init.rejects(error);


            return composer.Init(mockStub)
                .then(() => {
                    sinon.assert.calledOnce(mockEngine.init);
                    sinon.assert.calledWith(mockEngine.init, mockContext, 'someFn', []);
                    sinon.assert.calledWith(composer._createContext, mockEngine, mockStub);
                    sinon.assert.calledOnce(shim.error);
                    sinon.assert.calledWith(shim.error, error);
                });
        });
    });

    describe('#Invoke', () => {
        beforeEach(() => {
            sinon.stub(composer, '_createEngine').returns(mockEngine);
            sinon.stub(composer, '_createContext').returns(mockContext);
        });

        it('initialise logging and call engine invoke that returns a payload', () => {
            sandbox.stub(shim, 'success').returns();
            sinon.stub(composer.container, 'initLogging').resolves();
            mockStub.getFunctionAndParameters.returns({fcn:'someFn', params:[]});
            mockEngine.invoke.resolves({data: 'somepayload'});

            return composer.Invoke(mockStub)
                .then(() => {
                    sinon.assert.calledOnce(mockEngine.invoke);
                    sinon.assert.calledWith(mockEngine.invoke, mockContext, 'someFn', []);
                    sinon.assert.calledWith(composer._createContext, mockEngine, mockStub);
                    sinon.assert.calledOnce(shim.success);
                    sinon.assert.calledWith(shim.success, Buffer.from('{"data":"somepayload"}'));
                });
        });

        it('initialise logging and call engine invoke that returns undefined as a payload', () => {
            sandbox.stub(shim, 'success').returns();
            sinon.stub(composer.container, 'initLogging').resolves();
            mockStub.getFunctionAndParameters.returns({fcn:'someFn', params:[]});
            mockEngine.invoke.resolves();

            return composer.Invoke(mockStub)
                .then(() => {
                    sinon.assert.calledOnce(mockEngine.invoke);
                    sinon.assert.calledWith(mockEngine.invoke, mockContext, 'someFn', []);
                    sinon.assert.calledWith(composer._createContext, mockEngine, mockStub);
                    sinon.assert.calledOnce(shim.success);
                    sinon.assert.calledWithExactly(shim.success);
                });
        });

        it('initialise logging and call engine invoke that returns null payload', () => {
            sandbox.stub(shim, 'success').returns();
            sinon.stub(composer.container, 'initLogging').resolves();
            mockStub.getFunctionAndParameters.returns({fcn:'someFn', params:[]});
            mockEngine.invoke.resolves(null);

            return composer.Invoke(mockStub)
                .then(() => {
                    sinon.assert.calledOnce(mockEngine.invoke);
                    sinon.assert.calledWith(mockEngine.invoke, mockContext, 'someFn', []);
                    sinon.assert.calledWith(composer._createContext, mockEngine, mockStub);
                    sinon.assert.calledOnce(shim.success);
                    sinon.assert.calledWithExactly(shim.success);
                });
        });

        it('initialise logging and call engine invoke that returns true payload', () => {
            sandbox.stub(shim, 'success').returns();
            sinon.stub(composer.container, 'initLogging').resolves();
            mockStub.getFunctionAndParameters.returns({fcn:'someFn', params:[]});
            mockEngine.invoke.resolves(true);

            return composer.Invoke(mockStub)
                .then(() => {
                    sinon.assert.calledOnce(mockEngine.invoke);
                    sinon.assert.calledWith(mockEngine.invoke, mockContext, 'someFn', []);
                    sinon.assert.calledWith(composer._createContext, mockEngine, mockStub);
                    sinon.assert.calledOnce(shim.success);
                    sinon.assert.calledWithExactly(shim.success, Buffer.from('true'));
                });
        });

        it('initialise logging and call engine invoke that returns false payload', () => {
            sandbox.stub(shim, 'success').returns();
            sinon.stub(composer.container, 'initLogging').resolves();
            mockStub.getFunctionAndParameters.returns({fcn:'someFn', params:[]});
            mockEngine.invoke.resolves(false);

            return composer.Invoke(mockStub)
                .then(() => {
                    sinon.assert.calledOnce(mockEngine.invoke);
                    sinon.assert.calledWith(mockEngine.invoke, mockContext, 'someFn', []);
                    sinon.assert.calledWith(composer._createContext, mockEngine, mockStub);
                    sinon.assert.calledOnce(shim.success);
                    sinon.assert.calledWithExactly(shim.success, Buffer.from('false'));
                });
        });


        it('initialise logging throws an error', () => {
            sandbox.stub(shim, 'error').returns();
            let error = new Error('some loginit error');
            sinon.stub(composer.container, 'initLogging').rejects(error);
            mockStub.getFunctionAndParameters.returns({fcn:'someFn', params:[]});
            mockEngine.invoke.resolves();

            return composer.Invoke(mockStub)
                .then(() => {
                    sinon.assert.notCalled(composer._createContext);
                    sinon.assert.notCalled(mockEngine.invoke);
                    sinon.assert.calledOnce(shim.error);
                    sinon.assert.calledWith(shim.error, error);
                });
        });

        it('engine invoke throws an error', () => {
            sandbox.stub(shim, 'error').returns();
            sinon.stub(composer.container, 'initLogging').resolves();
            mockStub.getFunctionAndParameters.returns({fcn:'someFn', params:[]});
            let error = new Error('some engine error');
            mockEngine.invoke.rejects(error);

            return composer.Invoke(mockStub)
                .then(() => {
                    sinon.assert.calledOnce(mockEngine.invoke);
                    sinon.assert.calledWith(mockEngine.invoke, mockContext, 'someFn', []);
                    sinon.assert.calledWith(composer._createContext, mockEngine, mockStub);
                    sinon.assert.calledOnce(shim.error);
                    sinon.assert.calledWith(shim.error, error);
                });
        });
    });

    describe('#_createEngine', () => {
        it('should create an engine', () => {
            let engine = composer._createEngine();
            engine.should.be.instanceOf(Engine);
        });
    });

    describe('#_createContext', () => {
        it('should create a context', () => {
            const context = composer._createContext(mockEngine, mockStub);
            context.should.be.instanceOf(Context);
        });
    });

});
