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

    [undefined, true, false].forEach((namespaces) => {

        describe(`namespaces = ${namespaces}`, () => {

            beforeEach(() => {
                mockFileWriter = sinon.createStubInstance(FileWriter);
                modelManager = new ModelManager();
                modelManager.addModelFile(fs.readFileSync(path.resolve(__dirname, '../data/model/model-base.cto'), 'utf8'), 'model-base.cto');
                visitor = new LoopbackVisitor(namespaces);
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
                    let expectedFiles, expectedTypes;
                    if (namespaces) {
                        expectedFiles = [
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
                        expectedTypes = [
                            'org_acme_base_SimpleAsset',
                            'org_acme_base_BaseAsset',
                            'org_acme_base_DerivedAsset',
                            'org_acme_base_DerivedDerivedAsset',
                            'org_acme_base_MyBasicTransaction',
                            'org_acme_base_MyTransaction',
                            'org_acme_base_MyTransactionEx',
                            'org_acme_base_Person',
                            'org_acme_base_Bloke',
                            'org_acme_base_UnitedStatesAddress'
                        ];
                    } else {
                        expectedFiles = [
                            'SimpleAsset.json',
                            'BaseAsset.json',
                            'DerivedAsset.json',
                            'DerivedDerivedAsset.json',
                            'MyBasicTransaction.json',
                            'MyTransactionEx.json',
                            'Person.json',
                            'Bloke.json',
                            'UnitedStatesAddress.json'
                        ];
                        expectedTypes = [
                            'SimpleAsset',
                            'BaseAsset',
                            'DerivedAsset',
                            'DerivedDerivedAsset',
                            'MyBasicTransaction',
                            'MyTransactionEx',
                            'Person',
                            'Bloke',
                            'UnitedStatesAddress'
                        ];
                    }
                    // For every element of the expected files, does the schema array contain it?
                    expectedTypes.filter((elem) => {
                        return schemas.some((s) => { return s.name === elem; });

                    }).should.have.lengthOf(expectedFiles.length);

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
                    let expectedFiles;
                    if (namespaces) {
                        expectedFiles = [
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
                    } else {
                        expectedFiles = [
                            'SimpleAsset.json',
                            'BaseAsset.json',
                            'DerivedAsset.json',
                            'DerivedDerivedAsset.json',
                            'MyBasicTransaction.json',
                            'MyTransaction.json',
                            'MyTransactionEx.json',
                            'Person.json',
                            'Bloke.json',
                            'UnitedStatesAddress.json'
                        ];
                    }
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
                        name: namespaces ? 'org_acme_MyAsset' : 'MyAsset',
                        options: {
                            composer: {
                                type: 'asset',
                                namespace: 'org.acme',
                                name: 'MyAsset',
                                fqn: 'org.acme.MyAsset'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyAsset' : 'MyAsset',
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
                        name: namespaces ? 'org_acme_MyBaseAsset' : 'MyBaseAsset',
                        options: {
                            composer: {
                                type: 'asset',
                                namespace: 'org.acme',
                                name: 'MyBaseAsset',
                                fqn: 'org.acme.MyBaseAsset'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyBaseAsset' : 'MyBaseAsset',
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
                        name: namespaces ? 'org_acme_MyAsset' : 'MyAsset',
                        options: {
                            composer: {
                                type: 'asset',
                                namespace: 'org.acme',
                                name: 'MyAsset',
                                fqn: 'org.acme.MyAsset'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyAsset' : 'MyAsset',
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
                        name: namespaces ? 'org_acme_MyAsset' : 'MyAsset',
                        options: {
                            composer: {
                                type: 'asset',
                                namespace: 'org.acme',
                                name: 'MyAsset',
                                fqn: 'org.acme.MyAsset'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyAsset' : 'MyAsset',
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
                        name: namespaces ? 'org_acme_MyParticipant' : 'MyParticipant',
                        options: {
                            composer: {
                                type: 'participant',
                                namespace: 'org.acme',
                                name: 'MyParticipant',
                                fqn: 'org.acme.MyParticipant'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyParticipant' : 'MyParticipant',
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
                        name: namespaces ? 'org_acme_MyBaseParticipant' : 'MyBaseParticipant',
                        options: {
                            composer: {
                                type: 'participant',
                                namespace: 'org.acme',
                                name: 'MyBaseParticipant',
                                fqn: 'org.acme.MyBaseParticipant'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyBaseParticipant' : 'MyBaseParticipant',
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
                        name: namespaces ? 'org_acme_MyParticipant' : 'MyParticipant',
                        options: {
                            composer: {
                                type: 'participant',
                                namespace: 'org.acme',
                                name: 'MyParticipant',
                                fqn: 'org.acme.MyParticipant'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyParticipant' : 'MyParticipant',
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
                        name: namespaces ? 'org_acme_MyParticipant' : 'MyParticipant',
                        options: {
                            composer: {
                                type: 'participant',
                                namespace: 'org.acme',
                                name: 'MyParticipant',
                                fqn: 'org.acme.MyParticipant'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyParticipant' : 'MyParticipant',
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

                // TODO: Added a timestamp here as that is now added most model parse...
                // when System models are ready remove this.
                // GITHUB: composer/issues/920
                it('should generate a schema for a transaction with just an identifier', () => {
                    const modelFile = new ModelFile(modelManager, `
                    namespace org.acme
                    transaction MyTransaction{
                    }
                    `);
                    const schemas = modelFile.accept(visitor, { fileWriter: mockFileWriter });
                    schemas.should.deep.equal([{
                        acls: [],
                        base: 'PersistedModel',
                        description: 'A transaction named MyTransaction',
                        forceId: true,
                        idInjection: false,
                        methods: [],
                        name: namespaces ? 'org_acme_MyTransaction' : 'MyTransaction',
                        options: {
                            composer: {
                                type: 'transaction',
                                namespace: 'org.acme',
                                name: 'MyTransaction',
                                fqn: 'org.acme.MyTransaction'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyTransaction' : 'MyTransaction',
                        properties: {
                            $class: {
                                default: 'org.acme.MyTransaction',
                                description: 'The class identifier for this type',
                                required: false,
                                type: 'string'
                            },
                            timestamp: {
                                required: false,
                                type: 'date'
                            },
                            transactionId: {
                                description: 'The instance identifier for this type',
                                id: true,
                                generated: true,
                                required: false,
                                type: 'string'
                            }
                        },
                        relations: {},
                        validations: []
                    }]);
                });


                // TODO: Added a timestamp here as that is now added most model parse...
                // when System models are ready remove this.
                // GITHUB: composer/issues/920
                it('should generate two schemas for a transaction that extends another transaction', () => {
                    const modelFile = new ModelFile(modelManager, `
                    namespace org.acme
                    transaction MyBaseTransaction {
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
                        forceId: true,
                        idInjection: false,
                        methods: [],
                        name: namespaces ? 'org_acme_MyBaseTransaction' : 'MyBaseTransaction',
                        options: {
                            composer: {
                                type: 'transaction',
                                namespace: 'org.acme',
                                name: 'MyBaseTransaction',
                                fqn: 'org.acme.MyBaseTransaction'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyBaseTransaction' : 'MyBaseTransaction',
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
                                generated: true,
                                required: false,
                                type: 'string'
                            },
                            timestamp: {
                                required: false,
                                type: 'date'
                            }
                        },
                        relations: {},
                        validations: []
                    }, {
                        acls: [],
                        base: 'PersistedModel',
                        description: 'A transaction named MyTransaction',
                        forceId: true,
                        idInjection: false,
                        methods: [],
                        name: namespaces ? 'org_acme_MyTransaction' : 'MyTransaction',
                        options: {
                            composer: {
                                type: 'transaction',
                                namespace: 'org.acme',
                                name: 'MyTransaction',
                                fqn: 'org.acme.MyTransaction'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyTransaction' : 'MyTransaction',
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
                                generated: true,
                                required: false,
                                type: 'string'
                            },
                            timestamp: {
                                required: false,
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

                // TODO: Added a timestamp here as that is now added most model parse...
                // when System models are ready remove this.
                // GITHUB: composer/issues/920
                it('should generate one schema for a transaction that extends an abstract transaction', () => {
                    const modelFile = new ModelFile(modelManager, `
                    namespace org.acme
                    abstract transaction MyBaseTransaction {
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
                        forceId: true,
                        idInjection: false,
                        methods: [],
                        name: namespaces ? 'org_acme_MyTransaction' : 'MyTransaction',
                        options: {
                            composer: {
                                type: 'transaction',
                                namespace: 'org.acme',
                                name: 'MyTransaction',
                                fqn: 'org.acme.MyTransaction'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyTransaction' : 'MyTransaction',
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
                                generated: true,
                                required: false,
                                type: 'string'
                            },
                            timestamp: {
                                required: false,
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
                        name: namespaces ? 'org_acme_MyConcept' : 'MyConcept',
                        options: {
                            composer: {
                                type: 'concept',
                                namespace: 'org.acme',
                                name: 'MyConcept',
                                fqn: 'org.acme.MyConcept'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyConcept' : 'MyConcept',
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
                        name: namespaces ? 'org_acme_MyBaseConcept' : 'MyBaseConcept',
                        options: {
                            composer: {
                                type: 'concept',
                                namespace: 'org.acme',
                                name: 'MyBaseConcept',
                                fqn: 'org.acme.MyBaseConcept'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyBaseConcept' : 'MyBaseConcept',
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
                        name: namespaces ? 'org_acme_MyConcept' : 'MyConcept',
                        options: {
                            composer: {
                                type: 'concept',
                                namespace: 'org.acme',
                                name: 'MyConcept',
                                fqn: 'org.acme.MyConcept'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyConcept' : 'MyConcept',
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
                    schemas.should.deep.include.members([{
                        acls: [],
                        // base: 'PersistedModel',
                        description: 'A concept named MyConcept',
                        idInjection: false,
                        methods: [],
                        name: namespaces ? 'org_acme_MyConcept' : 'MyConcept',
                        options: {
                            composer: {
                                type: 'concept',
                                namespace: 'org.acme',
                                name: 'MyConcept',
                                fqn: 'org.acme.MyConcept'
                            },
                            validateUpsert: true
                        },
                        plural: namespaces ? 'org.acme.MyConcept' : 'MyConcept',
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

                it('should use the model file of the referencing type to resolve enumeration types', () => {
                    modelManager.updateModelFile(`
                    namespace org.acme.base
                    enum Enum {
                        o SOME_VALUE
                        o SOME_OTHER_VALUE
                    }
                    asset MyAsset identified by assetId {
                        o String assetId
                        o Enum value
                    }`);
                    modelManager.addModelFile(`
                    namespace org.acme.ext
                    import org.acme.base.MyAsset
                    asset MyOtherAsset identified by assetId {
                        o String assetId
                        o MyAsset asset
                    }`);
                    const schemas = modelManager.accept(visitor, { fileWriter: mockFileWriter });
                    schemas.should.deep.include.members([
                        {
                            name: namespaces ? 'org_acme_base_MyAsset' : 'MyAsset',
                            description: 'An asset named MyAsset',
                            plural: namespaces ? 'org.acme.base.MyAsset' : 'MyAsset',
                            base: 'PersistedModel',
                            idInjection: false,
                            options: {
                                validateUpsert: true,
                                composer: {
                                    type: 'asset',
                                    namespace: 'org.acme.base',
                                    name: 'MyAsset',
                                    fqn: 'org.acme.base.MyAsset'
                                }
                            },
                            properties: {
                                $class: {
                                    type: 'string',
                                    default: 'org.acme.base.MyAsset',
                                    required: false,
                                    description: 'The class identifier for this type'
                                },
                                assetId: {
                                    type: 'string',
                                    id: true,
                                    description: 'The instance identifier for this type',
                                    required: true
                                },
                                value: {
                                    type: 'string',
                                    required: true,
                                    enum: [
                                        'SOME_VALUE',
                                        'SOME_OTHER_VALUE'
                                    ]
                                }
                            },
                            validations: [],
                            relations: {},
                            acls: [],
                            methods: []
                        },
                        {
                            name: namespaces ? 'org_acme_ext_MyOtherAsset' : 'MyOtherAsset',
                            description: 'An asset named MyOtherAsset',
                            plural: namespaces ? 'org.acme.ext.MyOtherAsset' : 'MyOtherAsset',
                            base: 'PersistedModel',
                            idInjection: false,
                            options: {
                                validateUpsert: true,
                                composer: {
                                    type: 'asset',
                                    namespace: 'org.acme.ext',
                                    name: 'MyOtherAsset',
                                    fqn: 'org.acme.ext.MyOtherAsset'
                                }
                            },
                            properties: {
                                $class: {
                                    type: 'string',
                                    default: 'org.acme.ext.MyOtherAsset',
                                    required: false,
                                    description: 'The class identifier for this type'
                                },
                                assetId: {
                                    type: 'string',
                                    id: true,
                                    description: 'The instance identifier for this type',
                                    required: true
                                },
                                asset: {
                                    type: namespaces ? 'org_acme_base_MyAsset' : 'MyAsset',
                                    required: true
                                }
                            },
                            validations: [],
                            relations: {},
                            acls: [],
                            methods: []
                        }
                    ]);
                });

                it('should use the model file of the referencing type to resolve other types', () => {
                    modelManager.updateModelFile(`
                    namespace org.acme.base
                    asset MyInlineAsset identified by assetId {
                        o String assetId
                    }
                    asset MyAsset identified by assetId {
                        o String assetId
                        o MyInlineAsset value
                    }`);
                    modelManager.addModelFile(`
                    namespace org.acme.ext
                    import org.acme.base.MyAsset
                    asset MyOtherAsset identified by assetId {
                        o String assetId
                        o MyAsset asset
                    }`);
                    const schemas = modelManager.accept(visitor, { fileWriter: mockFileWriter });


                    schemas.should.include.deep.members([
                        {
                            name: namespaces ? 'org_acme_base_MyInlineAsset' : 'MyInlineAsset',
                            description: 'An asset named MyInlineAsset',
                            plural: namespaces ? 'org.acme.base.MyInlineAsset' : 'MyInlineAsset',
                            base: 'PersistedModel',
                            idInjection: false,
                            options: {
                                validateUpsert: true,
                                composer: {
                                    type: 'asset',
                                    namespace: 'org.acme.base',
                                    name: 'MyInlineAsset',
                                    fqn: 'org.acme.base.MyInlineAsset'
                                }
                            },
                            properties: {
                                $class: {
                                    type: 'string',
                                    default: 'org.acme.base.MyInlineAsset',
                                    required: false,
                                    description: 'The class identifier for this type'
                                },
                                assetId: {
                                    type: 'string',
                                    id: true,
                                    description: 'The instance identifier for this type',
                                    required: true
                                }
                            },
                            validations: [],
                            relations: {},
                            acls: [],
                            methods: []
                        },
                        {
                            name: namespaces ? 'org_acme_base_MyAsset' : 'MyAsset',
                            description: 'An asset named MyAsset',
                            plural: namespaces ? 'org.acme.base.MyAsset' : 'MyAsset',
                            base: 'PersistedModel',
                            idInjection: false,
                            options: {
                                validateUpsert: true,
                                composer: {
                                    type: 'asset',
                                    namespace: 'org.acme.base',
                                    name: 'MyAsset',
                                    fqn: 'org.acme.base.MyAsset'
                                }
                            },
                            properties: {
                                $class: {
                                    type: 'string',
                                    default: 'org.acme.base.MyAsset',
                                    required: false,
                                    description: 'The class identifier for this type'
                                },
                                assetId: {
                                    type: 'string',
                                    id: true,
                                    description: 'The instance identifier for this type',
                                    required: true
                                },
                                value: {
                                    type: namespaces ? 'org_acme_base_MyInlineAsset' : 'MyInlineAsset',
                                    required: true
                                }
                            },
                            validations: [],
                            relations: {},
                            acls: [],
                            methods: []
                        },
                        {
                            name: namespaces ? 'org_acme_ext_MyOtherAsset' : 'MyOtherAsset',
                            description: 'An asset named MyOtherAsset',
                            plural: namespaces ? 'org.acme.ext.MyOtherAsset' : 'MyOtherAsset',
                            base: 'PersistedModel',
                            idInjection: false,
                            options: {
                                validateUpsert: true,
                                composer: {
                                    type: 'asset',
                                    namespace: 'org.acme.ext',
                                    name: 'MyOtherAsset',
                                    fqn: 'org.acme.ext.MyOtherAsset'
                                }
                            },
                            properties: {
                                $class: {
                                    type: 'string',
                                    default: 'org.acme.ext.MyOtherAsset',
                                    required: false,
                                    description: 'The class identifier for this type'
                                },
                                assetId: {
                                    type: 'string',
                                    id: true,
                                    description: 'The instance identifier for this type',
                                    required: true
                                },
                                asset: {
                                    type: namespaces ? 'org_acme_base_MyAsset' : 'MyAsset',
                                    required: true
                                }
                            },
                            validations: [],
                            relations: {},
                            acls: [],
                            methods: []
                        }
                    ]);
                });

            });

        });

    });

});
