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

const chai = require('chai');
const should = chai.should();
const sinon = require('sinon');

const GoLangVisitor = require('../../../../lib/codegen/fromcto/golang/golangvisitor.js');

const AssetDeclaration = require('../../../../lib/introspect/assetdeclaration');
const ClassDeclaration = require('../../../../lib/introspect/classdeclaration');
const EnumDeclaration = require('../../../../lib/introspect/enumdeclaration');
const ConceptDeclaration = require('../../../../lib/introspect/conceptdeclaration');
const EnumValueDeclaration = require('../../../../lib/introspect/enumvaluedeclaration');
const Field = require('../../../../lib/introspect/field');
const ModelFile = require('../../../../lib/introspect/modelfile');
const ModelManager = require('../../../../lib/modelmanager');
const BusinessNetworkDefinition = require('../../../../lib/businessnetworkdefinition');
const RelationshipDeclaration = require('../../../../lib/introspect/relationshipdeclaration');
const TransactionDeclaration = require('../../../../lib/introspect/transactiondeclaration');

const fileWriter = require('../../../../lib/codegen/filewriter.js');

describe('GoLangVisitor', function () {
    let goVisit;
    let mockFileWriter;
    beforeEach(() => {
        goVisit = new GoLangVisitor();
        mockFileWriter = sinon.createStubInstance(fileWriter);
    });

    describe('visit', () => {
        let param;
        beforeEach(() => {
            param = {
                property1: 'value1'
            };
        });
        it('should call visitBusinessNetwork for a BusinessNetworkDefintion', () => {
            let thing = sinon.createStubInstance(BusinessNetworkDefinition);
            let mockSpecialVisit = sinon.stub(goVisit, 'visitBusinessNetwork');
            mockSpecialVisit.returns('Duck');

            goVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call visitModelManager for a ModelManager', () => {
            let thing = sinon.createStubInstance(ModelManager);
            let mockSpecialVisit = sinon.stub(goVisit, 'visitModelManager');
            mockSpecialVisit.returns('Duck');

            goVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call visitModelFile for a ModelFile', () => {
            let thing = sinon.createStubInstance(ModelFile);
            let mockSpecialVisit = sinon.stub(goVisit, 'visitModelFile');
            mockSpecialVisit.returns('Duck');

            goVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call visitClassDeclaration for a AssetDeclaration', () => {
            let thing = sinon.createStubInstance(AssetDeclaration);
            let mockSpecialVisit = sinon.stub(goVisit, 'visitClassDeclaration');
            mockSpecialVisit.returns('Duck');

            goVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call nothing for a TransactionDeclaration', () => {
            let thing = sinon.createStubInstance(TransactionDeclaration);

            should.equal(goVisit.visit(thing, param), undefined);
        });

        it('should call visitEnumDeclaration for a EnumDeclaration', () => {
            let thing = sinon.createStubInstance(EnumDeclaration);
            let mockSpecialVisit = sinon.stub(goVisit, 'visitEnumDeclaration');
            mockSpecialVisit.returns('Duck');

            goVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call nothing for a ConceptDeclaration', () => {
            let thing = sinon.createStubInstance(ConceptDeclaration);

            should.equal(goVisit.visit(thing, param), undefined);
        });

        it('should call visitClassDeclaration for a ClassDeclaration', () => {
            let thing = sinon.createStubInstance(ClassDeclaration);
            let mockSpecialVisit = sinon.stub(goVisit, 'visitClassDeclaration');
            mockSpecialVisit.returns('Duck');

            goVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call visitField for a Field', () => {
            let thing = sinon.createStubInstance(Field);
            let mockSpecialVisit = sinon.stub(goVisit, 'visitField');
            mockSpecialVisit.returns('Duck');

            goVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call nothing for a RelationshipDeclaration', () => {
            let thing = sinon.createStubInstance(RelationshipDeclaration);

            should.equal(goVisit.visit(thing, param), undefined);
        });

        it('should call visitEnumValueDeclaration for a EnumValueDeclaration', () => {
            let thing = sinon.createStubInstance(EnumValueDeclaration);
            let mockSpecialVisit = sinon.stub(goVisit, 'visitEnumValueDeclaration');
            mockSpecialVisit.returns('Duck');

            goVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should throw an error when an unrecognised type is supplied', () => {
            let thing = 'Something of unrecognised type';

            (() => {
                goVisit.visit(thing, param);
            }).should.throw('Unrecognised type: string, value: \'Something of unrecognised type\'');
        });
    });

    describe('visitBusinessNetwork', () => {
        let param = {
            property1: 'value1'
        };

        it('should accept each model file', () => {
            let acceptSpy = sinon.spy();
            let mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            mockBusinessNetworkDefinition.getModelManager.returns({
                getModelFiles: () => {
                    return [{
                        accept: acceptSpy
                    },
                    {
                        accept: acceptSpy
                    }];
                }
            });

            goVisit.visitBusinessNetwork(mockBusinessNetworkDefinition, param);
            acceptSpy.withArgs(goVisit, param).calledTwice.should.be.ok;
        });
    });

    describe('visitModelManager', () => {

        it('should write to the main.go file and call accept for each model file', () => {
            let param = {
                fileWriter: mockFileWriter
            };

            let acceptSpy = sinon.spy();
            let mockModelManagerDefinition = sinon.createStubInstance(ModelManager);
            mockModelManagerDefinition.getModelFiles.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);

            goVisit.visitModelManager(mockModelManagerDefinition, param);
            param.fileWriter.openFile.withArgs('main.go').calledOnce.should.be.ok;
            param.fileWriter.writeLine.callCount.should.deep.equal(10);
            param.fileWriter.closeFile.calledOnce.should.be.ok;
            acceptSpy.withArgs(goVisit, param).calledTwice.should.be.ok;
        });
    });

    describe('visitModelFile', () => {
        let param;

        beforeEach(() => {
            param = {
                fileWriter: mockFileWriter
            };
        });

        it('should open the modelFile\'s namespace\'s .go file and write to it', () => {
            let acceptSpy = sinon.spy();
            let mockToGoPackageName = sinon.stub(goVisit, 'toGoPackageName');
            mockToGoPackageName.returns('space');

            let mockContainsDateTimeField = sinon.stub(goVisit, 'containsDateTimeField');
            mockContainsDateTimeField.returns(false);

            let mockModelFileDefinition = sinon.createStubInstance(ModelFile);
            mockModelFileDefinition.getNamespace.returns;
            mockModelFileDefinition.getAllDeclarations.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);

            goVisit.visitModelFile(mockModelFileDefinition, param);
            param.fileWriter.openFile.withArgs('space.go').calledOnce.should.be.ok;
            param.fileWriter.writeLine.withArgs(0, 'package main').calledOnce.should.be.ok;
            param.fileWriter.closeFile.calledOnce.should.be.ok;
            acceptSpy.withArgs(goVisit, param).calledTwice.should.be.ok;
        });

        it('should open the modelFile\'s namespace\'s .go file and write to it importing time when needed', () => {
            let acceptSpy = sinon.spy();
            let mockToGoPackageName = sinon.stub(goVisit, 'toGoPackageName');
            mockToGoPackageName.returns('space');

            let mockContainsDateTimeField = sinon.stub(goVisit, 'containsDateTimeField');
            mockContainsDateTimeField.returns(true);

            let mockModelFileDefinition = sinon.createStubInstance(ModelFile);
            mockModelFileDefinition.getNamespace.returns;
            mockModelFileDefinition.getAllDeclarations.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);

            goVisit.visitModelFile(mockModelFileDefinition, param);
            param.fileWriter.openFile.withArgs('space.go').calledOnce.should.be.ok;
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'package main']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, 'import \"time"']);
            param.fileWriter.closeFile.calledOnce.should.be.ok;
            acceptSpy.withArgs(goVisit, param).calledTwice.should.be.ok;
        });
    });

    describe('visitEnumDeclaration', () => {
        let param;

        beforeEach(() => {
            param = {
                fileWriter: mockFileWriter
            };
        });

        it('should write lines defining type and const and call accept for each property', () => {
            let acceptSpy = sinon.spy();
            let mockEnumDeclaration = sinon.createStubInstance(EnumDeclaration);
            mockEnumDeclaration.getName.returns('Bob');
            mockEnumDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);

            goVisit.visitEnumDeclaration(mockEnumDeclaration, param);

            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'type Bob int']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, 'const (']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, ')']);
            acceptSpy.withArgs(goVisit, param).calledTwice.should.be.ok;
        });
    });

    describe('visitClassDeclaration', () => {
        let param;

        beforeEach(() => {
            param = {
                fileWriter: mockFileWriter
            };
        });

        it('should write lines defining type call accept for each property', () => {
            let acceptSpy = sinon.spy();
            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockClassDeclaration.getName.returns('Bob');
            mockClassDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);

            goVisit.visitClassDeclaration(mockClassDeclaration, param);

            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'type Bob struct {']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, '}']);

            acceptSpy.withArgs(goVisit, param).calledTwice.should.be.ok;
        });

        it('should write lines defining type and call accept for each property embedding the super type as necessary', () => {
            let acceptSpy = sinon.spy();
            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockClassDeclaration.getName.returns('Bob');
            mockClassDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);
            mockClassDeclaration.getSuperType.returns('Person');

            goVisit.visitClassDeclaration(mockClassDeclaration, param);

            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'type Bob struct {']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([1, 'Person']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, '}']);
            acceptSpy.withArgs(goVisit, param).calledTwice.should.be.ok;
        });
    });

    describe('visitField', () => {
        let param;

        beforeEach(() => {
            param = {
                fileWriter: mockFileWriter
            };
        });

        it('should write a line defining a field', () => {
            let mockField = sinon.createStubInstance(Field);
            mockField.isArray.returns(false);
            mockField.getName.returns('bob');
            let mockGoType = sinon.stub(goVisit, 'toGoType');
            mockGoType.returns('string');

            goVisit.visitField(mockField, param);

            param.fileWriter.writeLine.withArgs(1, 'Bob string `json:"bob"`').calledOnce.should.be.ok;
        });

        it('should write a line defining a field and add [] if an array', () => {
            let mockField = sinon.createStubInstance(Field);
            mockField.isArray.returns(true);
            mockField.getName.returns('bob');
            let mockGoType = sinon.stub(goVisit, 'toGoType');
            mockGoType.returns('string');

            goVisit.visitField(mockField, param);

            param.fileWriter.writeLine.withArgs(1, 'Bob []string `json:"bob"`').calledOnce.should.be.ok;
        });
    });

    describe('visitEnumValueDeclaration', () => {
        let param;

        beforeEach(() => {
            param = {
                fileWriter: mockFileWriter
            };
        });

        it('should write a line using the enum value decleration', () => {
            let mockEnumValueDeclaration = sinon.createStubInstance(EnumValueDeclaration);
            mockEnumValueDeclaration.getParent.returns({
                getOwnProperties: () => {
                    return [{
                        getName: () => {
                            return 'Bob';
                        }
                    }];
                },
                getName: () => {
                    return 'Bob';
                }
            });
            mockEnumValueDeclaration.getName.returns('Trevor');

            goVisit.visitEnumValueDeclaration(mockEnumValueDeclaration, param);

            param.fileWriter.writeLine.withArgs(1, 'Trevor').calledOnce.should.be.ok;
        });

        it('should write a line using the enum value decleration adding iota when the first', () => {
            let mockEnumValueDeclaration = sinon.createStubInstance(EnumValueDeclaration);
            mockEnumValueDeclaration.getParent.returns({
                getOwnProperties: () => {
                    return [{
                        getName: () => {
                            return 'Bob';
                        }
                    }];
                },
                getName: () => {
                    return 'Bob';
                }
            });
            mockEnumValueDeclaration.getName.returns('Bob');

            goVisit.visitEnumValueDeclaration(mockEnumValueDeclaration, param);

            param.fileWriter.writeLine.withArgs(1, 'Bob Bob = 1 + iota').calledOnce.should.be.ok;
        });
    });

    describe('visitRelationship', () => {
        let param;

        beforeEach(() => {
            param = {
                fileWriter: mockFileWriter
            };
        });

        it('should write a line defining a relationship', () => {
            let mockRelationship = sinon.createStubInstance(RelationshipDeclaration);
            mockRelationship.isArray.returns(false);
            mockRelationship.getName.returns('bob');

            goVisit.visitRelationship(mockRelationship, param);

            param.fileWriter.writeLine.withArgs(1, 'Bob Relationship `json:"bob"`').calledOnce.should.be.ok;
        });

        it('should write a line defining a relationship and add [] if an array', () => {
            let mockRelationship = sinon.createStubInstance(RelationshipDeclaration);
            mockRelationship.isArray.returns(true);
            mockRelationship.getName.returns('bob');

            goVisit.visitRelationship(mockRelationship, param);

            param.fileWriter.writeLine.withArgs(1, 'Bob []Relationship `json:"bob"`').calledOnce.should.be.ok;
        });
    });

    describe('containsDateTimeField', () => {
        it('should return true if the model file contains a data and time field', () => {
            let mockModelFileDefinition = sinon.createStubInstance(ModelFile);
            mockModelFileDefinition.getAllDeclarations.returns([
                {
                    getProperties: () => {
                        return [{
                            getType: () => {
                                return 'DateTime';
                            }
                        }];
                    }
                }
            ]);

            goVisit.containsDateTimeField(mockModelFileDefinition).should.deep.equal(true);
        });

        it('should return true if the model file contains a data and time field', () => {
            let mockModelFileDefinition = sinon.createStubInstance(ModelFile);
            mockModelFileDefinition.getAllDeclarations.returns([
                {
                    getProperties: () => {
                        return [{
                            getType: () => {
                                return 'String';
                            }
                        }];
                    }
                }
            ]);

            goVisit.containsDateTimeField(mockModelFileDefinition).should.deep.equal(false);
        });
    });

    describe('toGoType', () => {
        it('should return time.Time for DateTime', () => {
            goVisit.toGoType('DateTime').should.deep.equal('time.Time');
        });

        it('should return bool for Boolean', () => {
            goVisit.toGoType('Boolean').should.deep.equal('bool');
        });

        it('should return string for String', () => {
            goVisit.toGoType('String').should.deep.equal('string');
        });

        it('should return float64 for Double', () => {
            goVisit.toGoType('Double').should.deep.equal('float64');
        });

        it('should return int for Long', () => {
            goVisit.toGoType('Long').should.deep.equal('int64');
        });

        it('should return int32 for Integer', () => {
            goVisit.toGoType('Integer').should.deep.equal('int32');
        });

        it('should return the param as default', () => {
            goVisit.toGoType('Penguin').should.deep.equal('Penguin');
        });
    });

    describe('toGoPackageName', () => {
        it('should replace first dot in the passed param with nothing', () => {
            goVisit.toGoPackageName('some.dotted.sequence').should.deep.equal('somedotted.sequence');
        });
    });
});