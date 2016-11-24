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

const ClassDeclaration = require('@ibm/ibm-concerto-common').ClassDeclaration;
const Property = require('@ibm/ibm-concerto-common').Property;
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Relationship = require('@ibm/ibm-concerto-common').Relationship;
const Resolver = require('../lib/resolver');
const Resource = require('@ibm/ibm-concerto-common').Resource;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('Resolver', () => {

    let mockRegistryManager;
    let resolver;

    beforeEach(() => {
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        resolver = new Resolver(mockRegistryManager);
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

        it('should resolve any relationship valued properties', () => {
            // Create the parent resource.
            let mockResource = sinon.createStubInstance(Resource);
            let mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockResource.getClassDeclaration.returns(mockClassDeclaration);
            let mockProperty = sinon.createStubInstance(Property); mockProperty.getName.returns('prop1');
            mockClassDeclaration.getProperties.returns([mockProperty]);
            // Create the child (resolved) resource.
            let mockChildResource = sinon.createStubInstance(Resource);
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

    });

    describe('#resolveRelationship', () => {

        it('should look for the resource in the default asset registry', () => {
            // Create the parent relationship.
            let mockRelationship = sinon.createStubInstance(Relationship);
            mockRelationship.getFullyQualifiedType.returns('org.doge.Doge');
            mockRelationship.getIdentifier.returns('DOGE_1');
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Asset', 'org.doge.Doge').resolves(mockRegistry);
            // Create the resource it points to.
            let mockResource = sinon.createStubInstance(Resource);
            mockRegistry.get.withArgs('DOGE_1').resolves(mockResource);
            // Stub the resolveResource call.
            sinon.stub(resolver, 'resolveResource').resolves(mockResource);
            return resolver.resolve(mockRelationship)
                .then((mockRelationship) => {
                    mockRelationship.should.equal(mockResource);
                    sinon.assert.calledOnce(resolver.resolveResource);
                    sinon.assert.calledWith(resolver.resolveResource, mockResource);
                });
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            resolver.toJSON().should.deep.equal({});
        });

    });

});
