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

const AclRule = require('../../lib/acl/aclrule');
const AclFile = require('../../lib/acl/aclfile');
const ModelManager = require('../../lib/modelmanager');
const ModelFile = require('../../lib/introspect/modelfile');
const AssetDeclaration = require('../../lib/introspect/assetdeclaration');
const ParticipantDeclaration = require('../../lib/introspect/participantdeclaration');

const should = require('chai').should();
const sinon = require('sinon');

describe('AclRule', () => {

    let aclRule;
    let aclFile;
    let mockModelManager;
    let mockModelFile;
    let mockAssetDeclaration;
    let mockParticipantDeclaration;
    let sandbox;

    const ast = {
        type: 'AclRule',
        id: {
            type: 'Identifier',
            name: 'R1'
        },
        noun: {
            type: 'Binding',
            qualifiedName: 'org.acme.Car',
            instanceId: {
                type: 'Identifier',
                name: 'ABC123'
            },
            variableName: null
        },
        verbs: ['DELETE'],
        participant: {
            type: 'Binding',
            qualifiedName: 'org.acme.Driver',
            instanceId: {
                type: 'Identifier',
                name: 'Fred'
            },
            variableName: null
        },
        predicate: 'true',
        action: 'ALLOW',
        description: 'Fred can DELETE the car ABC123'
    };

    beforeEach(() => {
        aclFile = sinon.createStubInstance(AclFile);
        mockModelManager = sinon.createStubInstance(ModelManager);
        aclFile.getModelManager.returns(mockModelManager);
        mockModelFile = sinon.createStubInstance(ModelFile);
        mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
        mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
        mockModelManager.getModelFile.withArgs('org.acme').returns(mockModelFile);
        mockModelFile.getLocalType.withArgs('Car').returns(mockAssetDeclaration);
        mockModelFile.getLocalType.withArgs('Driver').returns(mockParticipantDeclaration);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw when null AclFile provided', () => {
            (() => {
                aclRule = new AclRule( null, {} );
            }).should.throw(/Invalid AclFile or AST/);
        });

        it('should throw when invalid definitions provided', () => {
            (() => {
                aclRule = new AclRule( aclFile, null );
            }).should.throw(/Invalid AclFile or AST/);
        });
    });

    describe('#validate', () => {

        it('should validate correct contents', () => {
            aclRule = new AclRule( aclFile, ast );
            aclRule.validate();
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            aclRule = new AclRule( aclFile, ast );
            let visitor = {
                visit: sinon.stub()
            };
            aclRule.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, aclRule, ['some', 'args']);
        });

    });

    describe('#getTransaction', () => {

        it('should return null for no transaction', () => {
            const ast = {
                type: 'AclRule',
                id: {
                    type: 'Identifier',
                    name: 'R1'
                },
                noun: {
                    type: 'Binding',
                    qualifiedName: 'org.acme.Car',
                    variableName: null
                },
                verbs: ['ALL'],
                participant: 'ANY',
                transaction: null,
                predicate: 'true',
                action: 'ALLOW',
                description: 'ANY can ALL the cars'
            };
            aclRule = new AclRule( aclFile, ast );
            should.equal(aclRule.getTransaction(), null);
        });

        it('should return a model binding for a transaction', () => {
            const ast = {
                type: 'AclRule',
                id: {
                    type: 'Identifier',
                    name: 'R1'
                },
                noun: {
                    type: 'Binding',
                    qualifiedName: 'org.acme.Car',
                    variableName: null
                },
                verbs: ['ALL'],
                participant: 'ANY',
                transaction: {
                    binding: {
                        type: 'BindingNoInstance',
                        qualifiedName: 'org.acme'
                    }
                },
                predicate: 'true',
                action: 'ALLOW',
                description: 'ANY can ALL the cars'
            };
            aclRule = new AclRule( aclFile, ast );
            aclRule.getTransaction().getFullyQualifiedName().should.equal('org.acme');
            should.equal(aclRule.getTransaction().getVariableName(), null);
        });

        it('should return a model binding for a transaction with a variable binding', () => {
            const ast = {
                type: 'AclRule',
                id: {
                    type: 'Identifier',
                    name: 'R1'
                },
                noun: {
                    type: 'Binding',
                    qualifiedName: 'org.acme.Car',
                    variableName: null
                },
                verbs: ['ALL'],
                participant: 'ANY',
                transaction: {
                    variableBinding: {
                        type: 'Identifier',
                        name: 'tx'
                    },
                    binding: {
                        type: 'BindingNoInstance',
                        qualifiedName: 'org.acme'
                    }
                },
                predicate: 'true',
                action: 'ALLOW',
                description: 'ANY can ALL the cars'
            };
            aclRule = new AclRule( aclFile, ast );
            aclRule.getTransaction().getFullyQualifiedName().should.equal('org.acme');
            aclRule.getTransaction().getVariableName().should.equal('tx');
        });

    });

});
