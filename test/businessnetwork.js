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

const BusinessNetwork = require('../lib/businessnetwork');

describe('BusinessNetwork', () => {
    let businessNetwork;

    beforeEach(() => {
        businessNetwork = new BusinessNetwork('id', 'description');
    });

    afterEach(() => {
    });

    describe('#accessors', () => {

        it('should be able to retrieve factory', () => {
            businessNetwork.getFactory().should.not.be.null;
        });

        it('should be able to retrieve introspector', () => {
            businessNetwork.getIntrospector().should.not.be.null;
        });

        it('should be able to retrieve serializer', () => {
            businessNetwork.getSerializer().should.not.be.null;
        });

        it('should be able to retrieve script manager', () => {
            businessNetwork.getScriptManager().should.not.be.null;
        });

        it('should be able to retrieve model manager', () => {
            businessNetwork.getModelManager().should.not.be.null;
        });

        it('should be able to retrieve identifier', () => {
            businessNetwork.getIdentifier().should.not.be.null;
        });

        it('should be able to retrieve description', () => {
            businessNetwork.getDescription().should.not.be.null;
        });
    });

    describe('#archives', () => {

        it('should be able to create business network', () => {
            BusinessNetwork.fromArchive(null).should.not.be.null;
        });

        it('should be able to store business network', () => {
            businessNetwork.toArchive(null);
        });
    });
});
