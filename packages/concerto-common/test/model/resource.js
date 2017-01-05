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
const Resource = require('../../lib/model/resource');
const sinon = require('sinon');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

describe('Resource', function () {

    const levelOneModel = `namespace org.acme.l1
  participant Person identified by ssn {
    o String ssn
  }
  asset Car identified by vin {
    o String vin
    -->Person owner
  }
  `;

    let modelManager = null;

    before(function () {
        modelManager = new ModelManager();
    });

    beforeEach(function () {
        modelManager.addModelFile(levelOneModel);
    });

    afterEach(function () {
        modelManager.clearModelFiles();
    });

    describe('#getClassDeclaration', function() {
        it('should throw with no ModelFile', function () {
            const resource = new Resource(modelManager, 'org.acme.l1', 'Person', '123' );
            const stub = sinon.stub(modelManager, 'getModelFile', function(){return null;});
            (function () {
                resource.getClassDeclaration();
            }).should.throw(/No model for namespace org.acme.l1 is registered with the ModelManager/);
            stub.restore();
        });
        it('should throw with no type', function () {
            const resource = new Resource(modelManager, 'org.acme.l1', 'Person', '123' );
            const modelFile = modelManager.getModelFile('org.acme.l1');
            const stub = sinon.stub(modelFile, 'getType', function(type){return null;});
            (function () {
                resource.getClassDeclaration();
            }).should.throw(/The namespace org.acme.l1 does not contain the type Person/);
            stub.restore();
        });
    });

    describe('#toJSON', () => {
        it('should throw is toJSON is called', function () {
            const resource = new Resource(modelManager, 'org.acme.l1', 'Person', '123' );
            (function () {
                resource.toJSON();
            }).should.throw(/Use Serializer.toJSON to convert resource instances to JSON objects./);
        });
    });
});
