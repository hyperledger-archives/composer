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

const AclFile = require('../../lib/acl/aclfile');
const parser = require('../../lib/acl/parser');
const ModelManager = require('../../lib/modelmanager');
const fs = require('fs');
const path = require('path');

require('chai').should();
const sinon = require('sinon');

describe('AclFile', () => {

    const testAcl = fs.readFileSync(path.resolve(__dirname, './test.acl'), 'utf8');
    const testModel = fs.readFileSync(path.resolve(__dirname, './model.cto'), 'utf8');

    let modelManager;
    let sandbox;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(testModel);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#fromJSON', () => {

        it('should round trip the model file', () => {
            let modelFile1 = new AclFile(modelManager, testAcl);
            let json = JSON.stringify(modelFile1);
            let modelFile2 = AclFile.fromJSON(modelManager, JSON.parse(json));
            modelFile2.should.deep.equal(modelFile1);
        });

    });

    describe('#constructor', () => {

        it('should throw when null definitions provided', () => {
            (() => {
                new AclFile(modelManager, null);
            }).should.throw(/as a string as input/);
        });

        it('should throw when invalid definitions provided', () => {
            (() => {
                new AclFile(modelManager, [{}]);
            }).should.throw(/as a string as input/);
        });

        it('should call the parser with the definitions and save the abstract syntax tree', () => {
            const ast = {
                rules: [ {id: {name: 'fake'}, noun: 'org.acme', verb: 'UPDATE', participant: 'EVERYONE', action: 'ALLOW'} ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let mf = new AclFile(modelManager, 'fake definitions');
            mf.ast.should.equal(ast);
        });
    });

    describe('#constructor', () => {

        it('should parse correctly and preserve order', () => {
            const aclFile = new AclFile(modelManager, testAcl);
            aclFile.getAclRules().length.should.equal(5);
            aclFile.getDefinitions().should.equal(testAcl);

            const r1 = aclFile.getAclRules()[0];
            const r2 = aclFile.getAclRules()[1];
            const r3 = aclFile.getAclRules()[2];
            const r4 = aclFile.getAclRules()[3];
            const r5 = aclFile.getAclRules()[4];

            // check names
            r1.getName().should.equal('R1');
            r2.getName().should.equal('R2');
            r3.getName().should.equal('R3');
            r4.getName().should.equal('R4');
            r5.getName().should.equal('R5');

            // check nouns
            r1.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r1.getNoun().getInstanceIdentifier().should.equal('ABC123');
            r2.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r3.getNoun().getFullyQualifiedName().should.equal('org.acme.Car.owner');
            r4.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r5.getNoun().getFullyQualifiedName().should.equal('org.acme');

            // check verbs
            r1.getVerb().should.equal('DELETE');
            r2.getVerb().should.equal('UPDATE');
            r3.getVerb().should.equal('UPDATE');
            r4.getVerb().should.equal('ALL');
            r5.getVerb().should.equal('READ');

            // check participants
            r1.getParticipant().getFullyQualifiedName().should.equal('org.acme.Driver');
            r1.getParticipant().getInstanceIdentifier().should.equal('Fred');
            r2.getParticipant().getFullyQualifiedName().should.equal('org.acme.Regulator');
            r2.getParticipant().getInstanceIdentifier().should.equal('Bill');
            r2.getParticipant().getVariableName().should.equal('r');
            r3.getParticipant().getFullyQualifiedName().should.equal('org.acme.Driver');
            r3.getParticipant().getVariableName().should.equal('d');
            r4.getParticipant().getFullyQualifiedName().should.equal('org.acme.Regulator');
            (r4.getParticipant().getInstanceIdentifier() === null).should.be.true;
            (r4.getParticipant().getVariableName() === null).should.be.true;
            (r5.getParticipant() === null).should.be.true;

            // check predicates
            r1.getPredicate().getExpression().should.equal('true');
            r2.getPredicate().getExpression().should.equal('c.owner == r');
            r3.getPredicate().getExpression().should.equal('o == d');
            r4.getPredicate().getExpression().should.equal('true');
            r5.getPredicate().getExpression().should.equal('true');

            // check action
            r1.getAction().should.equal('ALLOW');
            r2.getAction().should.equal('DENY');
            r3.getAction().should.equal('ALLOW');
            r4.getAction().should.equal('ALLOW');
            r5.getAction().should.equal('ALLOW');

            // check the description
            r1.getDescription().should.equal('Fred can DELETE the car ABC123');
            r2.getDescription().should.equal('regulator with ID Bill can not update a Car if they own it');
            r3.getDescription().should.equal('Driver can change the ownership of a car that they own');
            r4.getDescription().should.equal('regulators can perform all operations on Cars');
            r5.getDescription().should.equal('Everyone can read all resources in the org.acme namespace');
        });
    });

    describe('#validate', () => {

        it('should validate correct contents', () => {
            const aclFile = new AclFile(modelManager, testAcl);
            aclFile.validate();
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let aclFile = new AclFile(modelManager, testAcl);
            let visitor = {
                visit: sinon.stub()
            };
            aclFile.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, aclFile, ['some', 'args']);
        });

    });
});
