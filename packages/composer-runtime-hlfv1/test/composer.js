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

const Composer = require('../lib/composer');
const MockStub = require('./mockstub');
const NodeContainer = require('../lib/nodecontainer');
const Engine = require('composer-runtime').Engine;
const Context = require('composer-runtime').Context;
const shim = require('fabric-shim');
const fs = require('fs');

require('chai').should();
const sinon = require('sinon');

describe('Composer', () => {

    let sandbox;
    let composer, mockStub, mockEngine, mockContext;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        composer = new Composer();
        mockStub = sinon.createStubInstance(MockStub);
        mockEngine = sinon.createStubInstance(Engine);
        mockContext = sinon.createStubInstance(Context);

    });

    afterEach(() => {
        sandbox.restore();
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
                    sinon.assert.calledWith(composer._createContext, mockEngine, mockStub);
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

        it('handle composer develper mode', () => {
            sandbox.stub(shim, 'success').returns();
            sandbox.stub(fs, 'readFileSync').returns(new Buffer('filecontents'));
            sinon.stub(composer.container, 'initLogging').resolves();
            mockStub.getFunctionAndParameters.returns({fcn:'init', params:['afilename']});
            mockEngine.init.resolves();
            process.env.COMPOSER_DEV_MODE=true;
            return composer.Init(mockStub)
                .then(() => {
                    sinon.assert.calledOnce(mockEngine.init);
                    sinon.assert.calledWith(mockEngine.init, mockContext, 'init', ['ZmlsZWNvbnRlbnRz']);
                    sinon.assert.calledWith(composer._createContext, mockEngine, mockStub);
                    sinon.assert.calledOnce(shim.success);
                    sinon.assert.calledOnce(fs.readFileSync);
                    sinon.assert.calledWith(fs.readFileSync, 'afilename');
                    delete process.env.COMPOSER_DEV_MODE;
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
                    sinon.assert.calledWith(composer._createContext, mockEngine, mockStub);
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
            let engine = composer._createContext(mockEngine, mockStub);
            engine.should.be.instanceOf(Context);
        });
    });

});
