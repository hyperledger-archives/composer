/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const Factory = require('../lib/factory');
const JSON2 = require('JSON2');
const ModelManager = require('../lib/modelmanager');
const Resource = require('../lib/model/resource');
const ResourceValidator = require('../lib/serializer/resourcevalidator');
const Serializer = require('../lib/serializer');
require('chai').should();
const sinon = require('sinon');

describe('Serializer', () => {

    let sandbox;
    let mockFactory;
    let mockModelManager;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockFactory = sinon.createStubInstance(Factory);
        mockModelManager = sinon.createStubInstance(ModelManager);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw if factory not specified', () => {
            (() => {
                new Serializer(null, mockModelManager);
            }).should.throw(/Factory cannot be null/);
        });

        it('should throw if modelManager not specified', () => {
            (() => {
                new Serializer(mockFactory, null);
            }).should.throw(/ModelManager cannot be null/);
        });

    });

    describe('#toJSON', () => {

        it('should throw if resource not a Resource', () => {
            let serializer = new Serializer(mockFactory, mockModelManager);
            (() => {
                serializer.toJSON([{}]);
            }).should.throw(/only accepts instances of Resource/);
        });

        it('should throw if the class declaration cannot be found', () => {
            let mockResource = sinon.createStubInstance(Resource);
            let serializer = new Serializer(mockFactory, mockModelManager);
            (() => {
                mockModelManager.getType.returns(null);
                serializer.toJSON(mockResource);
            }).should.throw(/Failed to find type/);
        });

        it('should validate if the validate flag is set to true', () => {
            let mockResource = sinon.createStubInstance(Resource);
            let serializer = new Serializer(mockFactory, mockModelManager);
            let mockClassDeclaration = {
                accept: (generator, parameters) => {
                    parameters.writer = {
                        getBuffer: () => { return '{}'; }
                    };
                }
            };
            sandbox.spy(mockClassDeclaration, 'accept');
            mockModelManager.getType.returns(mockClassDeclaration);
            serializer.toJSON(mockResource, {
                validate: true
            });
            sinon.assert.calledTwice(mockClassDeclaration.accept);
            sinon.assert.calledWith(mockClassDeclaration.accept, sinon.match.instanceOf(ResourceValidator));
        });

        it('should not validate if the validate flag is set to false', () => {
            let mockResource = sinon.createStubInstance(Resource);
            let serializer = new Serializer(mockFactory, mockModelManager);
            let mockClassDeclaration = {
                accept: (generator, parameters) => {
                    parameters.writer = {
                        getBuffer: () => { return '{}'; }
                    };
                }
            };
            sandbox.spy(mockClassDeclaration, 'accept');
            mockModelManager.getType.returns(mockClassDeclaration);
            serializer.toJSON(mockResource, {
                validate: false
            });
            sinon.assert.calledOnce(mockClassDeclaration.accept);
            sinon.assert.neverCalledWith(mockClassDeclaration.accept, sinon.match.instanceOf(ResourceValidator));
        });

        it('should handle an error parsing the generated JSON', () => {
            let mockResource = sinon.createStubInstance(Resource);
            let serializer = new Serializer(mockFactory, mockModelManager);
            let mockClassDeclaration = {
                accept: (generator, parameters) => {
                    parameters.writer = {
                        getBuffer: () => { return '{}'; }
                    };
                }
            };
            sandbox.spy(mockClassDeclaration, 'accept');
            mockModelManager.getType.returns(mockClassDeclaration);
            serializer.toJSON(mockResource);
            sandbox.stub(JSON2, 'parse').throws();
            (() => {
                serializer.toJSON(mockResource);
            }).should.throw(/Generated invalid JSON/);
        });

    });

    describe('#fromJSON', () => {

        it('should throw if object is not a class', () => {
            let serializer = new Serializer(mockFactory, mockModelManager);
            (() => {
                serializer.fromJSON({});
            }).should.throw(/Does not contain a \$class type identifier/);
        });

        it('should throw if the class declaration cannot be found', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.$class = 'com.ibm.test.Asset';
            let serializer = new Serializer(mockFactory, mockModelManager);
            (() => {
                mockModelManager.getType.returns(null);
                serializer.fromJSON(mockResource);
            }).should.throw(/Failed to find type/);
        });

    });

});
