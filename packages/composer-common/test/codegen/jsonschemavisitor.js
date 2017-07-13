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

const Ajv = require('ajv');
const FileWriter = require('../../lib/codegen/filewriter');
const fs = require('fs');
const JSONSchemaVisitor = require('../../lib/codegen/fromcto/jsonschema/jsonschemavisitor');
const ModelManager = require('../../lib/modelmanager');
const path = require('path');

require('chai').should();
const sinon = require('sinon');

describe('JSONSchemaVisitor', () => {

    let ajv;
    let mockFileWriter;
    let modelManager;
    let visitor;

    let sandbox;

    beforeEach(() => {
        ajv = new Ajv();
        mockFileWriter = sinon.createStubInstance(FileWriter);
        modelManager = new ModelManager();
        modelManager.addModelFile(fs.readFileSync(path.resolve(__dirname, '../data/model/model-base.cto'), 'utf8'), 'model-base.cto');
        visitor = new JSONSchemaVisitor();
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

        it('should generate JSON Schema v4 files for each type in the Concerto model', () => {

            // Visit all of the loaded model files.
            modelManager.accept(visitor, { fileWriter: mockFileWriter });

            // Check that the JSON Schema files were generated, and extract the
            // generated schemas from the stub writer.
            const expectedFiles = [
                'org.acme.base.SimpleAsset.json',
                'org.acme.base.BaseAsset.json',
                'org.acme.base.DerivedAsset.json',
                'org.acme.base.DerivedDerivedAsset.json',
                'org.acme.base.MyBasicTransaction.json',
                'org.acme.base.MyTransaction.json',
                'org.acme.base.MyTransactionEx.json',
                'org.acme.base.UnitedStatesAddress.json'
            ];

            let jsonSchemas = {};

            expectedFiles.forEach((expectedFile) => {
                sinon.assert.calledWith(mockFileWriter.openFile, expectedFile);
                for (let x = 0; x < mockFileWriter.write.callCount; x++) {
                    if (mockFileWriter.openFile.getCall(x).calledWith(expectedFile)) {
                        jsonSchemas[expectedFile] = JSON.parse(mockFileWriter.write.getCall(x).args[0]);
                    }
                }
            });

            // Valid instances.
            const validInstances = {
                'org.acme.base.SimpleAsset.json': {
                    $class: 'org.acme.base.SimpleAsset',
                    stringProperty: 'hello world'
                },
                'org.acme.base.BaseAsset.json': {
                    $class: 'org.acme.base.BaseAsset',
                    stringProperty: 'hello world',
                    integerProperty: 16384,
                    booleanProperty: false,
                    dateTimeProperty: '2008-09-15T15:53:00Z',
                    stringArrayProperty: ['hello', 'world'],
                    doubleArrayProperty: [3.142, 6.789],
                    stateArrayProperty: ['GOLD', 'BRONZE'],
                    singlePerson: 'PERSON1',
                    personArray: ['PERSON2', 'PERSON3'],
                    myPeople: [{
                        stringProperty: 'person1',
                        address: {
                            $class: 'org.acme.base.UnitedStatesAddress',
                            zipcode: 'CA',
                            street: 'Test',
                            city : 'Winchester',
                            country : 'USA'
                        }
                    }, {
                        stringProperty: 'person2',
                        address: {
                            $class: 'org.acme.base.UnitedStatesAddress',
                            zipcode: 'CA',
                            street: 'Test',
                            city : 'Winchester',
                            country : 'USA'
                        }
                    }]
                },
                'org.acme.base.DerivedAsset.json': {
                    $class: 'org.acme.base.DerivedAsset',
                    stringProperty: 'hello world',
                    singlePerson: 'PERSON1',
                    personArray: ['PERSON2', 'PERSON3'],
                    anotherStringProperty: 'some other string'
                },
                'org.acme.base.DerivedDerivedAsset.json': {
                    $class: 'org.acme.base.DerivedDerivedAsset',
                    stringProperty: 'hello world',
                    singlePerson: 'PERSON1',
                    personArray: ['PERSON2', 'PERSON3'],
                    anotherStringProperty: 'some other string',
                    includedTransaction: {
                        transactionId: 'transaction1',
                        timestamp: new Date().toISOString()
                    },
                    originalTransaction: 'transaction1'
                },
                'org.acme.base.MyBasicTransaction.json': {
                    $class: 'org.acme.base.MyBasicTransaction',
                    transactionId: 'transaction1',
                    timestamp: new Date().toISOString()
                },
                'org.acme.base.MyTransaction.json': {
                    $class: 'org.acme.base.MyTransaction',
                    myAsset: {
                        stringProperty: 'hello world',
                        singlePerson: 'PERSON1',
                        personArray: ['PERSON2', 'PERSON3']
                    },
                    transactionId: 'transaction1',
                    timestamp: new Date().toISOString()
                },
                'org.acme.base.MyTransactionEx.json': {
                    $class: 'org.acme.base.MyTransactionEx',
                    myAsset: {
                        stringProperty: 'hello world',
                        singlePerson: 'PERSON1',
                        personArray: ['PERSON2', 'PERSON3']
                    },
                    anotherBaseAsset: {
                        stringProperty: 'howdy earth',
                        singlePerson: 'PERSON4',
                        personArray: ['PERSON5', 'PERSON6']
                    },
                    arrayOfBaseAssets: [{
                        stringProperty: 'hola mundo',
                        singlePerson: 'PERSON7',
                        personArray: ['PERSON8', 'PERSON9']
                    }, {
                        stringProperty: 'ciao mundo',
                        singlePerson: 'PERSONA',
                        personArray: ['PERSONB', 'PERSONC']
                    }],
                    transactionId: 'transaction2',
                    timestamp: new Date().toISOString()
                },
                'org.acme.base.UnitedStatesAddress.json' : {
                    $class: 'org.acme.base.UnitedStatesAddress',
                    zipcode: 'CA',
                    street: 'Test',
                    city : 'Winchester',
                    country : 'USA'
                }
            };

            // Iterate over the loaded JSON Schemas.
            for (let jsonSchema in jsonSchemas) {

                // Check it is valid with regards to the JSON Schema.
                let result = ajv.validate(jsonSchemas[jsonSchema], validInstances[jsonSchema]);
                if (!result) {
                    console.error('Error processing JSON Schema', jsonSchema);
                    console.error(ajv.errorsText());
                    console.error(jsonSchemas[jsonSchema]);
                    result.should.be.true;
                }

            }

        });

    });

});
