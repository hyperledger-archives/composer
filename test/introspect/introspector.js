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
const Introspector = require('../../lib/introspect/introspector');

const fs = require('fs');

const chai = require('chai');
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('Introspector', () => {

    describe('#accept', () => {

        it('should call the visitor', () => {
            const introspector = new Introspector(null);
            let visitor = {
                visit: sinon.stub()
            };
            introspector.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, introspector, ['some', 'args']);
        });

    });

    describe('#getClassDeclarations', () => {

        it('should return all class declarations', () => {
            // create and populate the ModelManager with a model file
            const modelManager = new ModelManager();
            modelManager.should.not.be.null;

            let modelBase = fs.readFileSync('./test/data/model/model-base.cto', 'utf8');
            modelBase.should.not.be.null;

            modelManager.addModelFile(modelBase);
            const introspector = new Introspector(modelManager);
            introspector.getClassDeclarations().length.should.equal(11);
        });
    });

    describe('#getClassDeclaration', () => {

        it('should be able to get a single class declaration', () => {
            // create and populate the ModelManager with a model file
            const modelManager = new ModelManager();
            modelManager.should.not.be.null;

            let modelBase = fs.readFileSync('./test/data/model/model-base.cto', 'utf8');
            modelBase.should.not.be.null;

            modelManager.addModelFile(modelBase);
            const introspector = new Introspector(modelManager);
            introspector.getClassDeclaration('org.acme.base.Person').should.not.be.null;
        });
    });
});
