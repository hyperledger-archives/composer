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
const IllegalModelException = require('../../lib/introspect/illegalmodelexception');
const ParseException = require('../../lib/introspect/parseexception');
const fs = require('fs');
const path = require('path');

require('chai').should();
const sinon = require('sinon');

describe('AclFile', () => {

    const testAcl = fs.readFileSync(path.resolve(__dirname, '../data/acl/test.acl'), 'utf8');
    const invalidAcl = fs.readFileSync(path.resolve(__dirname, '../data/acl/invalid.acl'), 'utf8');
    const testModel = fs.readFileSync(path.resolve(__dirname, '../data/acl/model.cto'), 'utf8');

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

        it('should parse R1 rule correctly', () => {
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

        it('should parse R2 rule correctly', () => {
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

        it('should parse R3 rule correctly', () => {
            const aclContents = `rule R3 {
                description: "regulators can perform all operations on Cars"
                participant: "org.acme.Regulator"
                operation: ALL
                resource: "org.acme.Car"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r3 = aclFile.getAclRules()[0];
            r3.getName().should.equal('R3');
            r3.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r3.getVerbs().should.deep.equal(['ALL']);
            r3.getParticipant().getFullyQualifiedName().should.equal('org.acme.Regulator');
            (r3.getParticipant().getInstanceIdentifier() === null).should.be.true;
            (r3.getParticipant().getVariableName() === null).should.be.true;
            (r3.getTransaction() === null).should.be.true;
            r3.getPredicate().getExpression().should.equal('true');
            r3.getAction().should.equal('ALLOW');
            r3.getDescription().should.equal('regulators can perform all operations on Cars');
        });

        it('should parse R4 rule correctly', () => {
            const aclContents = `rule R4 {
                description: "anyone in the org.acme namespace can perform all operations on Cars"
                participant: "org.acme.*"
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
            r4.getParticipant().getFullyQualifiedName().should.equal('org.acme.*');
            (r4.getParticipant().getInstanceIdentifier() === null).should.be.true;
            (r4.getParticipant().getVariableName() === null).should.be.true;
            (r4.getTransaction() === null).should.be.true;
            r4.getPredicate().getExpression().should.equal('true');
            r4.getAction().should.equal('ALLOW');
            r4.getDescription().should.equal('anyone in the org.acme namespace can perform all operations on Cars');
        });

        it('should parse R5 rule correctly', () => {
            const aclContents = `rule R5 {
                description: "anyone under the org.acme namespace can perform all operations on Cars"
                participant: "org.acme.**"
                operation: ALL
                resource: "org.acme.Car"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r5 = aclFile.getAclRules()[0];
            r5.getName().should.equal('R5');
            r5.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r5.getVerbs().should.deep.equal(['ALL']);
            r5.getParticipant().getFullyQualifiedName().should.equal('org.acme.**');
            (r5.getParticipant().getInstanceIdentifier() === null).should.be.true;
            (r5.getParticipant().getVariableName() === null).should.be.true;
            (r5.getTransaction() === null).should.be.true;
            r5.getPredicate().getExpression().should.equal('true');
            r5.getAction().should.equal('ALLOW');
            r5.getDescription().should.equal('anyone under the org.acme namespace can perform all operations on Cars');
        });

        it('should parse R6 rule correctly', () => {
            const aclContents = `rule R6 {
                description: "Everyone can read all resources in the org.acme namespace"
                participant: "ANY"
                operation: READ
                resource: "org.acme.*"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r6 = aclFile.getAclRules()[0];
            r6.getName().should.equal('R6');
            r6.getNoun().getFullyQualifiedName().should.equal('org.acme.*');
            r6.getVerbs().should.deep.equal(['READ']);
            (r6.getParticipant() === null).should.be.true;
            (r6.getTransaction() === null).should.be.true;
            r6.getPredicate().getExpression().should.equal('true');
            r6.getAction().should.equal('ALLOW');
            r6.getDescription().should.equal('Everyone can read all resources in the org.acme namespace');
        });

        it('should parse R7 rule correctly', () => {
            const aclContents = `rule R7 {
                description: "Everyone can read all resources under the org.acme namespace"
                participant: "ANY"
                operation: READ
                resource: "org.acme.**"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r7 = aclFile.getAclRules()[0];
            r7.getName().should.equal('R7');
            r7.getNoun().getFullyQualifiedName().should.equal('org.acme.**');
            r7.getVerbs().should.deep.equal(['READ']);
            (r7.getParticipant() === null).should.be.true;
            (r7.getTransaction() === null).should.be.true;
            r7.getPredicate().getExpression().should.equal('true');
            r7.getAction().should.equal('ALLOW');
            r7.getDescription().should.equal('Everyone can read all resources under the org.acme namespace');
        });

        it('should parse R8 rule correctly', () => {
            const aclContents = `rule R8 {
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
            const r8 = aclFile.getAclRules()[0];
            r8.getName().should.equal('R8');
            r8.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r8.getVerbs().should.deep.equal(['ALL']);
            (r8.getParticipant() === null).should.be.true;
            r8.getTransaction().getFullyQualifiedName().should.equal('org.acme.Transaction');
            (r8.getTransaction().getVariableName() === null).should.be.true;
            r8.getPredicate().getExpression().should.equal('true');
            r8.getAction().should.equal('ALLOW');
            r8.getDescription().should.equal('Drivers can do something in a org.acme.Transaction transaction');
        });

        it('should parse R9 rule correctly', () => {
            const aclContents = `rule R9 {
                description: "Drivers can do something with transactions in the org.acme namespace"
                participant: "ANY"
                operation: ALL
                resource: "org.acme.Car"
                transaction: "org.acme.*"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r9 = aclFile.getAclRules()[0];
            r9.getName().should.equal('R9');
            r9.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r9.getVerbs().should.deep.equal(['ALL']);
            (r9.getParticipant() === null).should.be.true;
            r9.getTransaction().getFullyQualifiedName().should.equal('org.acme.*');
            (r9.getTransaction().getVariableName() === null).should.be.true;
            r9.getPredicate().getExpression().should.equal('true');
            r9.getAction().should.equal('ALLOW');
            r9.getDescription().should.equal('Drivers can do something with transactions in the org.acme namespace');
        });

        it('should parse R10 rule correctly', () => {
            const aclContents = `rule R10 {
                description: "Drivers can do something with transactions under the org.acme namespace"
                participant: "ANY"
                operation: ALL
                resource: "org.acme.Car"
                transaction: "org.acme.**"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r10 = aclFile.getAclRules()[0];
            r10.getName().should.equal('R10');
            r10.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r10.getVerbs().should.deep.equal(['ALL']);
            (r10.getParticipant() === null).should.be.true;
            r10.getTransaction().getFullyQualifiedName().should.equal('org.acme.**');
            (r10.getTransaction().getVariableName() === null).should.be.true;
            r10.getPredicate().getExpression().should.equal('true');
            r10.getAction().should.equal('ALLOW');
            r10.getDescription().should.equal('Drivers can do something with transactions under the org.acme namespace');
        });

        it('should parse R11 rule correctly', () => {
            const aclContents = `rule R11 {
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
            const r11 = aclFile.getAclRules()[0];
            r11.getName().should.equal('R11');
            r11.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r11.getVerbs().should.deep.equal(['ALL']);
            (r11.getParticipant() === null).should.be.true;
            r11.getTransaction().getFullyQualifiedName().should.equal('org.acme.Transaction');
            r11.getTransaction().getVariableName().should.equal('tx');
            r11.getPredicate().getExpression().should.equal('tx.asset.colour === \'blue\'');
            r11.getAction().should.equal('ALLOW');
            r11.getDescription().should.equal('Regulators can do something in a org.acme.Transaction transaction');
        });

        it('should parse R12 rule correctly', () => {
            const aclContents = `rule R12 {
                description: "Fred can CREATE, READ, and UPDATE the car ABC123"
                participant: "org.acme.Driver#Fred"
                operation: CREATE, READ, UPDATE
                resource: "org.acme.Car#ABC123"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            aclFile.getAclRules().length.should.equal(1);
            aclFile.getDefinitions().should.equal(aclContents);
            const r12 = aclFile.getAclRules()[0];
            r12.getName().should.equal('R12');
            r12.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            r12.getNoun().getInstanceIdentifier().should.equal('ABC123');
            r12.getVerbs().should.deep.equal(['CREATE', 'READ', 'UPDATE']);
            r12.getParticipant().getFullyQualifiedName().should.equal('org.acme.Driver');
            r12.getParticipant().getInstanceIdentifier().should.equal('Fred');
            (r12.getParticipant().getVariableName() === null).should.be.true;
            r12.getAction().should.equal('ALLOW');
            r12.getDescription().should.equal('Fred can CREATE, READ, and UPDATE the car ABC123');
        });

        it('should parse R13 rule correctly', () => {
            const aclContents = `rule R13 {
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
            const r13 = aclFile.getAclRules()[0];
            r13.getName().should.equal('R13');
            r13.getNoun().getFullyQualifiedName().should.equal('org.acme.Car');
            (r13.getNoun().getInstanceIdentifier() === null).should.be.true;
            r13.getParticipant().getFullyQualifiedName().should.equal('org.acme.Regulator');
            r13.getParticipant().getInstanceIdentifier().should.equal('Bill');
            r13.getParticipant().getVariableName().should.equal('r');
            r13.getVerbs().should.deep.equal(['UPDATE', 'DELETE']);
        });

        it('should fail to parse a rule with ALL and another verb', () => {
            const aclContents = `rule A {
                description: "regulator with ID Bill can not update or delete a Car if they own it"
                participant(r): "org.acme.Regulator#Bill"
                operation: ALL, DELETE
                resource(c): "org.acme.Car"
                condition: (c.owner == r)
                action: DENY
            }`;
            (() => {
                new AclFile('test.acl', modelManager, aclContents);
            }).should.throw(ParseException, /Expected.*but.*found/);
        });

        it('should fail to parse a rule with a glob and instance ID', () => {
            const aclContents = `rule B {
                description: "regulator with ID Bill can not update or delete a Car if they own it"
                participant(r): "org.acme.Regulator.*#Bill"
                operation: UPDATE, DELETE
                resource(c): "org.acme.Car"
                condition: (c.owner == r)
                action: DENY
            }`;
            (() => {
                new AclFile('test.acl', modelManager, aclContents);
            }).should.throw(ParseException, /Expected.*but.*found/);
        });

        it('should fail to parse a rule with a recursive glob and instance ID', () => {
            const aclContents = `rule C {
                description: "regulator with ID Bill can not update or delete a Car if they own it"
                participant(r): "org.acme.Regulator.**#Bill"
                operation: UPDATE, DELETE
                resource(c): "org.acme.Car"
                condition: (c.owner == r)
                action: DENY
            }`;
            (() => {
                new AclFile('test.acl', modelManager, aclContents);
            }).should.throw(ParseException, /Expected.*but.*found/);
        });


        it('should parse correctly and preserve order', () => {
            const aclFile = new AclFile('test.acl', modelManager, testAcl);
            aclFile.getAclRules().length.should.equal(13);
            aclFile.getDefinitions().should.equal(testAcl);
            aclFile.getAclRules().map((aclRule) => {
                return aclRule.getName();
            }).should.deep.equal(['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8' , 'R9', 'R10', 'R11', 'R12', 'R13']);
        });

    });

    describe('#validate', () => {

        it('should validate correct contents', () => {
            const aclFile = new AclFile( 'test', modelManager, testAcl);
            aclFile.validate();
        });

        it('should throw for duplicate rule names', () => {
            const aclContents = `rule R1 {
                description: "some rule"
                participant: "ANY"
                operation: ALL
                resource: "org.acme.*"
                action: ALLOW
            }

            rule R1 {
                description: "some rule"
                participant: "ANY"
                operation: ALL
                resource: "org.acme.*"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            (() => {
                aclFile.validate();
            }).should.throw(/Found two or more ACL rules with the name/);
        });

        it('should fail to validate a rule with duplicate verbs', () => {
            const aclContents = `rule A {
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

        it('should fail to validate a rule when participant is not a participant', () => {
            const aclContents = `rule B {
                description: "org.acme.Car is an asset, not a particpant"
                participant: "org.acme.Car"
                operation: READ
                resource: "org.acme.Car"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            (() => {
                aclFile.validate();
            }).should.throw(IllegalModelException, /The participant.*must be a participant/);
        });

        it('should fail to validate a rule when transaction is not a transaction', () => {
            const aclContents = `rule D {
                description: "org.acme.Car is an asset, not a transaction"
                participant: "ANY"
                operation: ALL
                resource: "org.acme.*"
                transaction: "org.acme.Car"
                action: ALLOW
            }`;
            const aclFile = new AclFile('test.acl', modelManager, aclContents);
            (() => {
                aclFile.validate();
            }).should.throw(IllegalModelException, /The transaction.*must be a transaction/);
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
