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

const Field = require('../../lib/introspect/field');
const NumberValidator = require('../../lib/introspect/numbervalidator');

require('chai').should();
const sinon = require('sinon');

describe('NumberValidator', () => {

    let mockField;

    beforeEach(() => {
        mockField = sinon.createStubInstance(Field);
        mockField.getFullyQualifiedName.returns('org.acme.myField');
    });

    describe('#constructor', () => {

        it('should store values', () => {
            let v = new NumberValidator(mockField, {lower: 10,upper: 20});
            v.lowerBound.should.equal(10);
            v.upperBound.should.equal(20);
        });

        it('should detect lower bound greater than upper bound', () => {

            (() => {
                new NumberValidator(mockField, {lower: 10,upper: 9});
            }).should.throw(/Lower bound must be less than or equal to upper bound/);
        });
    });

    describe('#validate', () => {

        it('should validate', () => {
            let v = new NumberValidator(mockField, {lower: 10,upper: 20});
            v.validate('id', 10);
            v.validate('id', 15);
            v.validate('id', 20);
        });

        it('should detect lower bound violation', () => {
            let v = new NumberValidator(mockField, {lower: 10,upper: 20});

            (() => {
                v.validate('id', 9);
            }).should.throw(/org.acme.myField: Value is outside lower bound 9/);
        });

        it('should detect upper bound violation', () => {
            let v = new NumberValidator(mockField, {lower: 10,upper: 20});

            (() => {
                v.validate('id', 21);
            }).should.throw(/org.acme.myField: Value is outside upper bound 21/);
        });

        it('should ignore missing upper bound', () => {
            let v = new NumberValidator(mockField, {lower: 10});
            v.validate('id', 21);

            (() => {
                v.validate('id', 9);
            }).should.throw(/org.acme.myField: Value is outside lower bound 9/);
        });

        it('should ignore missing lower bound', () => {
            let v = new NumberValidator(mockField, {upper: 20});
            v.validate('id', -1);

            (() => {
                v.validate('id', 21);
            }).should.throw(/org.acme.myField: Value is outside upper bound 21/);
        });
    });
});
