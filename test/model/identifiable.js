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
const fs = require('fs');
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

        it('should be able to set identifier', function () {
            let mozartModel = fs.readFileSync('./test/data/model/mozart.cto', 'utf8');
            modelManager.addModelFile(mozartModel);
            // let modelFile = modelManager.getModelFile('com.ibm.concerto.mozart');
            let id = new Identifiable(modelManager, 'com.ibm.concerto.mozart', 'Farmer', '123' );
            id.setIdentifier('321');
            id.getIdentifier().should.equal('321');

        });
        it('should be able to accept visitor', function () {
            const id = new Identifiable(modelManager, 'org.acme', 'Type', '123' );
            const visitor = {visit: function(obj,parameters){console.log();}};
            const spy = sinon.spy(visitor, 'visit');
            id.accept(visitor, {});
            spy.calledOnce.should.be.true;
        });
    });
});
