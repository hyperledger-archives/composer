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

const IllegalModelException = require('../../lib/introspect/illegalmodelexception');
const ClassDeclaration = require('../../lib/introspect/classdeclaration');
const AssetDeclaration = require('../../lib/introspect/assetdeclaration');
const EnumDeclaration = require('../../lib/introspect/enumdeclaration');
const ConceptDeclaration = require('../../lib/introspect/conceptdeclaration');
const ParticipantDeclaration = require('../../lib/introspect/participantdeclaration');
const TransactionDeclaration = require('../../lib/introspect/transactiondeclaration');
const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const fs = require('fs');

const should = require('chai').should();
const sinon = require('sinon');

describe('ClassDeclaration', () => {

    let modelManager;
    let modelFile;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelFile = new ModelFile(modelManager, 'namespace com.hyperledger.testing', 'org.acme.cto');
    });

    /**
     * Load an arbitrary number of model files.
     * @param {String[]} modelFileNames array of model file names.
     * @param {ModelManager} modelManager the model manager to which the created model files will be registered.
     * @return {ModelFile[]} array of loaded model files, matching the supplied arguments.
     */
    const loadModelFiles = (modelFileNames, modelManager) => {
        const modelFiles = [];
        for (let modelFileName of modelFileNames) {
            const modelDefinitions = fs.readFileSync(modelFileName, 'utf8');
            const modelFile = new ModelFile(modelManager, modelDefinitions);
            modelFiles.push(modelFile);
        }
        return modelFiles;
    };

    const loadModelFile = (modelFileName) => {
        return loadModelFiles([modelFileName], modelManager)[0];
    };

    const loadLastDeclaration = (modelFileName, type) => {
        const modelFile = loadModelFile(modelFileName);
        const declarations = modelFile.getDeclarations(type);
        return declarations[declarations.length - 1];
    };

    describe('#constructor', () => {

        it('should throw if modelFile not specified', () => {
            (() => {
                new ClassDeclaration(null, {});
            }).should.throw(/required/);
        });

        it('should throw if ast not specified', () => {
            (() => {
                new ClassDeclaration(modelFile, null);
            }).should.throw(/required/);
        });

        it('should throw if ast contains invalid type', () => {
            (() => {
                new ClassDeclaration(modelFile, {
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
        it('should throw when an identifier extends from a super type', () => {
            let asset = loadLastDeclaration('test/data/parser/classdeclaration.identifierextendsfromsupertype.cto', AssetDeclaration);
            (() => {
                asset.validate();
            }).should.throw(/Identifier cannot extend from super type/);
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

        it('should throw when not abstract, not enum and not concept without an identifier', () => {
            let asset = loadLastDeclaration('test/data/parser/classdeclaration.noidentifier.cto', TransactionDeclaration);
            asset.superType = null;
            try {
                asset.validate();
            } catch (err) {
                err.should.be.an.instanceOf(IllegalModelException);
                should.exist(err.message);
                err.message.should.match(/Class Transaction is not declared as abstract. It must define an identifying field./);
            }
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let clz = new ClassDeclaration(modelFile, {
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
            let clz = new ClassDeclaration(modelFile, {
                id: {
                    name: 'suchName'
                },
                body: {
                    declarations: [
                    ]
                }
            });
            clz.getModelFile().should.equal(modelFile);
        });

    });

    describe('#getName', () => {

        it('should return the class name', () => {
            let clz = new ClassDeclaration(modelFile, {
                id: {
                    name: 'suchName'
                },
                body: {
                    declarations: [
                    ]
                }
            });
            clz.getName().should.equal('suchName');
            clz.toString().should.equal('ClassDeclaration {id=com.hyperledger.testing.suchName enum=false abstract=false}');
        });

    });

    describe('#getFullyQualifiedName', () => {

        it('should return the fully qualified name if function is in a namespace', () => {
            let clz = new ClassDeclaration(modelFile, {
                id: {
                    name: 'suchName'
                },
                body: {
                    declarations: [
                    ]
                }
            });
            clz.getFullyQualifiedName().should.equal('com.hyperledger.testing.suchName');
        });

    });

    describe('#getSuperType', function() {
        const modelFileNames = [
            'test/data/parser/classdeclaration.participantwithparents.parent.cto',
            'test/data/parser/classdeclaration.participantwithparents.child.cto'
        ];
        let modelManager;

        beforeEach(() => {
            modelManager = new ModelManager();
            const modelFiles = loadModelFiles(modelFileNames, modelManager);
            modelManager.addModelFiles(modelFiles);
        });

        it('should return superclass when one exists in the same model file', function() {
            const subclass = modelManager.getType('com.testing.parent.Super');
            should.exist(subclass);
            const superclassName = subclass.getSuperType();
            superclassName.should.equal('com.testing.parent.Base');
        });

        it('should return superclass when one exists in a different model file', function() {
            const subclass = modelManager.getType('com.testing.child.Sub');
            should.exist(subclass);
            const superclassName = subclass.getSuperType();
            superclassName.should.equal('com.testing.parent.Super');
        });

        it('should return system type when none exists', function() {
            const baseclass = modelManager.getType('com.testing.parent.Base');
            should.exist(baseclass);
            const superclassName = baseclass.getSuperType();
            should.equal(superclassName,'org.hyperledger.composer.system.Participant');
        });

        it('toString',()=>{
            const baseclass = modelManager.getType('com.testing.parent.Base');
            baseclass.toString().should.equal('ClassDeclaration {id=com.testing.parent.Base super=Participant enum=false abstract=true}');
        });
    });

    describe('#getNested', function() {
        const modelFileNames = [
            'test/data/parser/classdeclaration.good.nested.cto'
        ];
        let modelManager;

        beforeEach(() => {
            modelManager = new ModelManager();
            const modelFiles = loadModelFiles(modelFileNames, modelManager);
            modelManager.addModelFiles(modelFiles);
        });

        it('get nested happy path', function() {
            let extremeOuter = modelManager.getType('com.hyperledger.testing.ExtremeOuter');
            should.exist(extremeOuter.getNestedProperty('outerAsset.innerAsset'));
        });
        it('get error with missing propertyname', function() {
            let extremeOuter = modelManager.getType('com.hyperledger.testing.ExtremeOuter');
            (()=>{extremeOuter.getNestedProperty('outerAsset.missing');}).should.throw(/Property missing does not exist on com.hyperledger.testing.Outer/);
        });
        it('get error with primitives', function() {
            let extremeOuter = modelManager.getType('com.hyperledger.testing.ExtremeOuter');
            (()=>{extremeOuter.getNestedProperty('outerAsset.int.innerAsset');}).should.throw(/Property int is a primitive or enum/);
        });
    });

    describe('#getAssignableClassDeclarations', function() {
        const modelFileNames = [
            'test/data/parser/classdeclaration.participantwithparents.parent.cto',
            'test/data/parser/classdeclaration.participantwithparents.child.cto'
        ];
        let modelManager;

        beforeEach(() => {
            modelManager = new ModelManager();
            const modelFiles = loadModelFiles(modelFileNames, modelManager);
            modelManager.addModelFiles(modelFiles);
        });

        it('should return itself only if there are no subclasses', function() {
            const baseclass = modelManager.getType('com.testing.child.Sub');
            should.exist(baseclass);
            const subclasses = baseclass.getAssignableClassDeclarations();
            subclasses.should.have.same.members([baseclass]);
        });

        it('should return all subclass definitions', function() {
            const baseclass = modelManager.getType('com.testing.parent.Base');
            should.exist(baseclass);
            const subclasses = baseclass.getAssignableClassDeclarations();
            const subclassNames = subclasses.map(classDef => classDef.getName());
            subclassNames.should.have.same.members(['Base', 'Super', 'Sub', 'Sub2']);
        });


    });

    describe('#_resolveSuperType', () => {

        it('should return null if no super type', () => {
            let modelManager = new ModelManager();
            let classDecl = modelManager.getType('org.hyperledger.composer.system.Asset');
            should.equal(classDecl._resolveSuperType(), null);
        });

        it('should return the super class declaration for a system super class', () => {
            let modelManager = new ModelManager();
            modelManager.addModelFile(`namespace org.acme
            asset TestAsset identified by assetId { o String assetId }`);
            let classDecl = modelManager.getType('org.acme.TestAsset');
            let superClassDecl = classDecl._resolveSuperType();
            superClassDecl.getFullyQualifiedName().should.equal('org.hyperledger.composer.system.Asset');
        });

        it('should return the super class declaration for a super class in the same file', () => {
            let modelManager = new ModelManager();
            modelManager.addModelFile(`namespace org.acme
            abstract asset BaseAsset { }
            asset TestAsset identified by assetId extends BaseAsset { o String assetId }`);
            let classDecl = modelManager.getType('org.acme.TestAsset');
            let superClassDecl = classDecl._resolveSuperType();
            superClassDecl.getFullyQualifiedName().should.equal('org.acme.BaseAsset');
        });

        it('should return the super class declaration for a super class in another file', () => {
            let modelManager = new ModelManager();
            modelManager.addModelFile(`namespace org.base
            abstract asset BaseAsset { }`);
            modelManager.addModelFile(`namespace org.acme
            import org.base.BaseAsset
            asset TestAsset identified by assetId extends BaseAsset { o String assetId }`);
            let classDecl = modelManager.getType('org.acme.TestAsset');
            let superClassDecl = classDecl._resolveSuperType();
            superClassDecl.getFullyQualifiedName().should.equal('org.base.BaseAsset');
        });

    });

    describe('#getSuperTypeDeclaration', () => {

        it('should return null if no super type', () => {
            let modelManager = new ModelManager();
            let classDecl = modelManager.getType('org.hyperledger.composer.system.Asset');
            should.equal(classDecl.getSuperTypeDeclaration(), null);
        });

        it('should resolve the super type if not already resolved', () => {
            let modelManager = new ModelManager();
            modelManager.addModelFile(`namespace org.acme
            asset TestAsset identified by assetId { o String assetId }`);
            let classDecl = modelManager.getType('org.acme.TestAsset');
            classDecl.superTypeDeclaration = null;
            let spy = sinon.spy(classDecl, '_resolveSuperType');
            let superClassDecl = classDecl.getSuperTypeDeclaration();
            superClassDecl.getFullyQualifiedName().should.equal('org.hyperledger.composer.system.Asset');
            sinon.assert.calledOnce(spy);
        });

        it('should not resolve the super type if not already resolved', () => {
            let modelManager = new ModelManager();
            modelManager.addModelFile(`namespace org.acme
            asset TestAsset identified by assetId { o String assetId }`);
            let classDecl = modelManager.getType('org.acme.TestAsset');
            let spy = sinon.spy(classDecl, '_resolveSuperType');
            let superClassDecl = classDecl.getSuperTypeDeclaration();
            superClassDecl.getFullyQualifiedName().should.equal('org.hyperledger.composer.system.Asset');
            sinon.assert.notCalled(spy);
        });

    });

    describe('#validation', function() {
        const modelFileNames = [
            'test/data/parser/validation.cto'
        ];
        let modelManager;

        beforeEach(() => {

        });

        it('validation of super types',()=>{
            (()=>{
                modelManager = new ModelManager();
                const modelFiles = loadModelFiles(modelFileNames, modelManager);
                modelManager.addModelFiles(modelFiles);

            }).should.throw(/cannot extend Asset/);

        });

        it('validation of super types',()=>{
            (()=>{
                modelManager = new ModelManager();
                const modelFiles = loadModelFiles(modelFileNames, modelManager);
                modelManager.addModelFiles(modelFiles);

            }).should.throw(/cannot extend Asset/);

        });
    });

    describe('#getAllSuperTypeDeclarations', function() {
        const modelFileNames = [
            'test/data/parser/classdeclaration.participantwithparents.parent.cto',
            'test/data/parser/classdeclaration.participantwithparents.child.cto'
        ];
        let modelManager;

        beforeEach(() => {
            modelManager = new ModelManager();
            const modelFiles = loadModelFiles(modelFileNames, modelManager);
            modelManager.addModelFiles(modelFiles);
        });

        it('should return array with only system types if there are no superclasses', function() {
            const testClass = modelManager.getType('com.testing.parent.Base');
            should.exist(testClass);
            const superclasses = testClass.getAllSuperTypeDeclarations();
            const superclassNames = superclasses.map(classDef => classDef.getName());
            superclassNames.should.have.members(['Participant']);
        });

        it('should return all superclass definitions', function() {
            const testClass = modelManager.getType('com.testing.child.Sub');
            should.exist(testClass);
            const superclasses = testClass.getAllSuperTypeDeclarations();
            const superclassNames = superclasses.map(classDef => classDef.getName());
            superclassNames.should.have.same.members(['Base', 'Super','Participant']);
        });
    });

    describe('#isEvent', () => {
        const modelFileNames = [
            'test/data/parser/classdeclaration.participantwithparents.parent.cto',
            'test/data/parser/classdeclaration.participantwithparents.child.cto'
        ];
        let modelManager;

        beforeEach(() => {
            modelManager = new ModelManager();
            const modelFiles = loadModelFiles(modelFileNames, modelManager);
            modelManager.addModelFiles(modelFiles);
        });
        it('should return false', () => {
            const testClass = modelManager.getType('com.testing.child.Sub');
            testClass.isEvent().should.be.false;

        });
    });

    describe('#isRelationshipTarget', () => {
        const modelFileNames = [
            'test/data/parser/classdeclaration.isrelationshiptarget.cto',
        ];
        let modelManager;

        beforeEach(() => {
            modelManager = new ModelManager();
            const modelFiles = loadModelFiles(modelFileNames, modelManager);
            modelManager.addModelFiles(modelFiles);
        });

        it('should return false', () => {
            const testClass = modelManager.getType('com.testing.Test');
            testClass.isRelationshipTarget().should.be.false;

        });
    });

    describe('#isSystemRelationshipTarget', () => {
        const modelFileNames = [
            'test/data/parser/classdeclaration.isrelationshiptarget.cto',
        ];
        let modelManager;

        beforeEach(() => {
            modelManager = new ModelManager();
            const modelFiles = loadModelFiles(modelFileNames, modelManager);
            modelManager.addModelFiles(modelFiles);
        });

        it('should return false', () => {
            const testClass = modelManager.getType('com.testing.Test');
            testClass.isSystemRelationshipTarget().should.be.false;

        });
    });
});
