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

const JavaVisitor = require('../../../../lib/codegen/fromcto/java/javavisitor.js');

const ClassDeclaration = require('../../../../lib/introspect/classdeclaration');
const EnumDeclaration = require('../../../../lib/introspect/enumdeclaration');
const EnumValueDeclaration = require('../../../../lib/introspect/enumvaluedeclaration');
const Field = require('../../../../lib/introspect/field');
const ModelFile = require('../../../../lib/introspect/modelfile');
const ModelManager = require('../../../../lib/modelmanager');
const BusinessNetworkDefinition = require('../../../../lib/businessnetworkdefinition');
const RelationshipDeclaration = require('../../../../lib/introspect/relationshipdeclaration');
const FunctionDeclaration = require('../../../../lib/introspect/functiondeclaration');

const fileWriter = require('../../../../lib/codegen/filewriter.js');

describe('JavaVisitor', function () {
    let javaVisit;
    let mockFileWriter;
    beforeEach(() => {
        javaVisit = new JavaVisitor();
        mockFileWriter = sinon.createStubInstance(fileWriter);
    });

    describe('visit', () => {
        let param;
        beforeEach(() => {
            param = {
                property1: 'value1'
            };
        });

        it('should call visitBusinessNetworkDefinition for a BusinessNetworkDefintion', () => {
            let thing = sinon.createStubInstance(BusinessNetworkDefinition);
            let mockSpecialVisit = sinon.stub(javaVisit, 'visitBusinessNetworkDefinition');
            mockSpecialVisit.returns('Duck');

            javaVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call visitModelManager for a ModelManager', () => {
            let thing = sinon.createStubInstance(ModelManager);
            let mockSpecialVisit = sinon.stub(javaVisit, 'visitModelManager');
            mockSpecialVisit.returns('Duck');

            javaVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call visitModelFile for a ModelFile', () => {
            let thing = sinon.createStubInstance(ModelFile);
            let mockSpecialVisit = sinon.stub(javaVisit, 'visitModelFile');
            mockSpecialVisit.returns('Duck');

            javaVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call visitEnumDeclaration for a EnumDeclaration', () => {
            let thing = sinon.createStubInstance(EnumDeclaration);
            let mockSpecialVisit = sinon.stub(javaVisit, 'visitEnumDeclaration');
            mockSpecialVisit.returns('Duck');

            javaVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call visitClassDeclaration for a ClassDeclaration', () => {
            let thing = sinon.createStubInstance(ClassDeclaration);
            let mockSpecialVisit = sinon.stub(javaVisit, 'visitClassDeclaration');
            mockSpecialVisit.returns('Duck');

            javaVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call visitField for a Field', () => {
            let thing = sinon.createStubInstance(Field);
            let mockSpecialVisit = sinon.stub(javaVisit, 'visitField');
            mockSpecialVisit.returns('Duck');

            javaVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call visitRelationship for a RelationshipDeclaration', () => {
            let thing = sinon.createStubInstance(RelationshipDeclaration);
            let mockSpecialVisit = sinon.stub(javaVisit, 'visitRelationship');
            mockSpecialVisit.returns('Duck');

            javaVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call visitEnumValueDeclaration for a EnumValueDeclaration', () => {
            let thing = sinon.createStubInstance(EnumValueDeclaration);
            let mockSpecialVisit = sinon.stub(javaVisit, 'visitEnumValueDeclaration');
            mockSpecialVisit.returns('Duck');

            javaVisit.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should call nothing for a FunctionDeclaration', () => {
            let thing = sinon.createStubInstance(FunctionDeclaration);

            should.equal(javaVisit.visit(thing, param), undefined);
        });

        it('should throw an error when an unrecognised type is supplied', () => {
            let thing = 'Something of unrecognised type';

            (() => {
                javaVisit.visit(thing, param);
            }).should.throw('Unrecognised type: string, value: \'Something of unrecognised type\'');
        });
    });

    describe('visitBusinessNetworkDefinition', () => {
        let param = {
            property1: 'value1'
        };

        it('should accept ModelManager', () => {
            let acceptSpy = sinon.spy();
            let mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            mockBusinessNetworkDefinition.getModelManager.returns({
                accept: acceptSpy
            });

            javaVisit.visitBusinessNetworkDefinition(mockBusinessNetworkDefinition, param);
            acceptSpy.withArgs(javaVisit, param).calledOnce.should.be.ok;
        });
    });

    describe('visitModelManager', () => {
        it('should write to the org/hyperledger/composer/system/Resource.java file and call accept for each model file', () => {
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

            javaVisit.visitModelManager(mockModelManagerDefinition, param);
            param.fileWriter.openFile.withArgs('org/hyperledger/composer/system/Resource.java').calledOnce.should.be.ok;
            param.fileWriter.writeLine.callCount.should.deep.equal(4);
            param.fileWriter.closeFile.calledOnce.should.be.ok;
            acceptSpy.withArgs(javaVisit, param).calledTwice.should.be.ok;
        });
    });

    describe('visitModelFile', () => {
        it('should call accept for each declaration', () => {
            let param = {
                property1: 'value1'
            };

            let acceptSpy = sinon.spy();
            let mockModelFile = sinon.createStubInstance(ModelFile);
            mockModelFile.getAllDeclarations.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);

            javaVisit.visitModelFile(mockModelFile, param);

            acceptSpy.withArgs(javaVisit, param).calledTwice.should.be.ok;
        });
    });

    describe('startClassFile', () => {
        it('should write a java class file header', () => {
            let param = {
                fileWriter: mockFileWriter
            };

            let mockClass = sinon.createStubInstance(ClassDeclaration);
            mockClass.getModelFile.returns({
                getNamespace: () => {
                    return 'org.acme.people';
                },
                getName: () => {
                    return 'Bob';
                }
            });

            javaVisit.startClassFile(mockClass, param);

            param.fileWriter.openFile.withArgs('org/acme/people/bob.java');
            param.fileWriter.writeLine.callCount.should.deep.equal(4);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, '// this code is generated and should not be modified']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, 'package org.acme.people;']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, '']);
            param.fileWriter.writeLine.getCall(3).args.should.deep.equal([0, 'import org.hyperledger.composer.system.*;']);
        });
    });

    describe('endClassFile', () => {
        it('should close a java class file', () => {
            let param = {
                fileWriter: mockFileWriter
            };

            let mockClass = sinon.createStubInstance(ClassDeclaration);

            javaVisit.endClassFile(mockClass, param);

            param.fileWriter.closeFile.calledOnce.should.be.ok;
        });
    });

    describe('visitEnumDeclaration', () => {
        it('should write an enum declaration and call accept on each property', () => {
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

            let mockStartClassFile = sinon.stub(javaVisit, 'startClassFile');
            let mockEndClassFile = sinon.stub(javaVisit, 'endClassFile');

            javaVisit.visitEnumDeclaration(mockEnumDeclaration, param);

            mockStartClassFile.withArgs(mockEnumDeclaration, param).calledOnce.should.be.ok;
            param.fileWriter.writeLine.callCount.should.deep.equal(4);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'import com.fasterxml.jackson.annotation.JsonIgnoreProperties;']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, '@JsonIgnoreProperties({"$class"})']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, 'public enum Bob {']);
            param.fileWriter.writeLine.getCall(3).args.should.deep.equal([0, '}']);
            mockEndClassFile.withArgs(mockEnumDeclaration, param).calledOnce.should.be.ok;
        });
    });

    describe('visitClassDeclaration', () => {
        let acceptSpy;
        let param;
        let mockClassDeclaration;
        let mockStartClassFile;
        let mockEndClassFile;
        beforeEach(() => {
            acceptSpy = sinon.spy();

            param = {
                fileWriter: mockFileWriter
            };

            mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockClassDeclaration.getName.returns('Bob');
            mockClassDeclaration.getModelFile.returns({
                getImports: () => {
                    return ['oranges', 'apples'];
                }
            });
            mockClassDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);
            mockClassDeclaration.isConcept.returns(false);
            mockClassDeclaration.isAbstract.returns(false);
            mockClassDeclaration.isSystemCoreType.returns(false);
            mockClassDeclaration.getSuperType.returns(false);
            mockClassDeclaration.getIdentifierFieldName.returns(false);

            mockStartClassFile = sinon.stub(javaVisit, 'startClassFile');
            mockEndClassFile = sinon.stub(javaVisit, 'endClassFile');
        });

        it('should write a class declaration and call accept on each property', () => {
            javaVisit.visitClassDeclaration(mockClassDeclaration, param);

            mockStartClassFile.withArgs(mockClassDeclaration, param).calledOnce.should.be.ok;
            param.fileWriter.writeLine.callCount.should.deep.equal(4);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'import oranges;']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, 'import apples;']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, 'public class Bob {']);
            param.fileWriter.writeLine.getCall(3).args.should.deep.equal([0, '}']);
            acceptSpy.withArgs(javaVisit, param).calledTwice.should.be.ok;
            mockEndClassFile.withArgs(mockClassDeclaration, param).calledOnce.should.be.ok;
        });

        it('should write a concept class declaration and call accept on each property', () => {
            mockClassDeclaration.isConcept.returns(true);

            javaVisit.visitClassDeclaration(mockClassDeclaration, param);

            mockStartClassFile.withArgs(mockClassDeclaration, param).calledOnce.should.be.ok;
            param.fileWriter.writeLine.callCount.should.deep.equal(7);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'import oranges;']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, 'import apples;']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, 'import com.fasterxml.jackson.annotation.JsonIgnoreProperties;']);
            param.fileWriter.writeLine.getCall(3).args.should.deep.equal([0, '']);
            param.fileWriter.writeLine.getCall(4).args.should.deep.equal([0, '@JsonIgnoreProperties({"$class"})']);
            param.fileWriter.writeLine.getCall(5).args.should.deep.equal([0, 'public class Bob {']);
            param.fileWriter.writeLine.getCall(6).args.should.deep.equal([0, '}']);
            acceptSpy.withArgs(javaVisit, param).calledTwice.should.be.ok;
            mockEndClassFile.withArgs(mockClassDeclaration, param).calledOnce.should.be.ok;
        });

        it('should write an abstract class declaration and call accept on each property', () => {
            mockClassDeclaration.isAbstract.returns(true);

            javaVisit.visitClassDeclaration(mockClassDeclaration, param);

            mockStartClassFile.withArgs(mockClassDeclaration, param).calledOnce.should.be.ok;
            param.fileWriter.writeLine.callCount.should.deep.equal(4);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'import oranges;']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, 'import apples;']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, 'public abstract class Bob {']);
            param.fileWriter.writeLine.getCall(3).args.should.deep.equal([0, '}']);
            acceptSpy.withArgs(javaVisit, param).calledTwice.should.be.ok;
            mockEndClassFile.withArgs(mockClassDeclaration, param).calledOnce.should.be.ok;
        });

        it('should write a system core type class declaration and call accept on each property', () => {
            mockClassDeclaration.isSystemCoreType.returns(true);

            javaVisit.visitClassDeclaration(mockClassDeclaration, param);

            mockStartClassFile.withArgs(mockClassDeclaration, param).calledOnce.should.be.ok;
            param.fileWriter.writeLine.callCount.should.deep.equal(4);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'import oranges;']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, 'import apples;']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, 'public class Bob extends org.hyperledger.composer.system.Resource {']);
            param.fileWriter.writeLine.getCall(3).args.should.deep.equal([0, '}']);
            acceptSpy.withArgs(javaVisit, param).calledTwice.should.be.ok;
            mockEndClassFile.withArgs(mockClassDeclaration, param).calledOnce.should.be.ok;
        });

        it('should write a super type class declaration and call accept on each property', () => {
            mockClassDeclaration.getSuperType.returns('org.acme.person');

            javaVisit.visitClassDeclaration(mockClassDeclaration, param);

            mockStartClassFile.withArgs(mockClassDeclaration, param).calledOnce.should.be.ok;
            param.fileWriter.writeLine.callCount.should.deep.equal(4);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'import oranges;']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, 'import apples;']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, 'public class Bob extends person {']);
            param.fileWriter.writeLine.getCall(3).args.should.deep.equal([0, '}']);
            acceptSpy.withArgs(javaVisit, param).calledTwice.should.be.ok;
            mockEndClassFile.withArgs(mockClassDeclaration, param).calledOnce.should.be.ok;
        });

        it('should write a class declaration, including a function to access the id field and call accept on each property', () => {
            mockClassDeclaration.getIdentifierFieldName.returns('employeeID');
            javaVisit.visitClassDeclaration(mockClassDeclaration, param);

            mockStartClassFile.withArgs(mockClassDeclaration, param).calledOnce.should.be.ok;
            param.fileWriter.writeLine.callCount.should.deep.equal(5);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'import oranges;']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, 'import apples;']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, 'public class Bob {']);
            param.fileWriter.writeLine.getCall(3).args.should.deep.equal([1, `
   // the accessor for the identifying field
   public String getID() {
      return employeeID;
   }
`]);
            param.fileWriter.writeLine.getCall(4).args.should.deep.equal([0, '}']);
            acceptSpy.withArgs(javaVisit, param).calledTwice.should.be.ok;
            mockEndClassFile.withArgs(mockClassDeclaration, param).calledOnce.should.be.ok;
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
            mockField.getName.returns('Bob');
            mockField.getType.returns('SpecialType');
            let mockJavaType = sinon.stub(javaVisit, 'toJavaType');
            mockJavaType.returns('JavaType');

            javaVisit.visitField(mockField, param);
            param.fileWriter.writeLine.withArgs(1, 'public JavaType Bob;').calledOnce.should.be.ok;
        });

        it('should write a line defining a field and add [] if an array', () => {
            let mockField = sinon.createStubInstance(Field);
            mockField.isArray.returns(true);
            mockField.getName.returns('Bob');
            mockField.getType.returns('SpecialType');
            let mockJavaType = sinon.stub(javaVisit, 'toJavaType');
            mockJavaType.returns('JavaType');

            javaVisit.visitField(mockField, param);
            param.fileWriter.writeLine.withArgs(1, 'public JavaType[] Bob;').calledOnce.should.be.ok;
        });
    });

    describe('visitEnumValueDeclaration', () => {
        it('should write a line with the enum value', () => {
            let param = {
                fileWriter: mockFileWriter
            };

            let mockEnumValueDeclaration = sinon.createStubInstance(EnumValueDeclaration);
            mockEnumValueDeclaration.getName.returns('Bob');

            javaVisit.visitEnumValueDeclaration(mockEnumValueDeclaration, param);
            param.fileWriter.writeLine.withArgs(1, 'Bob,').calledOnce.should.be.ok;
        });
    });

    describe('visitRelationship', () => {
        let param;

        beforeEach(() => {
            param = {
                fileWriter: mockFileWriter
            };
        });

        it('should write a line defining a field', () => {
            let mockRelationship = sinon.createStubInstance(RelationshipDeclaration);
            mockRelationship.isArray.returns(false);
            mockRelationship.getName.returns('Bob');
            mockRelationship.getType.returns('SpecialType');
            let mockJavaType = sinon.stub(javaVisit, 'toJavaType');
            mockJavaType.returns('JavaType');

            javaVisit.visitRelationship(mockRelationship, param);
            param.fileWriter.writeLine.withArgs(1, 'public JavaType Bob;').calledOnce.should.be.ok;
        });

        it('should write a line defining a field and add [] if an array', () => {
            let mockRelationship = sinon.createStubInstance(RelationshipDeclaration);
            mockRelationship.isArray.returns(true);
            mockRelationship.getName.returns('Bob');
            mockRelationship.getType.returns('SpecialType');
            let mockJavaType = sinon.stub(javaVisit, 'toJavaType');
            mockJavaType.returns('JavaType');

            javaVisit.visitRelationship(mockRelationship, param);
            param.fileWriter.writeLine.withArgs(1, 'public JavaType[] Bob;').calledOnce.should.be.ok;
        });
    });

    describe('toJavaType', () => {
        it('should return java.util.Date for DateTime', () => {
            javaVisit.toJavaType('DateTime').should.deep.equal('java.util.Date');
        });

        it('should return boolean for Boolean', () => {
            javaVisit.toJavaType('Boolean').should.deep.equal('boolean');
        });

        it('should return String for String', () => {
            javaVisit.toJavaType('String').should.deep.equal('String');
        });

        it('should return double for Double', () => {
            javaVisit.toJavaType('Double').should.deep.equal('double');
        });

        it('should return long for Long', () => {
            javaVisit.toJavaType('Long').should.deep.equal('long');
        });

        it('should return int for Integer', () => {
            javaVisit.toJavaType('Integer').should.deep.equal('int');
        });

        it('should return the param as default', () => {
            javaVisit.toJavaType('Penguin').should.deep.equal('Penguin');
        });
    });
});