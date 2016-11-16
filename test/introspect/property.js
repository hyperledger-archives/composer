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

    describe('#toJSON', () => {

        it('should return a JSON object suitable for serialization', () => {
            let p = new Property(mockClassDeclaration, {
                id: {
                    name: 'property',
                },
                propertyType: {
                    name: 'suchType'
                },
                array: true
            });
            let object = p.toJSON();
            object.name.should.equal('property');
            object.type.should.equal('suchType');
            object.array.should.equal(true);
            object.enum.should.equal(false);
        });

    });

});
