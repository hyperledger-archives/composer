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

const Factory = require('composer-common').Factory;
const Introspector = require('composer-common').Introspector;
const InvalidRelationship = require('../lib/invalidrelationship');
const ModelManager = require('composer-common').ModelManager;
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Resolver = require('../lib/resolver');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('Resolver', () => {

    let modelManager;
    let factory;
    let introspector;
    let mockRegistryManager;
    let resolver;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.doge

        concept DogeConcept {
            o String value optional
        }

        asset DogeAsset identified by dogeId {
            o String dogeId
            o String value optional
            o String[] values optional
            o DogeConcept concept optional
            o DogeConcept[] concepts optional
            o DogeTransaction resource optional
            o DogeTransaction[] resources optional
            --> DogeParticipant relationship optional
            --> DogeParticipant[] relationships optional
        }

        participant DogeParticipant identified by dogeId {
            o String dogeId
            o String value optional
        }

        transaction DogeTransaction {
            o String dogeId
            o String value optional
        }`);
        factory = new Factory(modelManager);
        introspector = new Introspector(modelManager);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        resolver = new Resolver(factory, introspector, mockRegistryManager);
    });

    describe('#prepare', () => {

        it('should prepare resources', () => {
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            sinon.stub(resolver, 'resolveResourceOrConcept').resolves(resource);
            const cb = sinon.stub();
            return resolver.prepare(resource, cb).should.eventually.equal(resource)
                .then(() => {
                    const resolveState = resolver.resolveResourceOrConcept.args[0][1];
                    resolveState.prepare.should.be.true;
                    resolveState.prepareCallback.should.equal(cb);
                    resolveState.preparePromise.should.be.an.instanceOf(Promise);
                });
        });

        it('should throw for unrecognized types', () => {
            (() => {
                resolver.prepare('hello world');
            }).should.throw(/unsupported type for identifiable/);
        });

    });

    describe('#resolve', () => {

        it('should resolve resources', () => {
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            sinon.stub(resolver, 'resolveResourceOrConcept').resolves(resource);
            return resolver.resolve(resource).should.eventually.equal(resource);
        });

        it('should resolve relationships', () => {
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            let relationship = factory.newRelationship('org.doge', 'DogeAsset', 'DOGE_1');
            sinon.stub(resolver, 'resolveRelationship').resolves(resource);
            return resolver.resolve(relationship).should.eventually.equal(resource);
        });

        it('should throw for unrecognized types', () => {
            (() => {
                resolver.resolve('hello world');
            }).should.throw(/unsupported type for identifiable/);
        });

    });

    describe('#resolveResourceOrConcept', () => {

        it('should immediately return an already cached resource', () => {
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            resource.value = 'hello world';
            let resolveState = {
                cachedResources: new Map()
            };
            let resolvedResource;
            return resolver.resolveResourceOrConcept(resource, resolveState)
                .then((resolvedResource_) => {
                    resolvedResource = resolvedResource_;
                    return resolver.resolveResourceOrConcept(resource, resolveState);
                })
                .then((resolvedResource_) => {
                    resolvedResource.should.equal(resolvedResource_);
                });
        });

        it('should ignore any primitive valued properties', () => {
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            resource.value = 'hello world';
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveResourceOrConcept(resource, resolveState)
                .then((resolvedResource) => {
                    resolvedResource.value.should.equal('hello world');
                    resolveState.cachedResources.get('org.doge.DogeAsset#DOGE_1').should.equal(resolvedResource);
                });
        });

        it('should ignore any arrays of primitive valued properties', () => {
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            resource.values = [ 'hello world', 'such meme' ];
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveResourceOrConcept(resource, resolveState)
                .then((resolvedResource) => {
                    resolvedResource.values.should.deep.equal(['hello world', 'such meme']);
                    resolveState.cachedResources.get('org.doge.DogeAsset#DOGE_1').should.equal(resolvedResource);
                });
        });

        it('should resolve any concept valued properties', () => {
            // We want to see what else got resolved.
            sinon.spy(resolver, 'resolveResourceOrConcept');
            // Create the parent resource.
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            // Create the child resource.
            let concept = factory.newConcept('org.doge', 'DogeConcept');
            // Assign the child resource to the parent resource.
            resource.concept = concept;
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveResourceOrConcept(resource, resolveState)
                .then((resolvedResource) => {
                    resolvedResource.concept.should.deep.equal(concept);
                    sinon.assert.calledTwice(resolver.resolveResourceOrConcept);
                    sinon.assert.calledWith(resolver.resolveResourceOrConcept, concept);
                    resolveState.cachedResources.get('org.doge.DogeAsset#DOGE_1').should.equal(resolvedResource);
                });
        });

        it('should resolve any arrays of concept valued properties', () => {
            // We want to see what else got resolved.
            sinon.spy(resolver, 'resolveResourceOrConcept');
            // Create the parent resource.
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            // Create the child resources.
            let concept1 = factory.newConcept('org.doge', 'DogeConcept');
            let concept2 = factory.newConcept('org.doge', 'DogeConcept');
            // Assign the child resources to the parent resource.
            resource.concepts = [concept1, concept2];
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveResourceOrConcept(resource, resolveState)
                .then((resolvedResource) => {
                    resolvedResource.concepts.should.deep.equal([concept1, concept2]);
                    sinon.assert.calledThrice(resolver.resolveResourceOrConcept);
                    sinon.assert.calledWith(resolver.resolveResourceOrConcept, concept1);
                    sinon.assert.calledWith(resolver.resolveResourceOrConcept, concept2);
                    resolveState.cachedResources.get('org.doge.DogeAsset#DOGE_1').should.equal(resolvedResource);
                });
        });

        it('should resolve any resource valued properties', () => {
            // We want to see what else got resolved.
            sinon.spy(resolver, 'resolveResourceOrConcept');
            // Create the parent resource.
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            // Create the child resource.
            let childResource = factory.newResource('org.doge', 'DogeTransaction', 'DOGE_1');
            // Assign the child resource to the parent resource.
            resource.resource = childResource;
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveResourceOrConcept(resource, resolveState)
                .then((resolvedResource) => {
                    resolvedResource.resource.should.deep.equal(childResource);
                    sinon.assert.calledTwice(resolver.resolveResourceOrConcept);
                    sinon.assert.calledWith(resolver.resolveResourceOrConcept, childResource);
                    resolveState.cachedResources.get('org.doge.DogeAsset#DOGE_1').should.equal(resolvedResource);
                });
        });

        it('should resolve any arrays of resource valued properties', () => {
            // We want to see what else got resolved.
            sinon.spy(resolver, 'resolveResourceOrConcept');
            // Create the parent resource.
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            // Create the child resources.
            let childResource1 = factory.newResource('org.doge', 'DogeTransaction', 'DOGE_1');
            let childResource2 = factory.newResource('org.doge', 'DogeTransaction', 'DOGE_2');
            // Assign the child resources to the parent resource.
            resource.resources = [childResource1, childResource2];
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveResourceOrConcept(resource, resolveState)
                .then((resolvedResource) => {
                    resolvedResource.resources.should.deep.equal([childResource1, childResource2]);
                    sinon.assert.calledThrice(resolver.resolveResourceOrConcept);
                    sinon.assert.calledWith(resolver.resolveResourceOrConcept, childResource1);
                    sinon.assert.calledWith(resolver.resolveResourceOrConcept, childResource2);
                    resolveState.cachedResources.get('org.doge.DogeAsset#DOGE_1').should.equal(resolvedResource);
                });
        });

        it('should resolve any relationship valued properties', () => {
            // Create the parent resource.
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            // Create the child (resolved) resource.
            let childResource = factory.newResource('org.doge', 'DogeParticipant', 'DOGE_1');
            // Stub the resolveRelationship call to return the resource.
            sinon.stub(resolver, 'resolveRelationship').resolves(childResource);
            // Create the child relationship.
            let relationship = factory.newRelationship('org.doge', 'DogeParticipant', 'DOGE_1');
            // Assign the child relationship to the parent resource.
            resource.relationship = relationship;
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveResourceOrConcept(resource, resolveState)
                .then((resolvedResource) => {
                    resolvedResource.relationship.should.equal(childResource);
                    sinon.assert.calledOnce(resolver.resolveRelationship);
                    sinon.assert.calledWith(resolver.resolveRelationship, relationship);
                    resolveState.cachedResources.get('org.doge.DogeAsset#DOGE_1').should.equal(resolvedResource);
                });
        });

        it('should resolve any arrays of relationship valued properties', () => {
            // Create the parent resource.
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            // Create the child (resolved) resource.
            let childResource1 = factory.newResource('org.doge', 'DogeParticipant', 'DOGE_1');
            let childResource2 = factory.newResource('org.doge', 'DogeParticipant', 'DOGE_2');
            // Stub the resolveRelationship call to return the resource.
            sinon.stub(resolver, 'resolveRelationship');
            resolver.resolveRelationship.onFirstCall().resolves(childResource1);
            resolver.resolveRelationship.onSecondCall().resolves(childResource2);
            // Create the child relationship.
            let relationship1 = factory.newRelationship('org.doge', 'DogeParticipant', 'DOGE_1');
            let relationship2 = factory.newRelationship('org.doge', 'DogeParticipant', 'DOGE_2');
            // Assign the child relationship to the parent resource.
            resource.relationships = [relationship1, relationship2];
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveResourceOrConcept(resource, resolveState)
                .then((resolvedResource) => {
                    resolvedResource.relationships.should.deep.equal([childResource1, childResource2]);
                    sinon.assert.calledTwice(resolver.resolveRelationship);
                    sinon.assert.calledWith(resolver.resolveRelationship, relationship1);
                    sinon.assert.calledWith(resolver.resolveRelationship, relationship2);
                    resolveState.cachedResources.get('org.doge.DogeAsset#DOGE_1').should.equal(resolvedResource);
                });
        });

        it('should lazily resolve any relationship valued properties', () => {
            // Create the parent resource.
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            // Create the child (resolved) resource.
            let childResource = factory.newResource('org.doge', 'DogeParticipant', 'DOGE_1');
            childResource.value = 'woop woop';
            // Stub the resolveRelationship call to return the resource.
            sinon.stub(resolver, 'resolveRelationship').resolves(childResource);
            // Create the child relationship.
            let relationship = factory.newRelationship('org.doge', 'DogeParticipant', 'DOGE_1');
            // Assign the child relationship to the parent resource.
            resource.relationship = relationship;
            let cb = sinon.stub();
            let resolveState = {
                cachedResources: new Map(),
                prepare: true,
                prepareCallback: cb,
                preparePromise: Promise.resolve()
            };
            let resolvedResource;
            return resolver.resolveResourceOrConcept(resource, resolveState)
                .then((resolvedResource_) => {
                    resolvedResource = resolvedResource_;
                    sinon.assert.notCalled(resolver.resolveRelationship);
                    sinon.assert.notCalled(cb);
                    return resolvedResource.relationship.value;
                })
                .then((resolvedValue) => {
                    resolvedValue.should.equal('woop woop');
                    sinon.assert.calledOnce(resolver.resolveRelationship);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, resolveState.preparePromise);
                    resolveState.cachedResources.get('org.doge.DogeAsset#DOGE_1').should.equal(resolvedResource);
                });
        });

        it('should lazily resolve any arrays of relationship valued properties', () => {
            // Create the parent resource.
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            // Create the child (resolved) resource.
            let childResource1 = factory.newResource('org.doge', 'DogeParticipant', 'DOGE_1');
            childResource1.value = 'woop woop';
            let childResource2 = factory.newResource('org.doge', 'DogeParticipant', 'DOGE_2');
            childResource2.value = 'meep meep';
            // Stub the resolveRelationship call to return the resource.
            sinon.stub(resolver, 'resolveRelationship');
            resolver.resolveRelationship.onFirstCall().resolves(childResource1);
            resolver.resolveRelationship.onSecondCall().resolves(childResource2);
            // Create the child relationship.
            let relationship1 = factory.newRelationship('org.doge', 'DogeParticipant', 'DOGE_1');
            let relationship2 = factory.newRelationship('org.doge', 'DogeParticipant', 'DOGE_2');
            // Assign the child relationship to the parent resource.
            resource.relationships = [relationship1, relationship2];
            let cb = sinon.stub();
            let resolveState = {
                cachedResources: new Map(),
                prepare: true,
                prepareCallback: cb,
                preparePromise: Promise.resolve()
            };
            let resolvedResource;
            return resolver.resolveResourceOrConcept(resource, resolveState)
                .then((resolvedResource_) => {
                    resolvedResource = resolvedResource_;
                    sinon.assert.notCalled(resolver.resolveRelationship);
                    sinon.assert.notCalled(cb);
                    return resolvedResource.relationships[0].value;
                })
                .then((resolvedValue) => {
                    resolvedValue.should.equal('woop woop');
                    sinon.assert.calledOnce(resolver.resolveRelationship);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, resolveState.preparePromise);
                    return resolvedResource.relationships[1].value;
                })
                .then((resolvedValue) => {
                    resolvedValue.should.equal('meep meep');
                    sinon.assert.calledTwice(resolver.resolveRelationship);
                    sinon.assert.calledTwice(cb);
                    sinon.assert.calledWith(cb, resolveState.preparePromise);
                    resolveState.cachedResources.get('org.doge.DogeAsset#DOGE_1').should.equal(resolvedResource);
                });
        });

    });

    describe('#resolveArray', () => {

        it('should ignore any arrays of primitive valued properties', () => {
            return resolver.resolveArray(['hello world', 3.142], {})
                .then((newArray) => {
                    newArray.should.deep.equal(['hello world', 3.142]);
                });
        });

        it('should resolve any arrays of concept valued properties', () => {
            // We want to see what else got resolved.
            sinon.spy(resolver, 'resolveResourceOrConcept');
            // Create the child resources.
            let concept1 = factory.newConcept('org.doge', 'DogeConcept');
            let concept2 = factory.newConcept('org.doge', 'DogeConcept');
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveArray([concept1, concept2], resolveState)
                .then((newArray) => {
                    newArray.should.deep.equal([concept1, concept2]);
                    sinon.assert.calledTwice(resolver.resolveResourceOrConcept);
                    sinon.assert.calledWith(resolver.resolveResourceOrConcept, concept1);
                    sinon.assert.calledWith(resolver.resolveResourceOrConcept, concept2);
                });
        });

        it('should resolve any arrays of resource valued properties', () => {
            // We want to see what else got resolved.
            sinon.spy(resolver, 'resolveResourceOrConcept');
            // Create the child resources.
            let childResource1 = factory.newResource('org.doge', 'DogeTransaction', 'DOGE_1');
            let childResource2 = factory.newResource('org.doge', 'DogeTransaction', 'DOGE_2');
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveArray([childResource1, childResource2], resolveState)
                .then((newArray) => {
                    newArray.should.deep.equal([childResource1, childResource2]);
                    sinon.assert.calledTwice(resolver.resolveResourceOrConcept);
                    sinon.assert.calledWith(resolver.resolveResourceOrConcept, childResource1);
                    sinon.assert.calledWith(resolver.resolveResourceOrConcept, childResource2);
                });
        });

        it('should resolve any arrays of relationship valued properties', () => {
            // Create the child (resolved) resource.
            let childResource1 = factory.newResource('org.doge', 'DogeParticipant', 'DOGE_1');
            let childResource2 = factory.newResource('org.doge', 'DogeParticipant', 'DOGE_2');
            // Stub the resolveRelationship call to return the resource.
            sinon.stub(resolver, 'resolveRelationship');
            resolver.resolveRelationship.onFirstCall().resolves(childResource1);
            resolver.resolveRelationship.onSecondCall().resolves(childResource2);
            // Create the child relationship.
            let relationship1 = factory.newRelationship('org.doge', 'DogeParticipant', 'DOGE_1');
            let relationship2 = factory.newRelationship('org.doge', 'DogeParticipant', 'DOGE_2');
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveArray([relationship1, relationship2], resolveState)
                .then((newArray) => {
                    newArray.should.deep.equal([childResource1, childResource2]);
                    sinon.assert.calledTwice(resolver.resolveRelationship);
                    sinon.assert.calledWith(resolver.resolveRelationship, relationship1);
                    sinon.assert.calledWith(resolver.resolveRelationship, relationship2);
                });
        });

        it('should lazily resolve any arrays of relationship valued properties', () => {
            // Create the child (resolved) resource.
            let childResource1 = factory.newResource('org.doge', 'DogeParticipant', 'DOGE_1');
            childResource1.value = 'woop woop';
            let childResource2 = factory.newResource('org.doge', 'DogeParticipant', 'DOGE_2');
            childResource2.value = 'meep meep';
            // Stub the resolveRelationship call to return the resource.
            sinon.stub(resolver, 'resolveRelationship');
            resolver.resolveRelationship.onFirstCall().resolves(childResource1);
            resolver.resolveRelationship.onSecondCall().resolves(childResource2);
            // Create the child relationship.
            let relationship1 = factory.newRelationship('org.doge', 'DogeParticipant', 'DOGE_1');
            let relationship2 = factory.newRelationship('org.doge', 'DogeParticipant', 'DOGE_2');
            // Assign the child relationship to the parent resource.
            let cb = sinon.stub();
            let resolveState = {
                cachedResources: new Map(),
                prepare: true,
                prepareCallback: cb,
                preparePromise: Promise.resolve()
            };
            let array;
            return resolver.resolveArray([relationship1, relationship2], resolveState)
                .then((array_) => {
                    array = array_;
                    sinon.assert.notCalled(resolver.resolveRelationship);
                    sinon.assert.notCalled(cb);
                    return array[0].value;
                })
                .then((resolvedValue) => {
                    resolvedValue.should.equal('woop woop');
                    sinon.assert.calledOnce(resolver.resolveRelationship);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, resolveState.preparePromise);
                    return array[1].value;
                })
                .then((resolvedValue) => {
                    resolvedValue.should.equal('meep meep');
                    sinon.assert.calledTwice(resolver.resolveRelationship);
                    sinon.assert.calledTwice(cb);
                    sinon.assert.calledWith(cb, resolveState.preparePromise);
                });
        });

    });

    describe('#getRegistryForRelationship', () => {

        it('should look for the resource in the default asset registry', () => {
            // Create the parent relationship.
            let relationship = factory.newRelationship('org.doge', 'DogeAsset', 'DOGE_1');
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Asset', 'org.doge.DogeAsset').resolves(mockRegistry);
            return resolver.getRegistryForRelationship(relationship)
                .then((registry) => {
                    registry.should.equal(mockRegistry);
                });
        });

        it('should look for the resource in the default participant registry', () => {
            // Create the parent relationship.
            let relationship = factory.newRelationship('org.doge', 'DogeParticipant', 'DOGE_1');
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Participant', 'org.doge.DogeParticipant').resolves(mockRegistry);
            return resolver.getRegistryForRelationship(relationship)
                .then((registry) => {
                    registry.should.equal(mockRegistry);
                });
        });

        it('should look for the resource in the default transaction registry', () => {
            // Create the parent relationship.
            let relationship = factory.newRelationship('org.doge', 'DogeTransaction', 'DOGE_1');
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Transaction', 'org.doge.DogeTransaction').resolves(mockRegistry);
            return resolver.getRegistryForRelationship(relationship)
                .then((registry) => {
                    registry.should.equal(mockRegistry);
                });
        });

        it('should throw for an unsupported resource class declaration', () => {
            // Create the parent relationship.
            let relationship = factory.newRelationship('org.doge', 'DogeConcept', 'DOGE_1');
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Transaction', 'default').resolves(mockRegistry);
            (() => {
                resolver.getRegistryForRelationship(relationship);
            }).should.throw(/Unsupported class declaration type/);
        });

    });

    describe('#resolveRelationship', () => {

        it('should look for the resource in the correct registry', () => {
            // Create the parent relationship.
            let relationship = factory.newRelationship('org.doge', 'DogeAsset', 'DOGE_1');
            let mockRegistry = sinon.createStubInstance(Registry);
            sinon.stub(resolver, 'getRegistryForRelationship').withArgs(relationship).resolves(mockRegistry);
            // Create the resource it points to.
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            mockRegistry.get.withArgs('DOGE_1').resolves(resource);
            // Stub the resolveResourceOrConcept call.
            sinon.stub(resolver, 'resolveResourceOrConcept').resolves(resource);
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveRelationship(relationship, resolveState)
                .then((resource) => {
                    sinon.assert.calledOnce(resolver.getRegistryForRelationship);
                    sinon.assert.calledWith(resolver.getRegistryForRelationship, relationship);
                    resource.should.equal(resource);
                    sinon.assert.calledOnce(resolver.resolveResourceOrConcept);
                    sinon.assert.calledWith(resolver.resolveResourceOrConcept, resource);
                });
        });

        it('should not look for a cached resource', () => {
            // Create the parent relationship.
            let relationship = factory.newRelationship('org.doge', 'DogeAsset', 'DOGE_1');
            mockRegistryManager.get.withArgs('Asset', 'org.doge.DogeAsset').rejects();
            // Create the resource it points to.
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            // Stub the resolveResourceOrConcept call.
            sinon.stub(resolver, 'resolveResourceOrConcept').rejects();
            let resolveState = {
                cachedResources: new Map()
            };
            resolveState.cachedResources.set('org.doge.DogeAsset#DOGE_1', resource);
            return resolver.resolveRelationship(relationship, resolveState)
                .then((relationship) => {
                    relationship.should.equal(resource);
                    sinon.assert.notCalled(resolver.resolveResourceOrConcept);
                });
        });

        it('should not resolve the resource if option is specified', () => {
            // Create the parent relationship.
            let relationship = factory.newRelationship('org.doge', 'DogeAsset', 'DOGE_1');
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Asset', 'org.doge.DogeAsset').resolves(mockRegistry);
            // Create the resource it points to.
            let resource = factory.newResource('org.doge', 'DogeAsset', 'DOGE_1');
            mockRegistry.get.withArgs('DOGE_1').resolves(resource);
            // Stub the resolveResourceOrConcept call.
            sinon.stub(resolver, 'resolveResourceOrConcept').rejects();
            let resolveState = {
                cachedResources: new Map(),
                skipRecursion: true
            };
            return resolver.resolveRelationship(relationship, resolveState)
                .then((relationship) => {
                    relationship.should.equal(resource);
                    sinon.assert.notCalled(resolver.resolveResourceOrConcept);
                    resolveState.cachedResources.get('org.doge.DogeAsset#DOGE_1').should.equal(resource);
                });
        });

        it('should return an invalid relationship if the resource cannot be found', () => {
            // Create the parent relationship.
            let relationship = factory.newRelationship('org.doge', 'DogeAsset', 'DOGE_1');
            let mockRegistry = sinon.createStubInstance(Registry);
            sinon.stub(resolver, 'getRegistryForRelationship').withArgs(relationship).resolves(mockRegistry);
            // Create the resource it points to.
            mockRegistry.get.withArgs('DOGE_1').rejects(new Error('such error'));
            let resolveState = {
                cachedResources: new Map()
            };
            return resolver.resolveRelationship(relationship, resolveState)
                .then((resource) => {
                    sinon.assert.calledOnce(resolver.getRegistryForRelationship);
                    sinon.assert.calledWith(resolver.getRegistryForRelationship, relationship);
                    resource.should.be.an.instanceOf(InvalidRelationship);
                    (() => {
                        resource.value === true;
                    }).should.throw(/such error/);
                });
        });

    });

});
