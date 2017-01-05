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
const sinon = require('sinon');
const RelationshipDeclaration = require('../../lib/introspect/relationshipdeclaration');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

describe('RelationshipDeclaration', function () {

    let modelManager;

    const levelOneModel = `namespace org.acme.l1
    participant Person identified by ssn {
      o String ssn
    }
    asset Car identified by vin {
      o String vin
      -->Person owner
    }
    `;

    before(function () {
        modelManager = new ModelManager();
    });

    beforeEach(function () {
        modelManager.addModelFile(levelOneModel);
    });

    afterEach(function () {
        modelManager.clearModelFiles();
    });

    describe('#validate', function() {
        it('should detect relationships with no type', function () {
            const vehicleDeclaration = modelManager.getType('org.acme.l1.Car');
            const field = vehicleDeclaration.getProperty('owner');
            (field instanceof RelationshipDeclaration).should.be.true;
          // stub the getType method to return null
            sinon.stub(field, 'getType', function(){return null;});
            (function () {
                field.validate(vehicleDeclaration);
            }).should.throw(/Relationship must have a type/);
        });
    });
});
