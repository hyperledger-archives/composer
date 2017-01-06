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

const ModelManager = require('../../lib/modelmanager');
const Identifiable = require('../../lib/model/identifiable');
const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

describe    ('Identifiable', function () {

    let modelManager;
    before(function () {
        modelManager = new ModelManager();
    });

    beforeEach(function () {
    });

    afterEach(function () {
    });

    describe('#toString', function() {
        it('should be able to call toString', function () {
            const id = new Identifiable(modelManager, 'org.acme', 'Type', '123' );
            id.toString().should.equal('Identifiable {id=org.acme.Type#123}');
        });
    });

    describe('#setIdentifier', () => {
        it('should be able to set identifier', function () {
            modelManager.addModelFile(`namespace com.ibm.concerto.mozart
            participant Farmer identified by farmerId {
                o String farmerId
            }`);
            let id = new Identifiable(modelManager, 'com.ibm.concerto.mozart', 'Farmer', '123' );
            id.setIdentifier('321');
            id.getIdentifier().should.equal('321');
        });
    });

    describe('#accept', () => {
        it('should be able to accept visitor', function () {
            const id = new Identifiable(modelManager, 'org.acme', 'Type', '123' );
            const visitor = {visit: function(obj,parameters){}};
            const spy = sinon.spy(visitor, 'visit');
            id.accept(visitor, {});
            spy.calledOnce.should.be.true;
        });
    });

    describe('#toJSON', () => {
        it('should throw is toJSON is called', function () {
            const id = new Identifiable(modelManager, 'org.acme', 'Type', '123' );
            (function () {
                id.toJSON();
            }).should.throw(/Use Serializer.toJSON to convert resource instances to JSON objects./);
        });
    });

    describe('#isRelationship', () => {
        it('should be false', () => {
            const id = new Identifiable(modelManager, 'org.acme', 'Type', '123' );
            id.isRelationship().should.be.false;
        });
    });

    describe('#isResource', () => {
        it('should be false', () => {
            const id = new Identifiable(modelManager, 'org.acme', 'Type', '123' );
            id.isResource().should.be.false;
        });
    });
});
