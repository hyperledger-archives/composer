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
chai.should();
const sinon = require('sinon');

const TypescriptVisitor = require('../../../../lib/codegen/fromcto/typescript/typescriptvisitor.js');

const BusinessNetworkDefinition = require('../../../../lib/businessnetworkdefinition');
const ModelManager = require('../../../../lib/modelmanager');
const ModelFile = require('../../../../lib/introspect/modelfile');
const ClassDeclaration = require('../../../../lib/introspect/classdeclaration');
const Field = require('../../../../lib/introspect/field');
const RelationshipDeclaration = require('../../../../lib/introspect/relationshipdeclaration');
const EnumDeclaration = require('../../../../lib/introspect/enumdeclaration');
const EnumValueDeclaration = require('../../../../lib/introspect/enumvaluedeclaration');

const fileWriter = require('../../../../lib/codegen/filewriter.js');

describe('TypescriptVisitor', function () {
    let typescriptVisitor;
    let mockFileWriter;
    beforeEach(() => {
        typescriptVisitor = new TypescriptVisitor();
        mockFileWriter = sinon.createStubInstance(fileWriter);
    });

    describe('visit', () => {
        let param;
        beforeEach(() => {
            param = {
                property1: 'value1'
            };
        });
        it('should return visitBusinessNetworkDefinition for a BusinessNetworkDefintion', () => {
            let thing = sinon.createStubInstance(BusinessNetworkDefinition);
            let mockSpecialVisit = sinon.stub(typescriptVisitor, 'visitBusinessNetworkDefinition');
            mockSpecialVisit.returns('Duck');

            typescriptVisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitModelManager for a ModelManager', () => {
            let thing = sinon.createStubInstance(ModelManager);
            let mockSpecialVisit = sinon.stub(typescriptVisitor, 'visitModelManager');
            mockSpecialVisit.returns('Duck');

            typescriptVisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitModelFile for a ModelFile', () => {
            let thing = sinon.createStubInstance(ModelFile);
            let mockSpecialVisit = sinon.stub(typescriptVisitor, 'visitModelFile');
            mockSpecialVisit.returns('Duck');

            typescriptVisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitEnumDeclaration for a EnumDeclaration', () => {
            let thing = sinon.createStubInstance(EnumDeclaration);
            let mockSpecialVisit = sinon.stub(typescriptVisitor, 'visitEnumDeclaration');
            mockSpecialVisit.returns('Duck');

            typescriptVisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitClassDeclaration for a ClassDeclaration', () => {
            let thing = sinon.createStubInstance(ClassDeclaration);
            let mockSpecialVisit = sinon.stub(typescriptVisitor, 'visitClassDeclaration');
            mockSpecialVisit.returns('Duck');

            typescriptVisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitField for a Field', () => {
            let thing = sinon.createStubInstance(Field);
            let mockSpecialVisit = sinon.stub(typescriptVisitor, 'visitField');
            mockSpecialVisit.returns('Duck');

            typescriptVisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitRelationship for a RelationshipDeclaration', () => {
            let thing = sinon.createStubInstance(RelationshipDeclaration);
            let mockSpecialVisit = sinon.stub(typescriptVisitor, 'visitRelationship');
            mockSpecialVisit.returns('Duck');

            typescriptVisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitEnumValueDeclaration for a EnumValueDeclaration', () => {
            let thing = sinon.createStubInstance(EnumValueDeclaration);
            let mockSpecialVisit = sinon.stub(typescriptVisitor, 'visitEnumValueDeclaration');
            mockSpecialVisit.returns('Goose');

            typescriptVisitor.visit(thing, param).should.deep.equal('Goose');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should throw an error when an unrecognised type is supplied', () => {
            let thing = 'Something of unrecognised type';

            (() => {
                typescriptVisitor.visit(thing, param);
            }).should.throw('Unrecognised type: string, value: \'Something of unrecognised type\'');
        });
    });

    describe('visitBusinessNetworkDefinition', () => {
        it('should call accept on the model manager', () => {
            let acceptSpy = sinon.spy();

            let param = {};

            let mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            mockBusinessNetworkDefinition.getModelManager.returns({
                accept: acceptSpy
            });

            typescriptVisitor.visitBusinessNetworkDefinition(mockBusinessNetworkDefinition, param);

            acceptSpy.withArgs(typescriptVisitor, param).calledOnce.should.be.ok;
        });
    });

    describe('visitModelManager', () => {
        it('should call accept for each model file', () => {
            let acceptSpy = sinon.spy();

            let param = {};

            let mockModelManager = sinon.createStubInstance(ModelManager);
            mockModelManager.getModelFiles.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }
            ]);

            typescriptVisitor.visitModelManager(mockModelManager, param);

            acceptSpy.withArgs(typescriptVisitor, param).calledTwice.should.be.ok;
        });
    });

    describe('visitModelFile', () => {
        let param;
        beforeEach(() => {
            param = {
                fileWriter: mockFileWriter
            };
        });
        it('should write lines for the imports that are not in own namespace ignoring primitives', () => {
            let acceptSpy = sinon.spy();
            let mockEnum = sinon.createStubInstance(EnumDeclaration);
            mockEnum.isEnum.returns(true);
            mockEnum.accept = acceptSpy;

            let property1 = {
                isPrimitive: () => {
                    return false;
                },
                getFullyQualifiedTypeName: () => {
                    return 'org.org1.Property1';
                }
            };

            let property2 = {
                isPrimitive: () => {
                    return false;
                },
                getFullyQualifiedTypeName: () => {
                    return 'org.acme.Property2';
                }
            };

            let property3 = {
                isPrimitive: () => {
                    return true;
                },
                getFullyQualifiedTypeName: () => {
                    return 'org.org2.Property3';
                }
            };

            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockClassDeclaration.getProperties.returns([property1, property2, property3]);
            mockClassDeclaration.accept = acceptSpy;

            let mockModelFile = sinon.createStubInstance(ModelFile);
            mockModelFile.isSystemModelFile.returns(true);
            mockModelFile.getNamespace.returns('org.acme.Person');
            mockModelFile.getAllDeclarations.returns([
                mockEnum,
                mockClassDeclaration
            ]);
            mockModelFile.getImports.returns([
                'org.org1.Import1',
                'org.org1.Import2',
                'org.org2.Import1'
            ]);

            typescriptVisitor.visitModelFile(mockModelFile, param);

            param.fileWriter.openFile.withArgs('org.acme.Person.ts').calledOnce.should.be.ok;
            param.fileWriter.writeLine.callCount.should.deep.equal(3);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'import {Property1} from \'./org.org1\';']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, '// export namespace org.acme.Person{']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, '// }']);
            param.fileWriter.closeFile.should.be.called;

            acceptSpy.withArgs(typescriptVisitor, param).calledTwice.should.be.ok;
        });

        it('should write lines for the imports that are not in own namespace ignoring primitives and write lines for importing system type', () => {
            let acceptSpy = sinon.spy();
            let mockEnum = sinon.createStubInstance(EnumDeclaration);
            mockEnum.isEnum.returns(true);
            mockEnum.accept = acceptSpy;

            let property1 = {
                isPrimitive: () => {
                    return false;
                },
                getFullyQualifiedTypeName: () => {
                    return 'org.org1.Property1';
                }
            };

            let property2 = {
                isPrimitive: () => {
                    return false;
                },
                getFullyQualifiedTypeName: () => {
                    return 'org.acme.Property2';
                }
            };

            let property3 = {
                isPrimitive: () => {
                    return true;
                },
                getFullyQualifiedTypeName: () => {
                    return 'org.org2.Property3';
                }
            };

            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockClassDeclaration.getProperties.returns([property1, property2, property3]);
            mockClassDeclaration.accept = acceptSpy;

            let mockModelManager = sinon.createStubInstance(ModelManager);
            mockModelManager.getSystemTypes.returns([{
                getName: () => {
                    return 'Bob';
                }
            },
            {
                getName: () => {
                    return 'Fred';
                }
            }]);

            let mockModelFile = sinon.createStubInstance(ModelFile);
            mockModelFile.isSystemModelFile.returns(false);
            mockModelFile.getNamespace.returns('org.acme.Person');
            mockModelFile.getAllDeclarations.returns([
                mockEnum,
                mockClassDeclaration
            ]);
            mockModelFile.getImports.returns([
                'org.org1.Import1',
                'org.org1.Import2',
                'org.org2.Import1'
            ]);
            mockModelFile.getModelManager.returns(mockModelManager);

            typescriptVisitor.visitModelFile(mockModelFile, param);

            param.fileWriter.openFile.withArgs('org.acme.Person.ts').calledOnce.should.be.ok;
            param.fileWriter.writeLine.callCount.should.deep.equal(5);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'import {Bob} from \'./org.hyperledger.composer.system\';']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, 'import {Fred} from \'./org.hyperledger.composer.system\';']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, 'import {Property1} from \'./org.org1\';']);
            param.fileWriter.writeLine.getCall(3).args.should.deep.equal([0, '// export namespace org.acme.Person{']);
            param.fileWriter.writeLine.getCall(4).args.should.deep.equal([0, '// }']);
            param.fileWriter.closeFile.should.be.called;

            acceptSpy.withArgs(typescriptVisitor, param).calledTwice.should.be.ok;
        });
    });

    describe('visitEnumDeclaration', () => {
        it('should write the export enum and call accept on each property', () => {
            let acceptSpy = sinon.spy();

            let param = {
                fileWriter: mockFileWriter
            };

            let mockEnumDeclaration = sinon.createStubInstance(EnumDeclaration);
            mockEnumDeclaration.getName.returns('Bob');
            mockEnumDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);

            typescriptVisitor.visitEnumDeclaration(mockEnumDeclaration, param);

            param.fileWriter.writeLine.callCount.should.deep.equal(2);
            param.fileWriter.writeLine.withArgs(1, 'export enum Bob {').calledOnce.should.be.ok;
            param.fileWriter.writeLine.withArgs(1, '}').calledOnce.should.be.ok;

            acceptSpy.withArgs(typescriptVisitor, param).calledTwice.should.be.ok;
        });
    });

    describe('visitClassDeclaration', () => {
        let param;
        beforeEach(() => {
            param = {
                fileWriter: mockFileWriter
            };
        });
        it('should write the class opening and close', () => {
            let acceptSpy = sinon.spy();

            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockClassDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);
            mockClassDeclaration.getName.returns('Bob');

            typescriptVisitor.visitClassDeclaration(mockClassDeclaration, param);

            param.fileWriter.writeLine.callCount.should.deep.equal(2);
            param.fileWriter.writeLine.withArgs(1, 'export class Bob {').calledOnce.should.be.ok;
            param.fileWriter.writeLine.withArgs(1, '}').calledOnce.should.be.ok;
            acceptSpy.withArgs(typescriptVisitor, param).calledTwice.should.be.ok;
        });
        it('should write the class opening and close with abstract and super type', () => {
            let acceptSpy = sinon.spy();

            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockClassDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);
            mockClassDeclaration.getName.returns('Bob');
            mockClassDeclaration.isAbstract.returns(true);
            mockClassDeclaration.getSuperType.returns('org.acme.Person');

            typescriptVisitor.visitClassDeclaration(mockClassDeclaration, param);

            param.fileWriter.writeLine.callCount.should.deep.equal(2);
            param.fileWriter.writeLine.withArgs(1, 'export abstract class Bob extends Person {').calledOnce.should.be.ok;
            param.fileWriter.writeLine.withArgs(1, '}').calledOnce.should.be.ok;
            acceptSpy.withArgs(typescriptVisitor, param).calledTwice.should.be.ok;
        });
    });

    describe('visitField', () => {
        let param;
        beforeEach(() => {
            param = {
                fileWriter: mockFileWriter
            };
        });
        it('should write a line for field name and type', () => {
            let mockField = sinon.createStubInstance(Field);
            mockField.getName.returns('Bob');
            mockField.getType.returns('Person');

            let mockToType = sinon.stub(typescriptVisitor, 'toTsType');
            mockToType.withArgs('Person').returns('Human');

            typescriptVisitor.visitField(mockField, param);

            param.fileWriter.writeLine.withArgs(2, 'Bob: Human;').calledOnce.should.be.ok;
        });

        it('should write a line for field name and type thats an array', () => {
            let mockField = sinon.createStubInstance(Field);
            mockField.getName.returns('Bob');
            mockField.getType.returns('Person');
            mockField.isArray.returns(true);

            let mockToType = sinon.stub(typescriptVisitor, 'toTsType');
            mockToType.withArgs('Person').returns('Human');

            typescriptVisitor.visitField(mockField, param);

            param.fileWriter.writeLine.withArgs(2, 'Bob: Human[];').calledOnce.should.be.ok;
        });
    });

    describe('visitEnumValueDeclaration', () => {
        it('should write a line with the name of the enum value', () => {
            let param = {
                fileWriter: mockFileWriter
            };

            let mockEnumValueDeclaration = sinon.createStubInstance(EnumValueDeclaration);
            mockEnumValueDeclaration.getName.returns('Bob');

            typescriptVisitor.visitEnumValueDeclaration(mockEnumValueDeclaration, param);

            param.fileWriter.writeLine.withArgs(2, 'Bob,').calledOnce.should.be.ok;
        });
    });

    describe('visitRelationship', () => {
        let param;
        beforeEach(() => {
            param = {
                fileWriter: mockFileWriter
            };
        });
        it('should write a line for field name and type', () => {
            let mockRelationship = sinon.createStubInstance(RelationshipDeclaration);
            mockRelationship.getName.returns('Bob');
            mockRelationship.getType.returns('Person');

            let mockToType = sinon.stub(typescriptVisitor, 'toTsType');
            mockToType.withArgs('Person').returns('Human');

            typescriptVisitor.visitRelationship(mockRelationship, param);

            param.fileWriter.writeLine.withArgs(2, 'Bob: Human;').calledOnce.should.be.ok;
        });

        it('should write a line for field name and type thats an array', () => {
            let mockRelationship = sinon.createStubInstance(Field);
            mockRelationship.getName.returns('Bob');
            mockRelationship.getType.returns('Person');
            mockRelationship.isArray.returns(true);

            let mockToType = sinon.stub(typescriptVisitor, 'toTsType');
            mockToType.withArgs('Person').returns('Human');

            typescriptVisitor.visitRelationship(mockRelationship, param);

            param.fileWriter.writeLine.withArgs(2, 'Bob: Human[];').calledOnce.should.be.ok;
        });
    });

    describe('toTsType', () => {
        it('should return Date for DateTime', () => {
            typescriptVisitor.toTsType('DateTime').should.deep.equal('Date');
        });
        it('should return boolean for Boolean', () => {
            typescriptVisitor.toTsType('Boolean').should.deep.equal('boolean');
        });
        it('should return string for String', () => {
            typescriptVisitor.toTsType('String').should.deep.equal('string');
        });
        it('should return number for Double', () => {
            typescriptVisitor.toTsType('Double').should.deep.equal('number');
        });
        it('should return number for Long', () => {
            typescriptVisitor.toTsType('Long').should.deep.equal('number');
        });
        it('should return number for Integer', () => {
            typescriptVisitor.toTsType('Integer').should.deep.equal('number');
        });
        it('should return passed in type by default', () => {
            typescriptVisitor.toTsType('Penguin').should.deep.equal('Penguin');
        });
    });
});

