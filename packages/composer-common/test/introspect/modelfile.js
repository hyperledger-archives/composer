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
const EnumDeclaration = require('../../lib/introspect/enumdeclaration');
const IllegalModelException = require('../../lib/introspect/illegalmodelexception');
const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const ParseException = require('../../lib/introspect/parseexception');
const parser = require('../../lib/introspect/parser');
const fs = require('fs');
const path = require('path');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('ModelFile', () => {

    const carLeaseModel = fs.readFileSync(path.resolve(__dirname, '../data/model/carlease.cto'), 'utf8');

    let modelManager;
    let sandbox;

    beforeEach(() => {
        modelManager = new ModelManager();
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw when null definitions provided', () => {
            (() => {
                new ModelFile(modelManager, null);
            }).should.throw(/as a string as input/);
        });

        it('should throw when invalid definitions provided', () => {
            (() => {
                new ModelFile(modelManager, [{}]);
            }).should.throw(/as a string as input/);
        });

        it('should throw when invalid filename provided', () => {
            (() => {
                new ModelFile(modelManager, 'fake', {});
            }).should.throw(/filename as a string/);
        });

        it('should call the parser with the definitions and save the abstract syntax tree', () => {
            const ast = {
                namespace: 'org.acme',
                body: [ ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let mf = new ModelFile(modelManager, 'fake definitions');
            mf.ast.should.equal(ast);
            mf.namespace.should.equal('org.acme');
        });

        it('should call the parser with the definitions and save any imports', () => {
            const imports = [ {namespace: 'org.freddos'}, {namespace: 'org.doge'} ];
            const ast = {
                namespace: 'org.acme',
                imports: imports,
                body: [ ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let mf = new ModelFile(modelManager, 'fake definitions');
            mf.imports.should.deep.equal(['org.hyperledger.composer.system.Event', 'org.hyperledger.composer.system.Transaction', 'org.hyperledger.composer.system.Participant', 'org.hyperledger.composer.system.Asset', 'org.freddos', 'org.doge']);
        });

        it('should call the parser with the definitions and save imports with uris', () => {
            const imports = [ {namespace: 'org.doge'}, {namespace: 'org.freddos.*', uri: 'https://freddos.org/model.cto'} ];
            const ast = {
                namespace: 'org.acme',
                imports: imports,
                body: [ ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let mf = new ModelFile(modelManager, 'fake definitions');
            mf.imports.should.deep.equal(['org.hyperledger.composer.system.Event', 'org.hyperledger.composer.system.Transaction', 'org.hyperledger.composer.system.Participant', 'org.hyperledger.composer.system.Asset', 'org.doge', 'org.freddos.*']);
            mf.getImportURI('org.freddos.*').should.equal('https://freddos.org/model.cto');
            (mf.getImportURI('org.doge') === null).should.be.true;
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
                new ModelFile(modelManager, 'fake definitions');
            }).should.throw(ParseException, /Line 99 column 99/);
        });

        it('should handle a normal parsing exception with a file name', () => {
            sandbox.stub(parser, 'parse').throws({
                location: {
                    start: {
                        line: 99,
                        column: 99
                    }
                }
            });
            (() => {
                new ModelFile(modelManager, 'fake definitions', 'mf1.cto');
            }).should.throw(ParseException, /File mf1.cto line 99 column 99/);
        });

        it('should handle any other parsing exception', () => {
            sandbox.stub(parser, 'parse').throws(new Error('fake error'));
            (() => {
                new ModelFile(modelManager, 'fake definitions');
            }).should.throw(/fake error/);
            let error = new Error('fake error 2');
            error.location = {};
            parser.parse.throws(error);
            (() => {
                new ModelFile(modelManager, 'fake definitions');
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
                new ModelFile(modelManager, 'fake definitions');
            }).should.throw(/BlahType/);
        });

    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let mf = new ModelFile(modelManager, carLeaseModel);
            let visitor = {
                visit: sinon.stub()
            };
            mf.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, mf, ['some', 'args']);
        });

    });

    describe('#validate', () => {

        it('should throw if an import exists for an invalid namespace', () => {
            const model = `
            namespace org.acme
            import org.acme.ext.MyAsset2
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelFile = new ModelFile(modelManager, model);
            (() => {
                modelFile.validate();
            }).should.throw(IllegalModelException, /org.acme.ext/);
        });

        it('should throw if a wildcard import exists for an invalid namespace', () => {
            const model = `
            namespace org.acme
            import org.acme.ext.*
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelFile = new ModelFile(modelManager, model);
            (() => {
                modelFile.validate();
            }).should.throw(IllegalModelException, /org.acme.ext/);
        });

        it('should throw if an import exists for a type that does not exist in a valid namespace', () => {
            const model1 = `
            namespace org.acme.ext
            asset MyAsset2 identified by assetId {
                o String assetId
            }`;
            const model2 = `
            namespace org.acme
            import org.acme.ext.MyAsset3
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelFile1 = new ModelFile(modelManager, model1);
            modelManager.addModelFile(modelFile1);
            let modelFile2 = new ModelFile(modelManager, model2);
            (() => {
                modelFile2.validate();
            }).should.throw(IllegalModelException, /MyAsset3/);
        });

        it('should not throw if an import exists for a type that exists in a valid namespace', () => {
            const model1 = `
            namespace org.acme.ext
            asset MyAsset2 identified by assetId {
                o String assetId
            }`;
            const model2 = `
            namespace org.acme
            import org.acme.ext.MyAsset2
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelFile1 = new ModelFile(modelManager, model1);
            modelManager.addModelFile(modelFile1);
            let modelFile2 = new ModelFile(modelManager, model2);
            (() => modelFile2.validate()).should.not.throw();
        });

        it('should not throw if a wildcard import exists for a valid namespace', () => {
            const model1 = `
            namespace org.acme.ext
            asset MyAsset2 identified by assetId {
                o String assetId
            }`;
            const model2 = `
            namespace org.acme
            import org.acme.ext.*
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelFile1 = new ModelFile(modelManager, model1);
            modelManager.addModelFile(modelFile1);
            let modelFile2 = new ModelFile(modelManager, model2);
            (() => modelFile2.validate()).should.not.throw();
        });

    });

    describe('#getDefinitions', () => {

        it('should return the definitions for the model', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            modelFile.getDefinitions().should.equal(carLeaseModel);
        });

    });

    describe('#getName', () => {

        it('should return the name of the model', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel, 'car lease');
            modelFile.getName().should.equal('car lease');
        });

    });

    describe('#isImportedType', () => {

        it('should return false for a non-existent type', () => {
            const model = `
            namespace org.acme
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelFile = new ModelFile(modelManager, model);
            modelFile.isImportedType('Fred').should.be.false;
        });

        it('should return false for a local type', () => {
            const model = `
            namespace org.acme
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelFile = new ModelFile(modelManager, model);
            modelFile.isImportedType('MyAsset').should.be.false;
        });

        it('should return true for an explicitly imported type', () => {
            const model = `
            namespace org.acme
            import org.acme.ext.MyAsset2
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelFile = new ModelFile(modelManager, model);
            modelFile.isImportedType('MyAsset2').should.be.true;
        });

        it('should return true for a type that exists in a namespace imported by wildcard', () => {
            const model1 = `
            namespace org.acme.ext
            asset MyAsset2 identified by assetId {
                o String assetId
            }`;
            const model2 = `
            namespace org.acme
            import org.acme.ext.*
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelFile1 = new ModelFile(modelManager, model1);
            modelManager.addModelFile(modelFile1);
            let modelFile2 = new ModelFile(modelManager, model2);
            modelFile2.isImportedType('MyAsset2').should.be.true;
        });

        it('should return false for a type that does not exist in a namespace imported by wildcard', () => {
            const model1 = `
            namespace org.acme.ext
            asset MyAsset2 identified by assetId {
                o String assetId
            }`;
            const model2 = `
            namespace org.acme
            import org.acme.ext.*
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelFile1 = new ModelFile(modelManager, model1);
            modelManager.addModelFile(modelFile1);
            let modelFile2 = new ModelFile(modelManager, model2);
            modelFile2.isImportedType('MyAsset3').should.be.false;
        });

        it('should return false for a type that does not exist in an invalid namespace imported by wildcard', () => {
            const model1 = `
            namespace org.acme.ext
            asset MyAsset2 identified by assetId {
                o String assetId
            }`;
            const model2 = `
            namespace org.acme
            import org.acme.another.*
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelFile1 = new ModelFile(modelManager, model1);
            modelManager.addModelFile(modelFile1);
            let modelFile2 = new ModelFile(modelManager, model2);
            modelFile2.isImportedType('MyAsset3').should.be.false;
        });

    });

    describe('#resolveImport', () => {

        it('should find the fully qualified name of a type in the system namespace', () => {
            const model = `
            namespace org.acme`;
            let modelFile = new ModelFile(modelManager, model);
            modelFile.resolveImport('Asset').should.equal('org.hyperledger.composer.system.Asset');
        });

        it('should find the fully qualified name of the import', () => {
            const model = `
            namespace org.acme
            import org.doge.Coin`;
            let modelFile = new ModelFile(modelManager, model);
            modelFile.resolveImport('Coin').should.equal('org.doge.Coin');
        });

        it('should find the fully qualified name of a type using a wildcard import', () => {
            const model1 = `
            namespace org.acme.ext
            asset MyAsset2 identified by assetId {
                o String assetId
            }`;
            const model2 = `
            namespace org.acme
            import org.acme.ext.*
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelFile1 = new ModelFile(modelManager, model1);
            modelManager.addModelFile(modelFile1);
            let modelFile2 = new ModelFile(modelManager, model2);
            modelFile2.resolveImport('MyAsset2').should.equal('org.acme.ext.MyAsset2');
        });

        it('should throw if it cannot resolve a type that is not imported', () => {
            const model = `
            namespace org.acme
            import org.doge.Wow`;
            let modelFile = new ModelFile(modelManager, model);
            (() => {
                modelFile.resolveImport('Coin');
            }).should.throw(/Coin/);
        });

        it('should throw if it cannot resolve a type that does not exist in a wildcard import', () => {
            const model1 = `
            namespace org.acme.ext
            asset MyAsset2 identified by assetId {
                o String assetId
            }`;
            const model2 = `
            namespace org.acme
            import org.acme.ext.*
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelFile1 = new ModelFile(modelManager, model1);
            modelManager.addModelFile(modelFile1);
            let modelFile2 = new ModelFile(modelManager, model2);
            (() => {
                modelFile2.resolveImport('Coin');
            }).should.throw(/Coin/);
        });

        it('should throw if it cannot resolve a type that does not exist in a wildcard import of an invalid namespace', () => {
            const model1 = `
            namespace org.acme.ext
            asset MyAsset2 identified by assetId {
                o String assetId
            }`;
            const model2 = `
            namespace org.acme
            import org.acme.another.*
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelFile1 = new ModelFile(modelManager, model1);
            modelManager.addModelFile(modelFile1);
            let modelFile2 = new ModelFile(modelManager, model2);
            (() => {
                modelFile2.resolveImport('Coin');
            }).should.throw(/Coin/);
        });

        it('relatioship to an asset that does not exist', () => {
            const model2 = `
            namespace org.acme

            asset MyAsset identified by assetId {
                o String assetId
                --> DontExist relationship
            }`;

            let modelFile2 = new ModelFile(modelManager, model2);
            (() => {
                modelFile2.validate();
            }).should.throw(/DontExist/);
        });


    });

    describe('#isDefined', () => {

        let modelManager;
        let modelFile;

        before(() => {
            modelManager = new ModelManager();
            modelFile = modelManager.addModelFile(`namespace org.acme
            asset MyAsset identified by assetId {
                o String assetId
            }`);
        });

        it('should return true for a primitive type', () => {
            modelFile.isDefined('String').should.be.true;
        });

        it('should return true for a local type', () => {
            modelFile.isDefined('MyAsset').should.be.true;
        });

        it('should return false for a local type that does not exist', () => {
            modelFile.isDefined('NoAsset').should.be.false;
        });

    });

    describe('#getType', () => {

        it('should passthrough the type name for primitive types', () => {
            const ast = {
                namespace: 'org.acme',
                body: [ ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let mf = new ModelFile(modelManager, 'fake definitions');
            mf.getType('String').should.equal('String');
        });

        it('should return false if imported, non primative\'s modelFile doesn\'t exist', () => {
            const ast = {
                namespace: 'org.acme',
                body: [ ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let mf = new ModelFile(modelManager, 'fake');
            mf.isImportedType = () => { return true; };
            mf.resolveImport = () => { return 'org.acme'; };
            should.not.exist(mf.getType('TNTAsset'));
        });
    });

    describe('#getAssetDeclaration', () => {

        it('should return the specified asset declaration', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            let asset = modelFile.getAssetDeclaration('Vehicle');
            asset.should.be.an.instanceOf(AssetDeclaration);
        });

        it('should return null if it cannot find the specified asset declaration', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            let asset = modelFile.getAssetDeclaration('Blobby');
            should.equal(asset, null);
        });

    });

    describe('#getParticipantDeclaration', () => {

        it('should return the specified Participant declaration', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            let participant = modelFile.getParticipantDeclaration('Regulator');
            participant.should.be.an.instanceOf(ParticipantDeclaration);
        });

        it('should return null if it cannot find the specified Participant declaration', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            let participant = modelFile.getParticipantDeclaration('Blobby');
            should.equal(participant, null);
        });

    });

    describe('#getTransactionDeclaration', () => {

        it('should return the specified Transaction declaration', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            let transaction = modelFile.getTransactionDeclaration('VehicleCreated');
            transaction.should.be.an.instanceOf(TransactionDeclaration);
        });

        it('should return null if it cannot find the specified Transaction declaration', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            let transaction = modelFile.getTransactionDeclaration('Blobby');
            should.equal(transaction, null);
        });

    });

    describe('#getEventDeclaration', () => {

        it('should return the specified Event declaration', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            let event = modelFile.getEventDeclaration('TestEvent');
            event.should.be.an.instanceOf(EventDeclaration);
        });

        it('should return null if it cannot find the specified Event declaration', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            let transaction = modelFile.getEventDeclaration('Blobby');
            should.equal(transaction, null);
        });

    });

    describe('#getEventDeclarations', () => {

        it('should return the expected number of Event declarations with system types', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            let events = modelFile.getEventDeclarations();
            events.length.should.equal(1);
        });

        it('should return the expected number of Event declarations with system types', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            let events = modelFile.getEventDeclarations(true);
            events.length.should.equal(1);
        });

        it('should return the expected number of Event declarations without system types', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            let events = modelFile.getEventDeclarations(false);
            events.length.should.equal(1);
            let i;
            for(i = 0; i < events.length; i++) {
                events[i].modelFile.should.have.property('systemModelFile', false);
            }
        });
    });

    describe('#getEnumDeclarations', () => {

        it('should return the expected number of Enum declarations with system types', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            let decls = modelFile.getEnumDeclarations();
            decls.should.all.be.an.instanceOf(EnumDeclaration);
            decls.length.should.equal(1);
            // TO DO ADD IN CHECK FOR TRUE AND FALSE, CHECK THAT SYSTEM TYPE IS CORRECT USING FOR LOOP LIKE EARLIER
        });

        it('should return the expected number of Enum declarations with system types', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            let decls = modelFile.getEnumDeclarations(true);
            decls.should.all.be.an.instanceOf(EnumDeclaration);
            decls.length.should.equal(1);
        });

        it('should return the expected number of Enum declarations without system types', () => {
            let modelFile = new ModelFile(modelManager, carLeaseModel);
            let decls = modelFile.getEnumDeclarations(false);
            decls.should.all.be.an.instanceOf(EnumDeclaration);
            decls.length.should.equal(1);
            let i;
            for(i = 0; i < decls.length; i++) {
                decls[i].modelFile.should.have.property('systemModelFile', false);
            }
        });

    });

    describe('#getFullyQualifiedTypeName', () => {
        it('should return null if not prmative, imported or local type', () => {
            const ast = {
                namespace: 'org.acme',
                body: [ ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let mf = new ModelFile(modelManager, 'fake');
            mf.isImportedType = () => { return false; };
            mf.isLocalType = () => { return false; };
            should.not.exist(mf.getFullyQualifiedTypeName('TNTAsset'));
        });

        it('should return the type name if its a primative type', () => {
            const ast = {
                namespace: 'org.acme',
                body: [ ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let modelFile = new ModelFile(modelManager, 'something');

            modelFile.getFullyQualifiedTypeName('String').should.equal('String');
        });
    });
});
