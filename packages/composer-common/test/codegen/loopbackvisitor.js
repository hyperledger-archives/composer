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

const FileWriter = require('../../lib/codegen/filewriter');
const fs = require('fs');
const LoopbackVisitor = require('../../lib/codegen/fromcto/loopback/loopbackvisitor');
const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const path = require('path');

require('chai').should();
const sinon = require('sinon');

describe('LoopbackVisitor', () => {

    let mockFileWriter;
    let modelManager;
    let visitor;

    let sandbox;

    beforeEach(() => {
        mockFileWriter = sinon.createStubInstance(FileWriter);
        modelManager = new ModelManager();
        modelManager.addModelFile(fs.readFileSync(path.resolve(__dirname, '../data/model/model-base.cto'), 'utf8'), 'model-base.cto');
        visitor = new LoopbackVisitor();
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#visit', () => {

        it('should throw for an unrecognised type', () => {
            (() => {
                visitor.visit({}, {});
            }).should.throw(/Unrecognised type: /);
        });

        it('should handle processing if no writer provided', () => {

            // Visit all of the loaded model files.
            modelManager.accept(visitor, { fileWriter: null });

        });

        it('should generate Loopback model files for each type when given a model manager', () => {

            // Visit all of the loaded model files.
            const schemas = modelManager.accept(visitor, { fileWriter: mockFileWriter });

            // Check that the Loopback model files were generated, and extract the
            // generated schemas from the stub writer.
            const expectedFiles = [
                'org.acme.base.SimpleAsset.json',
                'org.acme.base.BaseAsset.json',
                'org.acme.base.DerivedAsset.json',
                'org.acme.base.DerivedDerivedAsset.json',
                'org.acme.base.MyBasicTransaction.json',
                'org.acme.base.MyTransaction.json',
                'org.acme.base.MyTransactionEx.json',
                'org.acme.base.Person.json',
                'org.acme.base.Bloke.json',
                'org.acme.base.UnitedStatesAddress.json'
            ];
            schemas.should.have.lengthOf(expectedFiles.length);
            sinon.assert.callCount(mockFileWriter.openFile, expectedFiles.length);

            expectedFiles.forEach((expectedFile) => {
                sinon.assert.calledWith(mockFileWriter.openFile, expectedFile);
            });

        });

        it('should generate Loopback model files for each type when given a model file', () => {

            // Visit all of the loaded model files.
            const modelFile = modelManager.getModelFile('org.acme.base');
            const schemas = modelFile.accept(visitor, { fileWriter: mockFileWriter });

            // Check that the Loopback model files were generated, and extract the
            // generated schemas from the stub writer.
            const expectedFiles = [
                'org.acme.base.SimpleAsset.json',
                'org.acme.base.BaseAsset.json',
                'org.acme.base.DerivedAsset.json',
                'org.acme.base.DerivedDerivedAsset.json',
                'org.acme.base.MyBasicTransaction.json',
                'org.acme.base.MyTransaction.json',
                'org.acme.base.MyTransactionEx.json',
                'org.acme.base.Person.json',
                'org.acme.base.Bloke.json',
                'org.acme.base.UnitedStatesAddress.json'
            ];
            schemas.should.have.lengthOf(expectedFiles.length);
            sinon.assert.callCount(mockFileWriter.openFile, expectedFiles.length);

            expectedFiles.forEach((expectedFile) => {
                sinon.assert.calledWith(mockFileWriter.openFile, expectedFile);
            });

        });

        it('should generate a schema for an asset with just an identifier', () => {
            const modelFile = new ModelFile(modelManager, `
            namespace org.acme
            asset MyAsset identified by assetId {
                o String assetId
            }
            `);
            const schemas = modelFile.accept(visitor, { fileWriter: mockFileWriter });
            schemas.should.deep.equal([{
                acls: [],
                base: 'PersistedModel',
                description: 'An asset named MyAsset',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyAsset',
                options: {
                    composer: {
                        type: 'asset',
                        namespace: 'org.acme',
                        name: 'MyAsset',
                        fqn: 'org.acme.MyAsset'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyAsset',
                properties: {
                    $class: {
                        default: 'org.acme.MyAsset',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    assetId: {
                        description: 'The instance identifier for this type',
                        id: true,
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }]);
        });

        it('should generate two schemas for an asset that extends another asset', () => {
            const modelFile = new ModelFile(modelManager, `
            namespace org.acme
            asset MyBaseAsset identified by assetId {
                o String assetId
            }
            asset MyAsset extends MyBaseAsset {
                o String theValue
            }
            `);
            const schemas = modelFile.accept(visitor, { fileWriter: mockFileWriter });
            schemas.should.deep.equal([{
                acls: [],
                base: 'PersistedModel',
                description: 'An asset named MyBaseAsset',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyBaseAsset',
                options: {
                    composer: {
                        type: 'asset',
                        namespace: 'org.acme',
                        name: 'MyBaseAsset',
                        fqn: 'org.acme.MyBaseAsset'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyBaseAsset',
                properties: {
                    $class: {
                        default: 'org.acme.MyBaseAsset',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    assetId: {
                        description: 'The instance identifier for this type',
                        id: true,
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }, {
                acls: [],
                base: 'PersistedModel',
                description: 'An asset named MyAsset',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyAsset',
                options: {
                    composer: {
                        type: 'asset',
                        namespace: 'org.acme',
                        name: 'MyAsset',
                        fqn: 'org.acme.MyAsset'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyAsset',
                properties: {
                    $class: {
                        default: 'org.acme.MyAsset',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    assetId: {
                        description: 'The instance identifier for this type',
                        id: true,
                        required: true,
                        type: 'string'
                    },
                    theValue: {
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }]);
        });

        it('should generate one schema for an asset that extends an abstract asset', () => {
            const modelFile = new ModelFile(modelManager, `
            namespace org.acme
            abstract asset MyBaseAsset identified by assetId {
                o String assetId
            }
            asset MyAsset extends MyBaseAsset {
                o String theValue
            }
            `);
            const schemas = modelFile.accept(visitor, { fileWriter: mockFileWriter });
            schemas.should.deep.equal([{
                acls: [],
                base: 'PersistedModel',
                description: 'An asset named MyAsset',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyAsset',
                options: {
                    composer: {
                        type: 'asset',
                        namespace: 'org.acme',
                        name: 'MyAsset',
                        fqn: 'org.acme.MyAsset'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyAsset',
                properties: {
                    $class: {
                        default: 'org.acme.MyAsset',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    assetId: {
                        description: 'The instance identifier for this type',
                        id: true,
                        required: true,
                        type: 'string'
                    },
                    theValue: {
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }]);
        });

        it('should generate a schema for a participant with just an identifier', () => {
            const modelFile = new ModelFile(modelManager, `
            namespace org.acme
            participant MyParticipant identified by participantId {
                o String participantId
            }
            `);
            const schemas = modelFile.accept(visitor, { fileWriter: mockFileWriter });
            schemas.should.deep.equal([{
                acls: [],
                base: 'PersistedModel',
                description: 'A participant named MyParticipant',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyParticipant',
                options: {
                    composer: {
                        type: 'participant',
                        namespace: 'org.acme',
                        name: 'MyParticipant',
                        fqn: 'org.acme.MyParticipant'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyParticipant',
                properties: {
                    $class: {
                        default: 'org.acme.MyParticipant',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    participantId: {
                        description: 'The instance identifier for this type',
                        id: true,
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }]);
        });

        it('should generate two schemas for a participant that extends another participant', () => {
            const modelFile = new ModelFile(modelManager, `
            namespace org.acme
            participant MyBaseParticipant identified by participantId {
                o String participantId
            }
            participant MyParticipant extends MyBaseParticipant {
                o String theValue
            }
            `);
            const schemas = modelFile.accept(visitor, { fileWriter: mockFileWriter });
            schemas.should.deep.equal([{
                acls: [],
                base: 'PersistedModel',
                description: 'A participant named MyBaseParticipant',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyBaseParticipant',
                options: {
                    composer: {
                        type: 'participant',
                        namespace: 'org.acme',
                        name: 'MyBaseParticipant',
                        fqn: 'org.acme.MyBaseParticipant'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyBaseParticipant',
                properties: {
                    $class: {
                        default: 'org.acme.MyBaseParticipant',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    participantId: {
                        description: 'The instance identifier for this type',
                        id: true,
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }, {
                acls: [],
                base: 'PersistedModel',
                description: 'A participant named MyParticipant',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyParticipant',
                options: {
                    composer: {
                        type: 'participant',
                        namespace: 'org.acme',
                        name: 'MyParticipant',
                        fqn: 'org.acme.MyParticipant'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyParticipant',
                properties: {
                    $class: {
                        default: 'org.acme.MyParticipant',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    participantId: {
                        description: 'The instance identifier for this type',
                        id: true,
                        required: true,
                        type: 'string'
                    },
                    theValue: {
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }]);
        });

        it('should generate one schema for a participant that extends an abstract participant', () => {
            const modelFile = new ModelFile(modelManager, `
            namespace org.acme
            abstract participant MyBaseParticipant identified by participantId {
                o String participantId
            }
            participant MyParticipant extends MyBaseParticipant {
                o String theValue
            }
            `);
            const schemas = modelFile.accept(visitor, { fileWriter: mockFileWriter });
            schemas.should.deep.equal([{
                acls: [],
                base: 'PersistedModel',
                description: 'A participant named MyParticipant',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyParticipant',
                options: {
                    composer: {
                        type: 'participant',
                        namespace: 'org.acme',
                        name: 'MyParticipant',
                        fqn: 'org.acme.MyParticipant'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyParticipant',
                properties: {
                    $class: {
                        default: 'org.acme.MyParticipant',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    participantId: {
                        description: 'The instance identifier for this type',
                        id: true,
                        required: true,
                        type: 'string'
                    },
                    theValue: {
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }]);
        });

        it('should generate a schema for a transaction with just an identifier', () => {
            const modelFile = new ModelFile(modelManager, `
            namespace org.acme
            transaction MyTransaction identified by transactionId {
                o String transactionId
            }
            `);
            const schemas = modelFile.accept(visitor, { fileWriter: mockFileWriter });
            schemas.should.deep.equal([{
                acls: [],
                base: 'PersistedModel',
                description: 'A transaction named MyTransaction',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyTransaction',
                options: {
                    composer: {
                        type: 'transaction',
                        namespace: 'org.acme',
                        name: 'MyTransaction',
                        fqn: 'org.acme.MyTransaction'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyTransaction',
                properties: {
                    $class: {
                        default: 'org.acme.MyTransaction',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    timestamp: {
                        required: true,
                        type: 'date'
                    },
                    transactionId: {
                        description: 'The instance identifier for this type',
                        id: true,
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }]);
        });

        it('should generate two schemas for a transaction that extends another transaction', () => {
            const modelFile = new ModelFile(modelManager, `
            namespace org.acme
            transaction MyBaseTransaction identified by transactionId {
                o String transactionId
            }
            transaction MyTransaction extends MyBaseTransaction {
                o String theValue
            }
            `);
            const schemas = modelFile.accept(visitor, { fileWriter: mockFileWriter });
            schemas.should.deep.equal([{
                acls: [],
                base: 'PersistedModel',
                description: 'A transaction named MyBaseTransaction',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyBaseTransaction',
                options: {
                    composer: {
                        type: 'transaction',
                        namespace: 'org.acme',
                        name: 'MyBaseTransaction',
                        fqn: 'org.acme.MyBaseTransaction'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyBaseTransaction',
                properties: {
                    $class: {
                        default: 'org.acme.MyBaseTransaction',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    transactionId: {
                        description: 'The instance identifier for this type',
                        id: true,
                        required: true,
                        type: 'string'
                    },
                    timestamp: {
                        required: true,
                        type: 'date'
                    }
                },
                relations: {},
                validations: []
            }, {
                acls: [],
                base: 'PersistedModel',
                description: 'A transaction named MyTransaction',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyTransaction',
                options: {
                    composer: {
                        type: 'transaction',
                        namespace: 'org.acme',
                        name: 'MyTransaction',
                        fqn: 'org.acme.MyTransaction'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyTransaction',
                properties: {
                    $class: {
                        default: 'org.acme.MyTransaction',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    transactionId: {
                        description: 'The instance identifier for this type',
                        id: true,
                        required: true,
                        type: 'string'
                    },
                    timestamp: {
                        required: true,
                        type: 'date'
                    },
                    theValue: {
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }]);
        });

        it('should generate one schema for a transaction that extends an abstract transaction', () => {
            const modelFile = new ModelFile(modelManager, `
            namespace org.acme
            abstract transaction MyBaseTransaction identified by transactionId {
                o String transactionId
            }
            transaction MyTransaction extends MyBaseTransaction {
                o String theValue
            }
            `);
            const schemas = modelFile.accept(visitor, { fileWriter: mockFileWriter });
            schemas.should.deep.equal([{
                acls: [],
                base: 'PersistedModel',
                description: 'A transaction named MyTransaction',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyTransaction',
                options: {
                    composer: {
                        type: 'transaction',
                        namespace: 'org.acme',
                        name: 'MyTransaction',
                        fqn: 'org.acme.MyTransaction'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyTransaction',
                properties: {
                    $class: {
                        default: 'org.acme.MyTransaction',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    transactionId: {
                        description: 'The instance identifier for this type',
                        id: true,
                        required: true,
                        type: 'string'
                    },
                    timestamp: {
                        required: true,
                        type: 'date'
                    },
                    theValue: {
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }]);
        });

        it('should generate a schema for a concept with a single property', () => {
            const modelFile = new ModelFile(modelManager, `
            namespace org.acme
            concept MyConcept {
                o String theValue
            }
            `);
            const schemas = modelFile.accept(visitor, { fileWriter: mockFileWriter });
            schemas.should.deep.equal([{
                acls: [],
                // base: 'PersistedModel',
                description: 'A concept named MyConcept',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyConcept',
                options: {
                    composer: {
                        type: 'concept',
                        namespace: 'org.acme',
                        name: 'MyConcept',
                        fqn: 'org.acme.MyConcept'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyConcept',
                properties: {
                    $class: {
                        default: 'org.acme.MyConcept',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    theValue: {
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }]);
        });

        it('should generate two schemas for a concept that extends another concept', () => {
            const modelFile = new ModelFile(modelManager, `
            namespace org.acme
            concept MyBaseConcept {
                o String theValue
            }
            concept MyConcept extends MyBaseConcept {
                o String theValue2
            }
            `);
            const schemas = modelFile.accept(visitor, { fileWriter: mockFileWriter });
            schemas.should.deep.equal([{
                acls: [],
                // base: 'PersistedModel',
                description: 'A concept named MyBaseConcept',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyBaseConcept',
                options: {
                    composer: {
                        type: 'concept',
                        namespace: 'org.acme',
                        name: 'MyBaseConcept',
                        fqn: 'org.acme.MyBaseConcept'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyBaseConcept',
                properties: {
                    $class: {
                        default: 'org.acme.MyBaseConcept',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    theValue: {
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }, {
                acls: [],
                // base: 'PersistedModel',
                description: 'A concept named MyConcept',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyConcept',
                options: {
                    composer: {
                        type: 'concept',
                        namespace: 'org.acme',
                        name: 'MyConcept',
                        fqn: 'org.acme.MyConcept'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyConcept',
                properties: {
                    $class: {
                        default: 'org.acme.MyConcept',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    theValue: {
                        required: true,
                        type: 'string'
                    },
                    theValue2: {
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }]);
        });

        it('should generate one schema for a concept that extends an abstract concept', () => {
            const modelFile = new ModelFile(modelManager, `
            namespace org.acme
            abstract concept MyBaseConcept {
                o String theValue
            }
            concept MyConcept extends MyBaseConcept {
                o String theValue2
            }
            `);
            const schemas = modelFile.accept(visitor, { fileWriter: mockFileWriter });
            schemas.should.deep.equal([{
                acls: [],
                // base: 'PersistedModel',
                description: 'A concept named MyConcept',
                idInjection: false,
                methods: [],
                name: 'org_acme_MyConcept',
                options: {
                    composer: {
                        type: 'concept',
                        namespace: 'org.acme',
                        name: 'MyConcept',
                        fqn: 'org.acme.MyConcept'
                    },
                    validateUpsert: true
                },
                plural: 'org.acme.MyConcept',
                properties: {
                    $class: {
                        default: 'org.acme.MyConcept',
                        description: 'The class identifier for this type',
                        required: false,
                        type: 'string'
                    },
                    theValue: {
                        required: true,
                        type: 'string'
                    },
                    theValue2: {
                        required: true,
                        type: 'string'
                    }
                },
                relations: {},
                validations: []
            }]);
        });

    });

});
