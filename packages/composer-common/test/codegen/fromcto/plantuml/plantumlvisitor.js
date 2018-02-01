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

const PlantUMLVisitor = require('../../../../lib/codegen/fromcto/plantuml/plantumlvisitor.js');

const BusinessNetworkDefinition = require('../../../../lib/businessnetworkdefinition');
const ScriptManager = require('../../../../lib/scriptmanager');
const ClassDeclaration = require('../../../../lib/introspect/classdeclaration');
const Script = require('../../../../lib/introspect/script');
const TransactionDeclaration = require('../../../../lib/introspect/transactiondeclaration');
const AssetDeclaration = require('../../../../lib/introspect/assetdeclaration');
const ParticipantDeclaration = require('../../../../lib/introspect/participantdeclaration');
const EnumDeclaration = require('../../../../lib/introspect/enumdeclaration');

const Field = require('../../../../lib/introspect/field');
const RelationshipDeclaration = require('../../../../lib/introspect/relationshipdeclaration');
const EnumValueDeclaration = require('../../../../lib/introspect/enumvaluedeclaration');
const FunctionDeclaration = require('../../../../lib/introspect/functiondeclaration');

const fileWriter = require('../../../../lib/codegen/filewriter.js');

describe('PlantUMLVisitor', function () {
    let plantUMLvisitor;
    let mockFileWriter;
    beforeEach(() => {
        plantUMLvisitor = new PlantUMLVisitor();
        mockFileWriter = sinon.createStubInstance(fileWriter);
    });

    describe('visit', () => {
        let param;
        beforeEach(() => {
            param = {
                property1: 'value1'
            };
        });
        it('should return visitBusinessNetwork for a BusinessNetworkDefintion', () => {
            let thing = sinon.createStubInstance(BusinessNetworkDefinition);
            let mockSpecialVisit = sinon.stub(plantUMLvisitor, 'visitBusinessNetwork');
            mockSpecialVisit.returns('Duck');

            plantUMLvisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitScriptManager for a ScriptManager', () => {
            let thing = sinon.createStubInstance(ScriptManager);
            let mockSpecialVisit = sinon.stub(plantUMLvisitor, 'visitScriptManager');
            mockSpecialVisit.returns('Duck');

            plantUMLvisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitScript for a Script', () => {
            let thing = sinon.createStubInstance(Script);
            let mockSpecialVisit = sinon.stub(plantUMLvisitor, 'visitScript');
            mockSpecialVisit.returns('Duck');

            plantUMLvisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitParticipantDeclaration for a ParticipantDeclaration', () => {
            let thing = sinon.createStubInstance(ParticipantDeclaration);
            let mockSpecialVisit = sinon.stub(plantUMLvisitor, 'visitParticipantDeclaration');
            mockSpecialVisit.returns('Duck');

            plantUMLvisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitTransactionDeclaration for a TransactionDeclaration', () => {
            let thing = sinon.createStubInstance(TransactionDeclaration);
            let mockSpecialVisit = sinon.stub(plantUMLvisitor, 'visitTransactionDeclaration');
            mockSpecialVisit.returns('Duck');

            plantUMLvisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitAssetDeclaration for a AssetDeclaration', () => {
            let thing = sinon.createStubInstance(AssetDeclaration);
            let mockSpecialVisit = sinon.stub(plantUMLvisitor, 'visitAssetDeclaration');
            mockSpecialVisit.returns('Duck');

            plantUMLvisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitEnumDeclaration for a EnumDeclaration', () => {
            let thing = sinon.createStubInstance(EnumDeclaration);
            let mockSpecialVisit = sinon.stub(plantUMLvisitor, 'visitEnumDeclaration');
            mockSpecialVisit.returns('Duck');

            plantUMLvisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitClassDeclaration for a ClassDeclaration', () => {
            let thing = sinon.createStubInstance(ClassDeclaration);
            let mockSpecialVisit = sinon.stub(plantUMLvisitor, 'visitClassDeclaration');
            mockSpecialVisit.returns('Duck');

            plantUMLvisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitField for a Field', () => {
            let thing = sinon.createStubInstance(Field);
            let mockSpecialVisit = sinon.stub(plantUMLvisitor, 'visitField');
            mockSpecialVisit.returns('Duck');

            plantUMLvisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitRelationship for a RelationshipDeclaration', () => {
            let thing = sinon.createStubInstance(RelationshipDeclaration);
            let mockSpecialVisit = sinon.stub(plantUMLvisitor, 'visitRelationship');
            mockSpecialVisit.returns('Duck');

            plantUMLvisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitEnumValueDeclaration for a EnumValueDeclaration', () => {
            let thing = sinon.createStubInstance(EnumValueDeclaration);
            let mockSpecialVisit = sinon.stub(plantUMLvisitor, 'visitEnumValueDeclaration');
            mockSpecialVisit.returns('Duck');

            plantUMLvisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should return visitFunctionDeclaration for a FunctionDeclaration', () => {
            let thing = sinon.createStubInstance(FunctionDeclaration);
            let mockSpecialVisit = sinon.stub(plantUMLvisitor, 'visitFunctionDeclaration');
            mockSpecialVisit.returns('Duck');

            plantUMLvisitor.visit(thing, param).should.deep.equal('Duck');

            mockSpecialVisit.calledWith(thing, param).should.be.ok;
        });

        it('should throw an error when an unrecognised type is supplied', () => {
            let thing = 'Something of unrecognised type';

            (() => {
                plantUMLvisitor.visit(thing, param);
            }).should.throw('Unrecognised "Something of unrecognised type"');
        });
    });

    describe('visitBusinessNetwork', () => {
        it('should write the business network data to a uml file', () => {
            let param = {
                fileWriter: mockFileWriter
            };

            let acceptSpy = sinon.spy();

            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            mockBusinessNetwork.getDescription.returns('Business network description text');
            mockBusinessNetwork.getIntrospector.returns({
                getClassDeclarations: () => {
                    return [{
                        accept: acceptSpy
                    },
                    {
                        accept: acceptSpy
                    }];
                }
            });
            mockBusinessNetwork.getIdentifier.returns('Penguin');
            mockBusinessNetwork.getScriptManager.returns({
                accept: acceptSpy
            });

            plantUMLvisitor.visitBusinessNetwork(mockBusinessNetwork, param);

            param.fileWriter.openFile.withArgs('model.uml').calledOnce.should.be.ok;
            param.fileWriter.writeLine.callCount.should.deep.equal(7);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, '@startuml']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, 'title']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, 'Business network description text']);
            param.fileWriter.writeLine.getCall(3).args.should.deep.equal([0, 'endtitle']);
            param.fileWriter.writeLine.getCall(4).args.should.deep.equal([0, 'class Penguin << (N,brown) >> {']);
            param.fileWriter.writeLine.getCall(5).args.should.deep.equal([0, '}']);
            param.fileWriter.writeLine.getCall(6).args.should.deep.equal([0, '@enduml']);
            param.fileWriter.closeFile.calledOnce.should.be.ok;

            acceptSpy.withArgs(plantUMLvisitor, param).calledThrice.should.be.ok;
        });
    });

    describe('visitScriptManager', () => {
        it('should call accept for each function declaration', () => {
            let acceptSpy = sinon.spy();

            let param = {};

            let mockScript = sinon.createStubInstance(ScriptManager);
            mockScript.getScripts.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);

            plantUMLvisitor.visitScriptManager(mockScript, param);

            acceptSpy.withArgs(plantUMLvisitor, param).calledTwice.should.be.ok;
        });
    });

    describe('visitScript', () => {
        it('should call accept for each function declaration', () => {
            let acceptSpy = sinon.spy();

            let param = {};

            let mockScript = sinon.createStubInstance(Script);
            mockScript.getFunctionDeclarations.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);

            plantUMLvisitor.visitScript(mockScript, param);

            acceptSpy.withArgs(plantUMLvisitor, param).calledTwice.should.be.ok;
        });
    });

    describe('visitFunctionDeclaration', () => {
        it('should write a line for the function declaration', () => {
            let param = {
                fileWriter: mockFileWriter
            };

            let mockFunctionDeclaration = sinon.createStubInstance(FunctionDeclaration);
            mockFunctionDeclaration.getVisibility.returns('public');
            mockFunctionDeclaration.getReturnType.returns('string');
            mockFunctionDeclaration.getName.returns('Bob');
            mockFunctionDeclaration.getParameterTypes.returns('boolean');

            plantUMLvisitor.visitFunctionDeclaration(mockFunctionDeclaration, param);
            param.fileWriter.writeLine.withArgs(1, 'public string Bob(boolean)').calledOnce.should.be.ok;
        });
    });

    describe('visitAssetDeclaration', () => {
        it('should write the class declaration for an asset', () => {
            let acceptSpy = sinon.spy();

            let param = {
                fileWriter: mockFileWriter
            };

            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockAssetDeclaration.getFullyQualifiedName.returns('org.acme.Person');
            mockAssetDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);

            plantUMLvisitor.visitAssetDeclaration(mockAssetDeclaration, param);

            param.fileWriter.writeLine.callCount.should.deep.equal(2);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'class org.acme.Person << (A,green) >> {']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, '}']);

            acceptSpy.withArgs(plantUMLvisitor, param).calledTwice.should.be.ok;
        });

        it('should write the class declaration for an asset with a super type', () => {
            let acceptSpy = sinon.spy();

            let param = {
                fileWriter: mockFileWriter
            };

            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockAssetDeclaration.getFullyQualifiedName.returns('org.acme.Person');
            mockAssetDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);
            mockAssetDeclaration.getSuperType.returns('org.acme.Human');

            plantUMLvisitor.visitAssetDeclaration(mockAssetDeclaration, param);

            param.fileWriter.writeLine.callCount.should.deep.equal(3);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'class org.acme.Person << (A,green) >> {']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, '}']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, 'org.acme.Person --|> org.acme.Human']);

            acceptSpy.withArgs(plantUMLvisitor, param).calledTwice.should.be.ok;
        });
    });

    describe('visitEnumDeclaration', () => {
        it('should write the class declaration for an enum', () => {
            let acceptSpy = sinon.spy();

            let param = {
                fileWriter: mockFileWriter
            };

            let mockParticipantDeclaration = sinon.createStubInstance(EnumDeclaration);
            mockParticipantDeclaration.getFullyQualifiedName.returns('org.acme.Person');
            mockParticipantDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);

            plantUMLvisitor.visitEnumDeclaration(mockParticipantDeclaration, param);

            param.fileWriter.writeLine.callCount.should.deep.equal(2);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'class org.acme.Person << (E,grey) >> {']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, '}']);

            acceptSpy.withArgs(plantUMLvisitor, param).calledTwice.should.be.ok;
        });

        it('should write the class declaration for an enum with a super type', () => {
            let acceptSpy = sinon.spy();

            let param = {
                fileWriter: mockFileWriter
            };

            let mockParticipantDeclaration = sinon.createStubInstance(EnumDeclaration);
            mockParticipantDeclaration.getFullyQualifiedName.returns('org.acme.Person');
            mockParticipantDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);
            mockParticipantDeclaration.getSuperType.returns('org.acme.Human');

            plantUMLvisitor.visitEnumDeclaration(mockParticipantDeclaration, param);

            param.fileWriter.writeLine.callCount.should.deep.equal(3);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'class org.acme.Person << (E,grey) >> {']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, '}']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, 'org.acme.Person --|> org.acme.Human']);

            acceptSpy.withArgs(plantUMLvisitor, param).calledTwice.should.be.ok;
        });
    });

    describe('visitParticipantDeclaration', () => {
        it('should write the class declaration for a participant', () => {
            let acceptSpy = sinon.spy();

            let param = {
                fileWriter: mockFileWriter
            };

            let mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
            mockParticipantDeclaration.getFullyQualifiedName.returns('org.acme.Person');
            mockParticipantDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);

            plantUMLvisitor.visitParticipantDeclaration(mockParticipantDeclaration, param);

            param.fileWriter.writeLine.callCount.should.deep.equal(2);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'class org.acme.Person << (P,lightblue) >> {']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, '}']);

            acceptSpy.withArgs(plantUMLvisitor, param).calledTwice.should.be.ok;
        });

        it('should write the class declaration for a participant with a super type', () => {
            let acceptSpy = sinon.spy();

            let param = {
                fileWriter: mockFileWriter
            };

            let mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
            mockParticipantDeclaration.getFullyQualifiedName.returns('org.acme.Person');
            mockParticipantDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);
            mockParticipantDeclaration.getSuperType.returns('org.acme.Human');

            plantUMLvisitor.visitParticipantDeclaration(mockParticipantDeclaration, param);

            param.fileWriter.writeLine.callCount.should.deep.equal(3);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'class org.acme.Person << (P,lightblue) >> {']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, '}']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, 'org.acme.Person --|> org.acme.Human']);

            acceptSpy.withArgs(plantUMLvisitor, param).calledTwice.should.be.ok;
        });
    });

    describe('visitTransactionDeclaration', () => {
        it('should write the class declaration for a transaction', () => {
            let acceptSpy = sinon.spy();

            let param = {
                fileWriter: mockFileWriter
            };

            let mockTransDeclaration = sinon.createStubInstance(TransactionDeclaration);
            mockTransDeclaration.getFullyQualifiedName.returns('org.acme.Person');
            mockTransDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);

            plantUMLvisitor.visitTransactionDeclaration(mockTransDeclaration, param);

            param.fileWriter.writeLine.callCount.should.deep.equal(2);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'class org.acme.Person << (T,yellow) >> {']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, '}']);

            acceptSpy.withArgs(plantUMLvisitor, param).calledTwice.should.be.ok;
        });

        it('should write the class declaration for a transaction with a super type', () => {
            let acceptSpy = sinon.spy();

            let param = {
                fileWriter: mockFileWriter
            };

            let mockTransDeclaration = sinon.createStubInstance(TransactionDeclaration);
            mockTransDeclaration.getFullyQualifiedName.returns('org.acme.Person');
            mockTransDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);
            mockTransDeclaration.getSuperType.returns('org.acme.Human');

            plantUMLvisitor.visitTransactionDeclaration(mockTransDeclaration, param);

            param.fileWriter.writeLine.callCount.should.deep.equal(3);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'class org.acme.Person << (T,yellow) >> {']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, '}']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, 'org.acme.Person --|> org.acme.Human']);

            acceptSpy.withArgs(plantUMLvisitor, param).calledTwice.should.be.ok;
        });
    });

    describe('visitClassDeclaration', () => {
        it('should write the class declaration for a class', () => {
            let acceptSpy = sinon.spy();

            let param = {
                fileWriter: mockFileWriter
            };

            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockClassDeclaration.getFullyQualifiedName.returns('org.acme.Person');
            mockClassDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);

            plantUMLvisitor.visitClassDeclaration(mockClassDeclaration, param);

            param.fileWriter.writeLine.callCount.should.deep.equal(2);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'class org.acme.Person {']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, '}']);

            acceptSpy.withArgs(plantUMLvisitor, param).calledTwice.should.be.ok;
        });

        it('should write the class declaration for a class with a super type', () => {
            let acceptSpy = sinon.spy();

            let param = {
                fileWriter: mockFileWriter
            };

            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockClassDeclaration.getFullyQualifiedName.returns('org.acme.Person');
            mockClassDeclaration.getOwnProperties.returns([{
                accept: acceptSpy
            },
            {
                accept: acceptSpy
            }]);
            mockClassDeclaration.getSuperType.returns('org.acme.Human');

            plantUMLvisitor.visitClassDeclaration(mockClassDeclaration, param);

            param.fileWriter.writeLine.callCount.should.deep.equal(3);
            param.fileWriter.writeLine.getCall(0).args.should.deep.equal([0, 'class org.acme.Person {']);
            param.fileWriter.writeLine.getCall(1).args.should.deep.equal([0, '}']);
            param.fileWriter.writeLine.getCall(2).args.should.deep.equal([0, 'org.acme.Person --|> org.acme.Human']);

            acceptSpy.withArgs(plantUMLvisitor, param).calledTwice.should.be.ok;
        });
    });

    describe('visitField', () => {
        it('should write a line for a field', () => {
            let param = {
                fileWriter: mockFileWriter
            };

            let mockField = sinon.createStubInstance(Field);
            mockField.getType.returns('string');
            mockField.getName.returns('Bob');

            plantUMLvisitor.visitField(mockField, param);

            param.fileWriter.writeLine.withArgs(1, '+ string Bob').calledOnce.should.be.ok;
        });

        it('should write a line for a field thats an array', () => {
            let param = {
                fileWriter: mockFileWriter
            };

            let mockField = sinon.createStubInstance(Field);
            mockField.getType.returns('string');
            mockField.getName.returns('Bob');
            mockField.isArray.returns(true);

            plantUMLvisitor.visitField(mockField, param);

            param.fileWriter.writeLine.withArgs(1, '+ string[] Bob').calledOnce.should.be.ok;
        });
    });

    describe('visitEnumValueDeclaration', () => {
        it('should write a line for a enum value', () => {
            let param = {
                fileWriter: mockFileWriter
            };

            let mockEnumValueDecl = sinon.createStubInstance(EnumValueDeclaration);
            mockEnumValueDecl.getName.returns('Bob');

            plantUMLvisitor.visitEnumValueDeclaration(mockEnumValueDecl, param);

            param.fileWriter.writeLine.withArgs(1, '+ Bob').calledOnce.should.be.ok;
        });
    });

    describe('visitRelationship', () => {
        it('should write a line for a relationship', () => {
            let param = {
                fileWriter: mockFileWriter
            };

            let mockRelationship = sinon.createStubInstance(RelationshipDeclaration);
            mockRelationship.getType.returns('string');
            mockRelationship.getName.returns('Bob');

            plantUMLvisitor.visitRelationship(mockRelationship, param);

            param.fileWriter.writeLine.withArgs(1, '+ string Bob');
        });

        it('should write a line for a relationship thats an array', () => {
            let param = {
                fileWriter: mockFileWriter
            };

            let mockRelationship = sinon.createStubInstance(RelationshipDeclaration);
            mockRelationship.getType.returns('string');
            mockRelationship.getName.returns('Bob');
            mockRelationship.isArray.returns(true);

            plantUMLvisitor.visitRelationship(mockRelationship, param);

            param.fileWriter.writeLine.withArgs(1, '+ string Bob');
        });
    });
});