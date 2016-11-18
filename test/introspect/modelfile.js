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

const AssetDeclaration = require('../../lib/introspect/assetdeclaration');
const ParticipantDeclaration = require('../../lib/introspect/participantdeclaration');
const TransactionDeclaration = require('../../lib/introspect/transactiondeclaration');
const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const ParseException = require('../../lib/introspect/parseexception');
const parser = require('../../lib/introspect/parser');
const fs = require('fs');
const path = require('path');

const should = require('chai').should();
const sinon = require('sinon');

describe('ModelFile', () => {

    const carLeaseModel = fs.readFileSync(path.resolve(__dirname, '../data/model/carlease.cto'), 'utf8');

    let mockModelManager;
    let sandbox;

    beforeEach(() => {
        mockModelManager = sinon.createStubInstance(ModelManager);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#fromJSON', () => {

        it('should round trip the model file', () => {
            let modelFile1 = new ModelFile(mockModelManager, carLeaseModel);
            let json = JSON.stringify(modelFile1);
            let modelFile2 = ModelFile.fromJSON(mockModelManager, JSON.parse(json));
            modelFile2.should.deep.equal(modelFile1);
        });

    });

    describe('#constructor', () => {

        it('should throw when null definitions provided', () => {
            (() => {
                new ModelFile(mockModelManager, null);
            }).should.throw(/as a string as input/);
        });

        it('should throw when invalid definitions provided', () => {
            (() => {
                new ModelFile(mockModelManager, [{}]);
            }).should.throw(/as a string as input/);
        });

        it('should call the parser with the definitions and save the abstract syntax tree', () => {
            const ast = {
                namespace: 'org.acme',
                body: [ ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let mf = new ModelFile(mockModelManager, 'fake definitions');
            mf.ast.should.equal(ast);
            mf.namespace.should.equal('org.acme');
        });

        it('should call the parser with the definitions and save any imports', () => {
            const imports = [ 'org.freddos', 'org.doge' ];
            const ast = {
                namespace: 'org.acme',
                imports: imports,
                body: [ ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let mf = new ModelFile(mockModelManager, 'fake definitions');
            mf.imports.should.deep.equal(imports);
        });

        it('should handle a normal parsing exception', () => {
            sandbox.stub(parser, 'parse').throws({
                location: {
                    start: {
                        line: 99,
                        column: 99
                    }
                }
            });
            (() => {
                new ModelFile(mockModelManager, 'fake definitions');
            }).should.throw(ParseException, /Line 99 column 99/);
        });

        it('should handle any other parsing exception', () => {
            sandbox.stub(parser, 'parse').throws(new Error('fake error'));
            (() => {
                new ModelFile(mockModelManager, 'fake definitions');
            }).should.throw(/fake error/);
            let error = new Error('fake error 2');
            error.location = {};
            parser.parse.throws(error);
            (() => {
                new ModelFile(mockModelManager, 'fake definitions');
            }).should.throw(/fake error 2/);
        });

        it('should throw for an unrecognized body element', () => {
            const ast = {
                namespace: 'org.acme',
                body: [ {
                    type: 'BlahType'
                } ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            (() => {
                new ModelFile(mockModelManager, 'fake definitions');
            }).should.throw(/BlahType/);
        });

    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let mf = new ModelFile(mockModelManager, carLeaseModel);
            let visitor = {
                visit: sinon.stub()
            };
            mf.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, mf, ['some', 'args']);
        });

    });

    describe('#getDefinitions', () => {

        it('should return the name of the model', () => {
            let modelFile = new ModelFile(mockModelManager, carLeaseModel);
            modelFile.getDefinitions().should.equal(carLeaseModel);
        });

    });

    describe('#resolveImport', () => {

        it('should find the fully qualified name of the import', () => {
            const ast = {
                namespace: 'org.acme',
                imports: [ 'org.doge.Coin' ],
                body: [ ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let mf = new ModelFile(mockModelManager, 'fake definitions');
            mf.resolveImport('Coin').should.equal('org.doge.Coin');
        });

        it('should throw if it cannot find the fully qualified name of the import', () => {
            const ast = {
                namespace: 'org.acme',
                imports: [ 'org.doge.Wow' ],
                body: [ ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let mf = new ModelFile(mockModelManager, 'fake definitions');
            (() => {
                mf.resolveImport('Coin');
            }).should.throw(/Coin/);
        });

    });

    describe('#getType', () => {

        it('should passthrough the type name for primitive types', () => {
            const ast = {
                namespace: 'org.acme',
                body: [ ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let mf = new ModelFile(mockModelManager, 'fake definitions');
            mf.getType('String').should.equal('String');
        });

    });

    describe('#toJSON', () => {

        it('should return a JSON object suitable for serialization', () => {
            let modelFile = new ModelFile(mockModelManager, carLeaseModel);
            let parsed = modelFile.toJSON();
            // parsed.declarations.should.be.an('array');
            // parsed.imports.should.be.an('array');
            parsed.definitions.should.equal(carLeaseModel);
            // parsed.ast.should.be.an('object');
            parsed.namespace.should.equal('org.acme');
            parsed.imports.should.be.an('array');
            parsed.assets.should.be.an('array');
            parsed.participants.should.be.an('array');
            parsed.transactions.should.be.an('array');
            parsed.enums.should.be.an('array');
        });

    });

    describe('#getAssetDeclaration', () => {

        it('should return the specified asset declaration', () => {
            let modelFile = new ModelFile(mockModelManager, carLeaseModel);
            let asset = modelFile.getAssetDeclaration('Vehicle');
            asset.should.be.an.instanceOf(AssetDeclaration);
        });

        it('should return null if it cannot find the specified asset declaration', () => {
            let modelFile = new ModelFile(mockModelManager, carLeaseModel);
            let asset = modelFile.getAssetDeclaration('Blobby');
            should.equal(asset, null);
        });

    });

    describe('#getParticipantDeclaration', () => {

        it('should return the specified Participant declaration', () => {
            let modelFile = new ModelFile(mockModelManager, carLeaseModel);
            let participant = modelFile.getParticipantDeclaration('Regulator');
            participant.should.be.an.instanceOf(ParticipantDeclaration);
        });

        it('should return null if it cannot find the specified Participant declaration', () => {
            let modelFile = new ModelFile(mockModelManager, carLeaseModel);
            let participant = modelFile.getParticipantDeclaration('Blobby');
            should.equal(participant, null);
        });

    });

    describe('#getTransactionDeclaration', () => {

        it('should return the specified Transaction declaration', () => {
            let modelFile = new ModelFile(mockModelManager, carLeaseModel);
            let transaction = modelFile.getTransactionDeclaration('VehicleCreated');
            transaction.should.be.an.instanceOf(TransactionDeclaration);
        });

        it('should return null if it cannot find the specified Transaction declaration', () => {
            let modelFile = new ModelFile(mockModelManager, carLeaseModel);
            let transaction = modelFile.getTransactionDeclaration('Blobby');
            should.equal(transaction, null);
        });

    });

});
