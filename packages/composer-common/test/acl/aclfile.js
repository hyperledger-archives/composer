/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
    const invalidAcl = fs.readFileSync(path.resolve(__dirname, './invalid.acl'), 'utf8');
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
            let aclFile1 = new AclFile( 'test', modelManager, testAcl);
            let json = JSON.stringify(aclFile1);
            let aclFile2 = AclFile.fromJSON(modelManager, JSON.parse(json));
            aclFile2.should.deep.equal(aclFile1);
            aclFile1.getIdentifier().should.equal(aclFile2.getIdentifier());
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
                new AclFile( 'test', modelManager, [{}]);
            }).should.throw(/as a string as input/);
        });

        it('should call the parser with the definitions and save the abstract syntax tree', () => {
            const ast = {
                rules: [ {id: {name: 'fake'}, noun: 'org.acme', verb: 'UPDATE', participant: 'EVERYONE', action: 'ALLOW'} ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let mf = new AclFile( 'test', modelManager, 'fake definitions');
            mf.ast.should.equal(ast);
        });

        it('should throw a ParseException on invalid input', () => {
            (() => {
                new AclFile('test.acl', modelManager, invalidAcl);
            }).should.throw(/Line 5/);
        });

        it('should throw an error if it does not have a location', () => {
            (() => {
                sandbox.stub(parser, 'parse').throws(new Error('such error'));
                new AclFile('test.acl', modelManager, invalidAcl);
            }).should.throw(/such error/);
        });
    });

    describe('#constructor', () => {

        it('should parse correctly and preserve order', () => {
            const aclFile = new AclFile('test.acl', modelManager, testAcl);
            aclFile.getAclRules().length.should.equal(7);
            aclFile.getDefinitions().should.equal(testAcl);

            const r1 = aclFile.getAclRules()[0];
            const r2 = aclFile.getAclRules()[1];
            const r3 = aclFile.getAclRules()[2];
            const r4 = aclFile.getAclRules()[3];
            const r5 = aclFile.getAclRules()[4];
            const r6 = aclFile.getAclRules()[5];
            const r7 = aclFile.getAclRules()[6];

            // check names
            r1.getName().should.equal('R1');
            r2.getName().should.equal('R2');
            r3.getName().should.equal('R3');
            r4.getName().should.equal('R4');
            r5.getName().should.equal('R5');
            r6.getName().should.equal('R6');
            r7.getName().should.equal('R7');

            // check nouns
            console.log('**** ' + JSON.stringify(r1));
            r1.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r1.getNoun().getInstanceIdentifier().should.equal('ABC123');
            r2.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r3.getNoun().getFullyQualifiedName().should.equal('org.acme.Car.owner');
            r4.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r5.getNoun().getFullyQualifiedName().should.equal('org.acme');
            r6.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r7.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');

            // check verbs
            r1.getVerb().should.equal('DELETE');
            r2.getVerb().should.equal('UPDATE');
            r3.getVerb().should.equal('UPDATE');
            r4.getVerb().should.equal('ALL');
            r5.getVerb().should.equal('READ');
            r6.getVerb().should.equal('ALL');
            r7.getVerb().should.equal('ALL');

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
            (r6.getParticipant() === null).should.be.true;
            (r7.getParticipant() === null).should.be.true;

            // check transactions
            (r1.getTransaction() === null).should.be.true;
            (r2.getTransaction() === null).should.be.true;
            (r3.getTransaction() === null).should.be.true;
            (r4.getTransaction() === null).should.be.true;
            (r5.getTransaction() === null).should.be.true;
            r6.getTransaction().getFullyQualifiedName().should.equal('org.acme.Transaction');
            (r6.getTransaction().getVariableName() === null).should.be.true;
            r7.getTransaction().getFullyQualifiedName().should.equal('org.acme.Transaction');
            r7.getTransaction().getVariableName().should.equal('tx');

            // check predicates
            r1.getPredicate().getExpression().should.equal('true');
            r2.getPredicate().getExpression().should.equal('c.owner == r');
            r3.getPredicate().getExpression().should.equal('o == d');
            r4.getPredicate().getExpression().should.equal('true');
            r5.getPredicate().getExpression().should.equal('true');
            r6.getPredicate().getExpression().should.equal('true');
            r7.getPredicate().getExpression().should.equal('tx.asset.colour === \'blue\'');

            // check action
            r1.getAction().should.equal('ALLOW');
            r2.getAction().should.equal('DENY');
            r3.getAction().should.equal('ALLOW');
            r4.getAction().should.equal('ALLOW');
            r5.getAction().should.equal('ALLOW');
            r6.getAction().should.equal('ALLOW');
            r7.getAction().should.equal('ALLOW');

            // check the description
            r1.getDescription().should.equal('Fred can DELETE the car ABC123');
            r2.getDescription().should.equal('regulator with ID Bill can not update a Car if they own it');
            r3.getDescription().should.equal('Driver can change the ownership of a car that they own');
            r4.getDescription().should.equal('regulators can perform all operations on Cars');
            r5.getDescription().should.equal('Everyone can read all resources in the org.acme namespace');
            r6.getDescription().should.equal('Drivers can do something in a org.acme.Transaction transaction');
            r7.getDescription().should.equal('Regulators can do something in a org.acme.Transaction transaction');
        });
    });

    describe('#validate', () => {

        it('should validate correct contents', () => {
            const aclFile = new AclFile( 'test', modelManager, testAcl);
            aclFile.validate();
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let aclFile = new AclFile('test.acl', modelManager, testAcl);
            let visitor = {
                visit: sinon.stub()
            };
            aclFile.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, aclFile, ['some', 'args']);
        });

    });
});
