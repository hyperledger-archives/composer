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
const StringValidator = require('../../lib/introspect/stringvalidator');

require('chai').should();
const sinon = require('sinon');

describe('StringValidator', () => {

    let mockField;

    beforeEach(() => {
        mockField = sinon.createStubInstance(Field);
        mockField.getFullyQualifiedName.returns('org.acme.myField');
    });

    describe('#validate', () => {

        it('should validate', () => {
            let v = new StringValidator(mockField, '/^[A-z][A-z][0-9]{7}/' );
            v.validate('id', 'AB1234567');
        });

        it('should detect mismatch string', () => {
            let v = new StringValidator(mockField, '/^[A-z][A-z][0-9]{7}/');

            (() => {
                v.validate('id', 'xyz');
            }).should.throw(/Invalid validator for field id org.acme.myField/);
        });
    });
});
