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

const ClassDeclaration = require('../../lib/introspect/classdeclaration');
const AssetDeclaration = require('../../lib/introspect/assetdeclaration');
const EnumDeclaration = require('../../lib/introspect/enumdeclaration');
const ConceptDeclaration = require('../../lib/introspect/conceptdeclaration');
const ParticipantDeclaration = require('../../lib/introspect/participantdeclaration');
const TransactionDeclaration = require('../../lib/introspect/transactiondeclaration');
const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const fs = require('fs');

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

    let loadLastDeclaration = (modelFileName, type) => {
        let modelDefinitions = fs.readFileSync(modelFileName, 'utf8');
        let modelFile = new ModelFile(mockModelManager, modelDefinitions);
        let assets = modelFile.getDeclarations(type);
        return assets[assets.length - 1];
    };

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

    describe('#validate', () => {


        it('should throw when asset name is duplicted in a modelfile', () => {
            let asset = loadLastDeclaration('test/data/parser/classdeclaration.dupeassetname.cto', AssetDeclaration);
            (() => {
                asset.validate();
            }).should.throw(/Duplicate class/);
        });

        it('should throw when transaction name is duplicted in a modelfile', () => {
            let asset = loadLastDeclaration('test/data/parser/classdeclaration.dupetransactionname.cto', TransactionDeclaration);
            (() => {
                asset.validate();
            }).should.throw(/Duplicate class/);
        });

        it('should throw when participant name is duplicted in a modelfile', () => {
            let asset = loadLastDeclaration('test/data/parser/classdeclaration.dupeparticipantname.cto', ParticipantDeclaration);
            (() => {
                asset.validate();
            }).should.throw(/Duplicate class/);
        });

        it('should throw when concept name is duplicted in a modelfile', () => {
            let asset = loadLastDeclaration('test/data/parser/classdeclaration.dupeconceptname.cto', ConceptDeclaration);
            (() => {
                asset.validate();
            }).should.throw(/Duplicate class/);
        });

        it('should throw when enum name is duplicted in a modelfile', () => {
            let asset = loadLastDeclaration('test/data/parser/classdeclaration.dupeenumname.cto', EnumDeclaration);
            (() => {
                asset.validate();
            }).should.throw(/Duplicate class/);
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
