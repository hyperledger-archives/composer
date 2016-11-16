/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const ClassDeclaration = require('../../lib/introspect/classdeclaration');
const Field = require('../../lib/introspect/field');

const should = require('chai').should();
const sinon = require('sinon');

describe('Field', () => {

    let mockClassDeclaration;

    beforeEach(() => {
        mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
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
                }, validator: {
                    text: {
                        value: 'suchValidator'
                    }
                }
            });
            f.validator.should.equal('suchValidator');
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
                }, default: {
                    text: {
                        value: 'wowSuchDefault'
                    }
                }
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

    describe('#toJSON', () => {

        it('should return a JSON object suitable for serialization', () => {
            let f = new Field(mockClassDeclaration, {
                id: {
                    name: 'field',
                },
                propertyType: {
                    name: 'suchType'
                },
                array: true,
                validator: {
                    text: {
                        value: 'suchValidator'
                    }
                }, default: {
                    text: {
                        value: 'wowSuchDefault'
                    }
                },
                optional: true
            });
            let object = f.toJSON();
            object.name.should.equal('field');
            object.type.should.equal('suchType');
            object.array.should.equal(true);
            object.enum.should.equal(false);
            object.validator.should.equal('suchValidator');
            object.defaultValue.should.equal('wowSuchDefault');
            object.optional.should.equal(true);
        });

    });

});
