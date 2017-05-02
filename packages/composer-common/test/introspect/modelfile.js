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

const AssetDeclaration = require('../../lib/introspect/assetdeclaration');
const ParticipantDeclaration = require('../../lib/introspect/participantdeclaration');
const TransactionDeclaration = require('../../lib/introspect/transactiondeclaration');
const EventDeclaration = require('../../lib/introspect/eventdeclaration');
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

        it('should throw when invalid filename provided', () => {
            (() => {
                new ModelFile(mockModelManager, 'fake', {});
            }).should.throw(/filename as a string/);
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

        it('should return the definitions for the model', () => {
            let modelFile = new ModelFile(mockModelManager, carLeaseModel);
            modelFile.getDefinitions().should.equal(carLeaseModel);
        });

    });

    describe('#getName', () => {

        it('should return the name of the model', () => {
            let modelFile = new ModelFile(mockModelManager, carLeaseModel, 'car lease');
            modelFile.getName().should.equal('car lease');
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

        it('should return an empty object', () => {
            let modelFile = new ModelFile(mockModelManager, carLeaseModel);
            let parsed = modelFile.toJSON();
            parsed.should.deep.equal({});
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

    describe('#getEventDeclaration', () => {

        it('should return the specified Event declaration', () => {
            let modelFile = new ModelFile(mockModelManager, carLeaseModel);
            let event = modelFile.getEventDeclaration('TestEvent');
            event.should.be.an.instanceOf(EventDeclaration);
        });

        it('should return null if it cannot find the specified Event declaration', () => {
            let modelFile = new ModelFile(mockModelManager, carLeaseModel);
            let transaction = modelFile.getEventDeclaration('Blobby');
            should.equal(transaction, null);
        });

    });

    describe('#getEventDeclarations', () => {

        it('should return the expected number of Event declarations', () => {
            let modelFile = new ModelFile(mockModelManager, carLeaseModel);
            let events = modelFile.getEventDeclarations();
            events.length.should.equal(1);
        });
    });

});
