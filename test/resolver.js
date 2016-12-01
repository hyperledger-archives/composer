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

const AssetDeclaration = require('@ibm/ibm-concerto-common').AssetDeclaration;
const ClassDeclaration = require('@ibm/ibm-concerto-common').ClassDeclaration;
const Introspector = require('@ibm/ibm-concerto-common').Introspector;
const ParticipantDeclaration = require('@ibm/ibm-concerto-common').ParticipantDeclaration;
const Property = require('@ibm/ibm-concerto-common').Property;
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Relationship = require('@ibm/ibm-concerto-common').Relationship;
const Resolver = require('../lib/resolver');
const Resource = require('@ibm/ibm-concerto-common').Resource;
const TransactionDeclaration = require('@ibm/ibm-concerto-common').TransactionDeclaration;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('Resolver', () => {

    let mockRegistryManager;
    let mockIntrospector;
    let resolver;

    beforeEach(() => {
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockIntrospector = sinon.createStubInstance(Introspector);
        resolver = new Resolver(mockIntrospector, mockRegistryManager);
    });

    describe('#resolve', () => {

        it('should resolve resources', () => {
            let mockResource = sinon.createStubInstance(Resource);
            sinon.stub(resolver, 'resolveResource').resolves(mockResource);
            resolver.resolve(mockResource).should.eventually.equal(mockResource);
        });

        it('should resolve relationships', () => {
            let mockResource = sinon.createStubInstance(Resource);
            let mockRelationship = sinon.createStubInstance(Relationship);
            sinon.stub(resolver, 'resolveRelationship').resolves(mockResource);
            resolver.resolve(mockRelationship).should.eventually.equal(mockResource);
        });

        it('should throw for unrecognized types', () => {
            (() => {
                resolver.resolve('hello world');
            }).should.throw(/unsupported type for identifiable/);
        });

    });

    describe('#resolveResource', () => {

        it('should ignore any primitive valued properties', () => {
            let mockResource = sinon.createStubInstance(Resource);
            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockResource.getClassDeclaration.returns(mockClassDeclaration);
            let mockProperty = sinon.createStubInstance(Property); mockProperty.getName.returns('prop1');
            mockClassDeclaration.getProperties.returns([mockProperty]);
            mockResource.prop1 = 'hello world';
            return resolver.resolve(mockResource)
                .then((mockResource) => {
                    mockResource.prop1.should.equal('hello world');
                });
        });

        it('should ignore any arrays of primitive valued properties', () => {
            let mockResource = sinon.createStubInstance(Resource);
            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockResource.getClassDeclaration.returns(mockClassDeclaration);
            let mockProperty = sinon.createStubInstance(Property); mockProperty.getName.returns('prop1');
            mockClassDeclaration.getProperties.returns([mockProperty]);
            mockResource.prop1 = ['hello world', 3.142];
            return resolver.resolve(mockResource)
                .then((mockResource) => {
                    mockResource.prop1.should.deep.equal(['hello world', 3.142]);
                });
        });

        it('should resolve any resource valued properties', () => {
            // We want to see what else got resolved.
            sinon.spy(resolver, 'resolveResource');
            // Create the parent resource.
            let mockResource = sinon.createStubInstance(Resource);
            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockResource.getClassDeclaration.returns(mockClassDeclaration);
            let mockProperty = sinon.createStubInstance(Property); mockProperty.getName.returns('prop1');
            mockClassDeclaration.getProperties.returns([mockProperty]);
            // Create the child resource.
            let mockChildResource = sinon.createStubInstance(Resource);
            mockChildResource.$identifier = 'DOGE_1';
            let mockChildClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockChildResource.getClassDeclaration.returns(mockChildClassDeclaration);
            mockChildClassDeclaration.getProperties.returns([]);
            // Assign the child resource to the parent resource.
            mockResource.prop1 = mockChildResource;
            return resolver.resolveResource(mockResource)
                .then((mockResource) => {
                    mockResource.prop1.should.equal(mockChildResource);
                    sinon.assert.calledTwice(resolver.resolveResource);
                    sinon.assert.calledWith(resolver.resolveResource, mockChildResource);
                });
        });

        it('should resolve any arrays of resource valued properties', () => {
            // We want to see what else got resolved.
            sinon.spy(resolver, 'resolveResource');
            // Create the parent resource.
            let mockResource = sinon.createStubInstance(Resource);
            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockResource.getClassDeclaration.returns(mockClassDeclaration);
            let mockProperty = sinon.createStubInstance(Property); mockProperty.getName.returns('prop1');
            mockClassDeclaration.getProperties.returns([mockProperty]);
            // Create the child resources.
            let mockChildResource1 = sinon.createStubInstance(Resource);
            mockChildResource1.$identifier = 'DOGE_1';
            let mockChildResource2 = sinon.createStubInstance(Resource);
            mockChildResource2.$identifier = 'DOGE_2';
            let mockChildClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockChildResource1.getClassDeclaration.returns(mockChildClassDeclaration);
            mockChildResource2.getClassDeclaration.returns(mockChildClassDeclaration);
            mockChildClassDeclaration.getProperties.returns([]);
            // Assign the child resources to the parent resource.
            mockResource.prop1 = [mockChildResource1, mockChildResource2];
            return resolver.resolveResource(mockResource)
                .then((mockResource) => {
                    mockResource.prop1.should.deep.equal([mockChildResource1, mockChildResource2]);
                    sinon.assert.calledThrice(resolver.resolveResource);
                    sinon.assert.calledWith(resolver.resolveResource, mockChildResource1);
                    sinon.assert.calledWith(resolver.resolveResource, mockChildResource2);
                });
        });

        it('should resolve any relationship valued properties', () => {
            // Create the parent resource.
            let mockResource = sinon.createStubInstance(Resource);
            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockResource.getClassDeclaration.returns(mockClassDeclaration);
            let mockProperty = sinon.createStubInstance(Property); mockProperty.getName.returns('prop1');
            mockClassDeclaration.getProperties.returns([mockProperty]);
            // Create the child (resolved) resource.
            let mockChildResource = sinon.createStubInstance(Resource);
            mockChildResource.$identifier = 'DOGE_1';
            let mockChildClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockChildResource.getClassDeclaration.returns(mockChildClassDeclaration);
            mockChildClassDeclaration.getProperties.returns([]);
            // Stub the resolveRelationship call to return the resource.
            sinon.stub(resolver, 'resolveRelationship').resolves(mockChildResource);
            // Create the child relationship.
            let mockRelationship = sinon.createStubInstance(Relationship);
            mockRelationship.getFullyQualifiedType.returns('org.doge.Doge');
            mockRelationship.getIdentifier.returns('DOGE_1');
            // Assign the child relationship to the parent resource.
            mockResource.prop1 = mockRelationship;
            return resolver.resolveResource(mockResource)
                .then((mockResource) => {
                    mockResource.prop1.should.equal(mockChildResource);
                    sinon.assert.calledOnce(resolver.resolveRelationship);
                    sinon.assert.calledWith(resolver.resolveRelationship, mockRelationship);
                });
        });

        it('should resolve any arrays of relationship valued properties', () => {
            // Create the parent resource.
            let mockResource = sinon.createStubInstance(Resource);
            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockResource.getClassDeclaration.returns(mockClassDeclaration);
            let mockProperty = sinon.createStubInstance(Property); mockProperty.getName.returns('prop1');
            mockClassDeclaration.getProperties.returns([mockProperty]);
            // Create the child (resolved) resource.
            let mockChildResource1 = sinon.createStubInstance(Resource);
            mockChildResource1.$identifier = 'DOGE_1';
            let mockChildResource2 = sinon.createStubInstance(Resource);
            mockChildResource2.$identifier = 'DOGE_2';
            let mockChildClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockChildResource1.getClassDeclaration.returns(mockChildClassDeclaration);
            mockChildResource2.getClassDeclaration.returns(mockChildClassDeclaration);
            mockChildClassDeclaration.getProperties.returns([]);
            // Stub the resolveRelationship call to return the resource.
            sinon.stub(resolver, 'resolveRelationship');
            resolver.resolveRelationship.onFirstCall().resolves(mockChildResource1);
            resolver.resolveRelationship.onSecondCall().resolves(mockChildResource2);
            // Create the child relationship.
            let mockRelationship1 = sinon.createStubInstance(Relationship);
            mockRelationship1.getFullyQualifiedType.returns('org.doge.Doge');
            mockRelationship1.getIdentifier.returns('DOGE_1');
            let mockRelationship2 = sinon.createStubInstance(Relationship);
            mockRelationship2.getFullyQualifiedType.returns('org.doge.Doge');
            mockRelationship2.getIdentifier.returns('DOGE_2');
            // Assign the child relationship to the parent resource.
            mockResource.prop1 = [mockRelationship1, mockRelationship2];
            return resolver.resolveResource(mockResource)
                .then((mockResource) => {
                    mockResource.prop1.should.deep.equal([mockChildResource1, mockChildResource2]);
                    sinon.assert.calledTwice(resolver.resolveRelationship);
                    sinon.assert.calledWith(resolver.resolveRelationship, mockRelationship1);
                    sinon.assert.calledWith(resolver.resolveRelationship, mockRelationship2);
                });
        });

    });

    describe('#resolveRelationship', () => {

        it('should look for the resource in the default asset registry', () => {
            // Create the parent relationship.
            let mockRelationship = sinon.createStubInstance(Relationship);
            mockRelationship.getFullyQualifiedType.returns('org.doge.Doge');
            mockRelationship.getIdentifier.returns('DOGE_1');
            mockRelationship.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockIntrospector.getClassDeclaration.withArgs('org.doge.Doge').returns(mockAssetDeclaration);
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Asset', 'org.doge.Doge').resolves(mockRegistry);
            // Create the resource it points to.
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.$identifier = 'DOGE_1';
            mockRegistry.get.withArgs('DOGE_1').resolves(mockResource);
            // Stub the resolveResource call.
            sinon.stub(resolver, 'resolveResource').resolves(mockResource);
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveRelationship(mockRelationship, resolveState)
                .then((mockRelationship) => {
                    mockRelationship.should.equal(mockResource);
                    sinon.assert.calledOnce(resolver.resolveResource);
                    sinon.assert.calledWith(resolver.resolveResource, mockResource);
                    resolveState.cachedResources.get('org.doge.Doge#DOGE_1').should.equal(mockResource);
                });
        });

        it('should look for the resource in the default participant registry', () => {
            // Create the parent relationship.
            let mockRelationship = sinon.createStubInstance(Relationship);
            mockRelationship.getFullyQualifiedType.returns('org.doge.Doge');
            mockRelationship.getIdentifier.returns('DOGE_1');
            mockRelationship.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            let mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
            mockIntrospector.getClassDeclaration.withArgs('org.doge.Doge').returns(mockParticipantDeclaration);
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Participant', 'org.doge.Doge').resolves(mockRegistry);
            // Create the resource it points to.
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.$identifier = 'DOGE_1';
            mockRegistry.get.withArgs('DOGE_1').resolves(mockResource);
            // Stub the resolveResource call.
            sinon.stub(resolver, 'resolveResource').resolves(mockResource);
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveRelationship(mockRelationship, resolveState)
                .then((mockRelationship) => {
                    mockRelationship.should.equal(mockResource);
                    sinon.assert.calledOnce(resolver.resolveResource);
                    sinon.assert.calledWith(resolver.resolveResource, mockResource);
                    resolveState.cachedResources.get('org.doge.Doge#DOGE_1').should.equal(mockResource);
                });
        });

        it('should look for the resource in the default transaction registry', () => {
            // Create the parent relationship.
            let mockRelationship = sinon.createStubInstance(Relationship);
            mockRelationship.getFullyQualifiedType.returns('org.doge.Doge');
            mockRelationship.getIdentifier.returns('DOGE_1');
            mockRelationship.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            let mockTransactionDeclaration = sinon.createStubInstance(TransactionDeclaration);
            mockIntrospector.getClassDeclaration.withArgs('org.doge.Doge').returns(mockTransactionDeclaration);
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Transaction', 'default').resolves(mockRegistry);
            // Create the resource it points to.
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.$identifier = 'DOGE_1';
            mockRegistry.get.withArgs('DOGE_1').resolves(mockResource);
            // Stub the resolveResource call.
            sinon.stub(resolver, 'resolveResource').resolves(mockResource);
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveRelationship(mockRelationship, resolveState)
                .then((mockRelationship) => {
                    mockRelationship.should.equal(mockResource);
                    sinon.assert.calledOnce(resolver.resolveResource);
                    sinon.assert.calledWith(resolver.resolveResource, mockResource);
                    resolveState.cachedResources.get('org.doge.Doge#DOGE_1').should.equal(mockResource);
                });
        });

        it('should throw for an unsupported resource class declaration', () => {
            // Create the parent relationship.
            let mockRelationship = sinon.createStubInstance(Relationship);
            mockRelationship.getFullyQualifiedType.returns('org.doge.Doge');
            mockRelationship.getIdentifier.returns('DOGE_1');
            mockRelationship.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockIntrospector.getClassDeclaration.withArgs('org.doge.Doge').returns(mockClassDeclaration);
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Transaction', 'default').resolves(mockRegistry);
            // Stub the resolveResource call.
            let resolveState = {
                cachedResources: new Map()
            };
            (() => {
                resolver.resolveRelationship(mockRelationship, resolveState);
            }).should.throw(/Unsupported class declaration type/);
        });

        it('should not look for a cached resource', () => {
            // Create the parent relationship.
            let mockRelationship = sinon.createStubInstance(Relationship);
            mockRelationship.getFullyQualifiedType.returns('org.doge.Doge');
            mockRelationship.getIdentifier.returns('DOGE_1');
            mockRelationship.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            mockRegistryManager.get.withArgs('Asset', 'org.doge.Doge').rejects();
            // Create the resource it points to.
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.$identifier = 'DOGE_1';
            // Stub the resolveResource call.
            sinon.stub(resolver, 'resolveResource').rejects();
            let resolveState = {
                cachedResources: new Map()
            };
            resolveState.cachedResources.set('org.doge.Doge#DOGE_1', mockResource);
            return resolver.resolveRelationship(mockRelationship, resolveState)
                .then((mockRelationship) => {
                    mockRelationship.should.equal(mockResource);
                    sinon.assert.notCalled(resolver.resolveResource);
                });
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            resolver.toJSON().should.deep.equal({});
        });

    });

});
