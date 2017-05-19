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
                rules: [ {id: {name: 'fake'}, noun: 'org.acme', verbs: 'UPDATE', participant: 'EVERYONE', action: 'ALLOW'} ]
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

        it('should parse a rule correctly', () => {
            const aclContents = `rule R1 {
                description: "Fred can DELETE the car ABC123"
                participant: "org.acme.Driver#Fred"
                operation: DELETE
                resource: "org.acme.Car#ABC123"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r1 = aclFile.getAclRules()[0];
            r1.getName().should.equal('R1');
            r1.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r1.getNoun().getInstanceIdentifier().should.equal('ABC123');
            r1.getVerbs().should.deep.equal(['DELETE']);
            r1.getParticipant().getFullyQualifiedName().should.equal('org.acme.Driver');
            r1.getParticipant().getInstanceIdentifier().should.equal('Fred');
            (r1.getTransaction() === null).should.be.true;
            r1.getPredicate().getExpression().should.equal('true');
            r1.getAction().should.equal('ALLOW');
            r1.getDescription().should.equal('Fred can DELETE the car ABC123');
        });

        it('should parse a rule correctly', () => {
            const aclContents = `rule R2 {
                description: "regulator with ID Bill can not update a Car if they own it"
                participant(r): "org.acme.Regulator#Bill"
                operation: UPDATE
                resource(c): "org.acme.Car"
                condition: (c.owner == r)
                action: DENY
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r2 = aclFile.getAclRules()[0];
            r2.getName().should.equal('R2');
            r2.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r2.getVerbs().should.deep.equal(['UPDATE']);
            r2.getParticipant().getFullyQualifiedName().should.equal('org.acme.Regulator');
            r2.getParticipant().getInstanceIdentifier().should.equal('Bill');
            r2.getParticipant().getVariableName().should.equal('r');
        });

        it('should parse a rule correctly', () => {
            const aclContents = `rule R3 {
                description: "Driver can change the ownership of a car that they own"
                participant(d): "org.acme.Driver"
                operation: UPDATE
                resource(o): "org.acme.Car.owner"
                condition: (o == d)
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r3 = aclFile.getAclRules()[0];
            r3.getName().should.equal('R3');
            r3.getNoun().getFullyQualifiedName().should.equal('org.acme.Car.owner');
            r3.getVerbs().should.deep.equal(['UPDATE']);
            r3.getParticipant().getFullyQualifiedName().should.equal('org.acme.Driver');
            r3.getParticipant().getVariableName().should.equal('d');
            (r3.getTransaction() === null).should.be.true;
            r3.getPredicate().getExpression().should.equal('o == d');
            r3.getAction().should.equal('ALLOW');
            r3.getDescription().should.equal('Driver can change the ownership of a car that they own');
        });

        it('should parse a rule correctly', () => {
            const aclContents = `rule R4 {
                description: "regulators can perform all operations on Cars"
                participant: "org.acme.Regulator"
                operation: ALL
                resource: "org.acme.Car"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r4 = aclFile.getAclRules()[0];
            r4.getName().should.equal('R4');
            r4.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r4.getVerbs().should.deep.equal(['ALL']);
            r4.getParticipant().getFullyQualifiedName().should.equal('org.acme.Regulator');
            (r4.getParticipant().getInstanceIdentifier() === null).should.be.true;
            (r4.getParticipant().getVariableName() === null).should.be.true;
            (r4.getTransaction() === null).should.be.true;
            r4.getPredicate().getExpression().should.equal('true');
            r4.getAction().should.equal('ALLOW');
            r4.getDescription().should.equal('regulators can perform all operations on Cars');
        });

        it('should parse a rule correctly', () => {
            const aclContents = `rule R5 {
                description: "Everyone can read all resources in the org.acme namespace"
                participant: "ANY"
                operation: READ
                resource: "org.acme"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r5 = aclFile.getAclRules()[0];
            r5.getName().should.equal('R5');
            r5.getNoun().getFullyQualifiedName().should.equal('org.acme');
            r5.getVerbs().should.deep.equal(['READ']);
            (r5.getParticipant() === null).should.be.true;
            (r5.getTransaction() === null).should.be.true;
            r5.getPredicate().getExpression().should.equal('true');
            r5.getAction().should.equal('ALLOW');
            r5.getDescription().should.equal('Everyone can read all resources in the org.acme namespace');
        });

        it('should parse a rule correctly', () => {
            const aclContents = `rule R6 {
                description: "Drivers can do something in a org.acme.Transaction transaction"
                participant: "ANY"
                operation: ALL
                resource: "org.acme.Car"
                transaction: "org.acme.Transaction"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r6 = aclFile.getAclRules()[0];
            r6.getName().should.equal('R6');
            r6.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r6.getVerbs().should.deep.equal(['ALL']);
            (r6.getParticipant() === null).should.be.true;
            r6.getTransaction().getFullyQualifiedName().should.equal('org.acme.Transaction');
            (r6.getTransaction().getVariableName() === null).should.be.true;
            r6.getPredicate().getExpression().should.equal('true');
            r6.getAction().should.equal('ALLOW');
            r6.getDescription().should.equal('Drivers can do something in a org.acme.Transaction transaction');
        });

        it('should parse a rule correctly', () => {
            const aclContents = `rule R7 {
                description: "Regulators can do something in a org.acme.Transaction transaction"
                participant: "ANY"
                operation: ALL
                resource: "org.acme.Car"
                transaction(tx): "org.acme.Transaction"
                condition: (tx.asset.colour === 'blue')
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r7 = aclFile.getAclRules()[0];
            r7.getName().should.equal('R7');
            r7.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r7.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r7.getVerbs().should.deep.equal(['ALL']);
            (r7.getParticipant() === null).should.be.true;
            r7.getTransaction().getFullyQualifiedName().should.equal('org.acme.Transaction');
            r7.getTransaction().getVariableName().should.equal('tx');
            r7.getPredicate().getExpression().should.equal('tx.asset.colour === \'blue\'');
            r7.getAction().should.equal('ALLOW');
            r7.getDescription().should.equal('Regulators can do something in a org.acme.Transaction transaction');
        });

        it('should parse a rule correctly', () => {
            const aclContents = `rule R8 {
                description: "Fred can CREATE, READ, and UPDATE the car ABC123"
                participant: "org.acme.Driver#Fred"
                operation: CREATE, READ, UPDATE
                resource: "org.acme.Car#ABC123"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r8 = aclFile.getAclRules()[0];
            r8.getVerbs().should.deep.equal(['CREATE', 'READ', 'UPDATE']);
        });

        it('should parse a rule correctly', () => {
            const aclContents = `rule R9 {
                description: "regulator with ID Bill can not update or delete a Car if they own it"
                participant(r): "org.acme.Regulator#Bill"
                operation: UPDATE, DELETE
                resource(c): "org.acme.Car"
                condition: (c.owner == r)
                action: DENY
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r9 = aclFile.getAclRules()[0];
            r9.getVerbs().should.deep.equal(['UPDATE', 'DELETE']);
        });

        it('should fail to parse a rule with ALL and another verb', () => {
            const aclContents = `rule R9 {
                description: "regulator with ID Bill can not update or delete a Car if they own it"
                participant(r): "org.acme.Regulator#Bill"
                operation: ALL, DELETE
                resource(c): "org.acme.Car"
                condition: (c.owner == r)
                action: DENY
            }`;
            (() => {
                new AclFile('test.acl', modelManager, aclContents);
            }).should.throw(/Expected.*but.*found/);
        });

        it('should fail to parse a rule with duplicate verbs', () => {
            const aclContents = `rule R9 {
                description: "regulator with ID Bill can not update or delete a Car if they own it"
                participant(r): "org.acme.Regulator#Bill"
                operation: DELETE, READ, DELETE
                resource(c): "org.acme.Car"
                condition: (c.owner == r)
                action: DENY
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            (() => {
                aclFile.validate();
            }).should.throw(/has been specified more than once/);
        });

        it('should parse correctly and preserve order', () => {
            const aclFile = new AclFile('test.acl', modelManager, testAcl);
            aclFile.getAclRules().length.should.equal(9);
            aclFile.getDefinitions().should.equal(testAcl);
            aclFile.getAclRules().map((aclRule) => {
                return aclRule.getName();
            }).should.deep.equal(['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8' , 'R9']);
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
