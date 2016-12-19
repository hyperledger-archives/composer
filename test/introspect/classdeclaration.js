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

const ClassDeclaration = require('../../lib/introspect/classdeclaration');
const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');

require('chai').should();
const sinon = require('sinon');

describe('ClassDeclaration', () => {

    let mockModelManager;
    let mockModelFile;

    beforeEach(() => {
        mockModelManager = sinon.createStubInstance(ModelManager);
        mockModelFile = sinon.createStubInstance(ModelFile);
        mockModelFile.getModelManager.returns(mockModelManager);
    });

    describe('#constructor', () => {

        it('should throw if modelFile not specified', () => {
            (() => {
                new ClassDeclaration(null, {});
            }).should.throw(/required/);
        });

        it('should throw if ast not specified', () => {
            (() => {
                new ClassDeclaration(mockModelFile, null);
            }).should.throw(/required/);
        });

        it('should throw if ast contains invalid type', () => {
            (() => {
                new ClassDeclaration(mockModelFile, {
                    id: {
                        name: 'suchName'
                    },
                    body: {
                        declarations: [
                            {
                                type: 'noSuchType'
                            }
                        ]
                    }
                });
            }).should.throw(/Unrecognised model element/);
        });

    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let clz = new ClassDeclaration(mockModelFile, {
                id: {
                    name: 'suchName'
                },
                body: {
                    declarations: [
                    ]
                }
            });
            let visitor = {
                visit: sinon.stub()
            };
            clz.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, clz, ['some', 'args']);
        });

    });

    describe('#getModelFile', () => {

        it('should return the model file', () => {
            let clz = new ClassDeclaration(mockModelFile, {
                id: {
                    name: 'suchName'
                },
                body: {
                    declarations: [
                    ]
                }
            });
            clz.getModelFile().should.equal(mockModelFile);
        });

    });

    describe('#getName', () => {

        it('should return the class name', () => {
            let clz = new ClassDeclaration(mockModelFile, {
                id: {
                    name: 'suchName'
                },
                body: {
                    declarations: [
                    ]
                }
            });
            clz.getName().should.equal('suchName');
        });

    });

    describe('#getFullyQualifiedName', () => {

        it('should return the fully qualified name if function is in a namespace', () => {
            mockModelFile.getNamespace.returns('com.ibm.testing');
            let clz = new ClassDeclaration(mockModelFile, {
                id: {
                    name: 'suchName'
                },
                body: {
                    declarations: [
                    ]
                }
            });
            clz.getFullyQualifiedName().should.equal('com.ibm.testing.suchName');
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            let clz = new ClassDeclaration(mockModelFile, {
                id: {
                    name: 'suchName'
                },
                body: {
                    declarations: [
                    ]
                }
            });
            clz.toJSON().should.deep.equal({});
        });

    });

});
