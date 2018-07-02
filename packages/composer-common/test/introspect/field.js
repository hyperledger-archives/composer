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
const Field = require('../../lib/introspect/field');
const ModelFile = require('../../lib/introspect/modelfile');

const should = require('chai').should();
const sinon = require('sinon');

describe('Field', () => {

    let mockClassDeclaration;
    let mockModelFile;

    beforeEach(() => {
        mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
        mockModelFile = sinon.createStubInstance(ModelFile);
        mockClassDeclaration.getModelFile.returns(mockModelFile);
    });

    describe('#constructor', () => {

        it('should not have a validator by default', () => {
            let f = new Field(mockClassDeclaration, {
                id: {
                    name: 'field',
                }
            });
            should.equal(f.validator, null);
        });

        it('should save the incoming validator', () => {

            let f = new Field(mockClassDeclaration, {
                id: {
                    name: 'field',
                },
                propertyType: {
                    name: 'String'
                },
                regex: 'suchValidator'
            });
            f.getValidator().validate('id', 'suchValidator');
        });

        it('should not have a default value by default', () => {
            let f = new Field(mockClassDeclaration, {
                id: {
                    name: 'field',
                }
            });
            should.equal(f.defaultValue, null);
        });

        it('should save the incoming default value', () => {
            let f = new Field(mockClassDeclaration, {
                id: {
                    name: 'field',
                }, default: 'wowSuchDefault'
            });
            f.defaultValue.should.equal('wowSuchDefault');
        });

        it('should not be optional by default', () => {
            let f = new Field(mockClassDeclaration, {
                id: {
                    name: 'field',
                }
            });
            f.optional.should.equal(false);
        });

        it('should detect if field is optional', () => {
            let f = new Field(mockClassDeclaration, {
                id: {
                    name: 'field',
                },
                optional: true
            });
            f.optional.should.equal(true);
        });

    });

    describe('#toString',()=>{
        it('regular toString',()=>{
            let f = new Field(mockClassDeclaration, {
                id: {
                    name: 'field',
                }
            });
            let stub = sinon.stub(f,'getFullyQualifiedTypeName');
            stub.returns('fqn');
            f.toString().should.equal('Field {name=field, type=fqn, array=false, optional=false}');
        });

    });

});
