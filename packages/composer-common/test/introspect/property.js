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
const Property = require('../../lib/introspect/property');

const should = require('chai').should();
const sinon = require('sinon');

describe('Property', () => {

    let mockClassDeclaration;

    beforeEach(() => {
        mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
    });

    describe('#constructor', () => {

        it('throw an error for no name', () => {
            (() => {
                new Property(mockClassDeclaration, {
                    id: {
                        name: null
                    }
                });
            }).should.throw(/No name for type/);
        });

        it('should save the incoming property type', () => {
            let p = new Property(mockClassDeclaration, {
                id: {
                    name: 'property',
                }, propertyType: {
                    name: 'suchType'
                }
            });
            p.type.should.equal('suchType');
        });

        it('should handle a missing incoming property type', () => {
            let p = new Property(mockClassDeclaration, {
                id: {
                    name: 'property',
                }
            });
            should.equal(p.type, null);
        });

        it('should not be an array by default', () => {
            let p = new Property(mockClassDeclaration, {
                id: {
                    name: 'property',
                }
            });
            p.array.should.equal(false);
        });

        it('should mark as an array if required', () => {
            let p = new Property(mockClassDeclaration, {
                id: {
                    name: 'property',
                },
                array: true
            });
            p.array.should.equal(true);
        });

    });

});
