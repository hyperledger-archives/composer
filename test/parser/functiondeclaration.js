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

const FunctionDeclaration = require('../../lib/introspect/functiondeclaration');
const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const TransactionDeclaration = require('../../lib/introspect/transactiondeclaration');
const fs = require('fs');

require('chai').should();
const sinon = require('sinon');

describe('FunctionDeclaration', () => {

    let mockModelManager;

    beforeEach(() => {
        mockModelManager = sinon.createStubInstance(ModelManager);
    });

    let loadFunctionDeclaration = (modelFileName) => {
        let modelDefinitions = fs.readFileSync(modelFileName, 'utf8');
        let modelFile = new ModelFile(mockModelManager, modelDefinitions);
        let functions = modelFile.getFunctions();
        functions.should.have.lengthOf(1);
        return functions[0];
    };

    describe('#constructor', () => {

        it('should throw if modelFile not specified', () => {
            (() => {
                new FunctionDeclaration(null, {});
            }).should.throw(/required/);
        });

        it('should throw if ast not specified', () => {
            let mockModelFile = sinon.createStubInstance(ModelFile);
            (() => {
                new FunctionDeclaration(mockModelFile, null);
            }).should.throw(/required/);
        });

    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.cto');
            let visitor = {
                visit: sinon.stub()
            };
            func.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, func, ['some', 'args']);
        });

    });

    describe('#getName', () => {

        it('should return the function name', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.cto');
            func.getName().should.equal('onTestTransaction');
        });

    });

    describe('#getModelFile', () => {

        it('should return the model file', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.cto');
            func.getModelFile().should.be.an.instanceOf(ModelFile);
        });

    });

    describe('#getFunctionText', () => {

        it('should return the function text', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.cto');
            func.getFunctionText().should.match(/^function onTestTransaction\(testTransaction, param1, param2\)/);
        });

    });

    describe('#getParameters', () => {

        it('should return the function parameters', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.cto');
            func.getParameters().should.deep.equal(['testTransaction', 'param1', 'param2']);
        });

    });

    describe('#getTransactionDeclarationName', () => {

        it('should return the transaction name', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.cto');
            func.getTransactionDeclarationName().should.equal('TestTransaction');
        });

    });

    describe('#getFullyQualifiedName', () => {

        it('should return the fully qualified name if function is in a namespace', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.cto');
            func.getFullyQualifiedName().should.equal('com.ibm.testing.onTestTransaction');
        });

    });

    describe('#validate', () => {

        it('should throw if the function refers to a transaction that does not exist', () => {
            (() => {
                let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.missingtx.cto');
                func.validate();
            }).should.throw(/Could not find transaction/);
        });

        it('should throw if the function refers to a transaction that is not a transaction', () => {
            (() => {
                let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.notatx.cto');
                func.validate();
            }).should.throw(/is not a transaction/);
        });

        it('should resolve an imported transaction', () => {
            let mockTransactionDeclaration = sinon.createStubInstance(TransactionDeclaration);
            mockModelManager.getType.returns(mockTransactionDeclaration);
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.resolve.cto');
            func.validate();
            sinon.assert.calledOnce(mockModelManager.getType);
            sinon.assert.calledWith(mockModelManager.getType, 'com.ibm.elsewhere.TestTransaction');
        });

    });

    describe('#toJSON', () => {

        it('should return a JSON object suitable for serialization', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.cto');
            let jsonObject = func.toJSON();
            jsonObject.should.be.an('object');
            jsonObject.name.should.equal('onTestTransaction');
            jsonObject.params.should.deep.equal(['testTransaction', 'param1', 'param2']);
            jsonObject.functionText.should.match(/^function onTestTransaction\(testTransaction, param1, param2\)/);
        });

    });

});
