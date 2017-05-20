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
const ModelManager = require('composer-common').ModelManager;
const QueryExecutor = require('../lib/queryexecutor');
const Relationship = require('composer-common').Relationship;
const Resolver = require('../lib/resolver');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

let matchRelationship = function (fqi) {
    return sinon.match((value) => {
        if (value instanceof Relationship) {
            return value.getFullyQualifiedIdentifier() === fqi;
        }
        return false;
    }, `matchRelationship(${fqi})`);
};

let matchResolveState = function () {
    return sinon.match((value) => {
        return value.skipRecursion === true;
    });
};

describe('QueryExecutor', () => {

    let modelManager;
    let factory;
    let mockResolver;
    let queryExecutor;

    before(() => {
        modelManager = new ModelManager();
        factory = new Factory(modelManager);
        modelManager.addModelFile(`
        namespace org.acme
        asset SimpleAsset identified by assetId {
            o String assetId
            o String[] stringValues
        }
        asset SimpleInnerAsset identified by assetId {
            o String assetId
        }
        asset SimpleOuterAsset identified by assetId {
            o String assetId
            o SimpleInnerAsset innerAsset
            o SimpleInnerAsset[] innerAssets
        }
        asset SimpleAssetCircle identified by assetId {
            o String assetId
            --> SimpleAssetCircle next
        }
        asset SimpleAssetCircleArray identified by assetId {
            o String assetId
            --> SimpleAssetCircleArray[] next
        }`);
    });

    beforeEach(() => {
        mockResolver = sinon.createStubInstance(Resolver);
        queryExecutor = new QueryExecutor(mockResolver);
    });

    describe('#queryAll', () => {

        it('should query a primitive property', () => {
            let resource1 = factory.newResource('org.acme', 'SimpleAsset', 'CIRCLE_1');
            let resource2 = factory.newResource('org.acme', 'SimpleAsset', 'CIRCLE_2');
            let resource3 = factory.newResource('org.acme', 'SimpleAsset', 'CIRCLE_3');
            return queryExecutor.queryAll('(assetId = \'CIRCLE_1\') or (assetId = \'CIRCLE_3\')', [resource1, resource2, resource3])
                .should.eventually.be.deep.equal([true, false, true]);
        });

        it('should query a primitive array property', () => {
            let resource1 = factory.newResource('org.acme', 'SimpleAsset', 'CIRCLE_1');
            resource1.stringValues = ['THING_1', 'THING_2', 'THING_3'];
            let resource2 = factory.newResource('org.acme', 'SimpleAsset', 'CIRCLE_2');
            resource2.stringValues = ['THING_2', 'THING_3', 'THING_1'];
            let resource3 = factory.newResource('org.acme', 'SimpleAsset', 'CIRCLE_3');
            resource3.stringValues = ['THING_3', 'THING_1', 'THING_2'];
            return queryExecutor.queryAll('(stringValues[0] = \'THING_1\') or (stringValues[1] = \'THING_1\')', [resource1, resource2, resource3])
                .should.eventually.be.deep.equal([true, false, true]);
        });

        it('should query a nested resource property', () => {
            let outerResource1 = factory.newResource('org.acme', 'SimpleOuterAsset', 'CIRCLE_1');
            let innerResource1 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_1');
            outerResource1.innerAsset = innerResource1;
            let outerResource2 = factory.newResource('org.acme', 'SimpleOuterAsset', 'CIRCLE_2');
            let innerResource2 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_2');
            outerResource2.innerAsset = innerResource2;
            let outerResource3 = factory.newResource('org.acme', 'SimpleOuterAsset', 'CIRCLE_3');
            let innerResource3 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_3');
            outerResource3.innerAsset = innerResource3;
            return queryExecutor.queryAll('(innerAsset.assetId = \'THING_1\') or (innerAsset.assetId = \'THING_3\')', [outerResource1, outerResource2, outerResource3])
                .should.eventually.be.deep.equal([true, false, true]);
        });

        it('should query a nested resource array property', () => {
            let outerResource1 = factory.newResource('org.acme', 'SimpleOuterAsset', 'CIRCLE_1');
            let innerResource1 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_1');
            let innerResource2 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_2');
            let innerResource3 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_3');
            outerResource1.innerAssets = [innerResource1, innerResource2, innerResource3];
            let outerResource2 = factory.newResource('org.acme', 'SimpleOuterAsset', 'CIRCLE_1');
            innerResource1 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_2');
            innerResource2 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_3');
            innerResource3 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_1');
            outerResource2.innerAssets = [innerResource1, innerResource2, innerResource3];
            let outerResource3 = factory.newResource('org.acme', 'SimpleOuterAsset', 'CIRCLE_1');
            innerResource1 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_3');
            innerResource2 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_1');
            innerResource3 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_2');
            outerResource3.innerAssets = [innerResource1, innerResource2, innerResource3];
            return queryExecutor.queryAll('(innerAssets[0].assetId = \'THING_1\') or (innerAssets[2].assetId = \'THING_2\')', [outerResource1, outerResource2, outerResource3])
                .should.eventually.be.deep.equal([true, false, true]);
        });

        it('should query a property in a resolved relationship', () => {
            let resource1 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_1');
            let relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircle', 'CIRCLE_2');
            resource1.next = relationship1;
            let resource2 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_2');
            let relationship2 = factory.newRelationship('org.acme', 'SimpleAssetCircle', 'CIRCLE_3');
            resource2.next = relationship2;
            let resource3 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_3');
            let relationship3 = factory.newRelationship('org.acme', 'SimpleAssetCircle', 'CIRCLE_1');
            resource3.next = relationship3;
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircle#CIRCLE_2'), matchResolveState()).resolves(resource2);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircle#CIRCLE_3'), matchResolveState()).resolves(resource3);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircle#CIRCLE_1'), matchResolveState()).resolves(resource1);
            return queryExecutor.queryAll('(next.assetId = \'CIRCLE_2\') or (next.assetId = \'CIRCLE_1\')', [resource1, resource2, resource3])
                .should.eventually.be.deep.equal([true, false, true]);
        });

        it('should query a property in a deeply resolved relationship', () => {
            let resource1 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_1');
            let relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircle', 'CIRCLE_2');
            resource1.next = relationship1;
            let resource2 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_2');
            let relationship2 = factory.newRelationship('org.acme', 'SimpleAssetCircle', 'CIRCLE_3');
            resource2.next = relationship2;
            let resource3 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_3');
            let relationship3 = factory.newRelationship('org.acme', 'SimpleAssetCircle', 'CIRCLE_1');
            resource3.next = relationship3;
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircle#CIRCLE_2'), matchResolveState()).resolves(resource2);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircle#CIRCLE_3'), matchResolveState()).resolves(resource3);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircle#CIRCLE_1'), matchResolveState()).resolves(resource1);
            return queryExecutor.queryAll('(next.next.next.next.next.next.next.assetId = \'CIRCLE_2\') or (next.next.next.next.next.next.next.assetId = \'CIRCLE_1\')', [resource1, resource2, resource3])
                .should.eventually.be.deep.equal([true, false, true]);
        });

        it('should query a property in a resolved relationship array', () => {
            let resource1 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_1');
            let relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_2');
            let relationship2 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_3');
            resource1.next = [relationship1, relationship2];
            let resource2 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_2');
            relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_3');
            relationship2 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_1');
            resource2.next = [relationship1, relationship2];
            let resource3 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_3');
            relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_1');
            relationship2 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_2');
            resource3.next = [relationship1, relationship2];
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircleArray#CIRCLE_1'), matchResolveState()).resolves(resource1);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircleArray#CIRCLE_2'), matchResolveState()).resolves(resource2);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircleArray#CIRCLE_3'), matchResolveState()).resolves(resource3);
            return queryExecutor.queryAll('(next[0].assetId = \'CIRCLE_2\') or (next[1].assetId = \'CIRCLE_2\')', [resource1, resource2, resource3])
                .should.eventually.be.deep.equal([true, false, true]);
        });

        it('should query a property in a deeply resolved relationship array', () => {
            let resource1 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_1');
            let relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_2');
            let relationship2 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_3');
            let relationship3 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_1');
            resource1.next = [relationship1, relationship2, relationship3];
            let resource2 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_2');
            relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_2');
            relationship2 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_3');
            relationship3 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_1');
            resource2.next = [relationship2, relationship3, relationship1];
            let resource3 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_3');
            relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_2');
            relationship2 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_3');
            relationship3 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_1');
            resource3.next = [relationship3, relationship1, relationship2];
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircleArray#CIRCLE_1'), matchResolveState()).resolves(resource1);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircleArray#CIRCLE_2'), matchResolveState()).resolves(resource2);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircleArray#CIRCLE_3'), matchResolveState()).resolves(resource3);
            return queryExecutor.queryAll('(next[0].next[1].next[2].next[0].next[1].next[2].assetId = \'CIRCLE_1\') or (next[0].next[1].next[2].next[0].next[1].next[2].assetId = \'CIRCLE_3\')', [resource1, resource2, resource3])
                .should.eventually.be.deep.equal([true, false, true]);
        });

        it('should handle errors querying a property in a resolved relationship', () => {
            let resource1 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_1');
            let relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircle', 'CIRCLE_2');
            resource1.next = relationship1;
            let resource2 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_2');
            let relationship2 = factory.newRelationship('org.acme', 'SimpleAssetCircle', 'CIRCLE_3');
            resource2.next = relationship2;
            let resource3 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_3');
            let relationship3 = factory.newRelationship('org.acme', 'SimpleAssetCircle', 'CIRCLE_1');
            resource3.next = relationship3;
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircle#CIRCLE_2'), matchResolveState()).resolves(resource2);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircle#CIRCLE_3'), matchResolveState()).resolves(resource3);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircle#CIRCLE_1'), matchResolveState()).rejects(new Error('such error'));
            return queryExecutor.queryAll('(next.assetId = \'CIRCLE_2\') or (next.assetId = \'CIRCLE_1\')', [resource1, resource2, resource3])
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#query', () => {

        it('should query a primitive property', () => {
            let resource = factory.newResource('org.acme', 'SimpleAsset', 'CIRCLE_1');
            return queryExecutor.query('(assetId = \'CIRCLE_1\')', resource)
                .should.eventually.be.equal(true);
        });

        it('should query a primitive array property', () => {
            let resource = factory.newResource('org.acme', 'SimpleAsset', 'CIRCLE_1');
            resource.stringValues = ['THING_1', 'THING_2', 'THING_3'];
            return queryExecutor.query('(stringValues[0] = \'THING_1\')', resource)
                .should.eventually.be.equal(true);
        });

        it('should query a nested resource property', () => {
            let outerResource = factory.newResource('org.acme', 'SimpleOuterAsset', 'CIRCLE_1');
            let innerResource = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_1');
            outerResource.innerAsset = innerResource;
            return queryExecutor.query('(innerAsset.assetId = \'THING_1\')', outerResource)
                .should.eventually.be.equal(true);
        });

        it('should query a nested resource array property', () => {
            let outerResource = factory.newResource('org.acme', 'SimpleOuterAsset', 'CIRCLE_1');
            let innerResource1 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_1');
            let innerResource2 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_2');
            let innerResource3 = factory.newResource('org.acme', 'SimpleInnerAsset', 'THING_3');
            outerResource.innerAssets = [innerResource1, innerResource2, innerResource3];
            return queryExecutor.query('(innerAssets[0].assetId = \'THING_1\') and (innerAssets[2].assetId = \'THING_3\')', outerResource)
                .should.eventually.be.equal(true);
        });

        it('should query a property in a resolved relationship', () => {
            let resource1 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_1');
            let relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircle', 'CIRCLE_2');
            resource1.next = relationship1;
            let resource2 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_2');
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircle#CIRCLE_2'), matchResolveState()).resolves(resource2);
            return queryExecutor.query('(next.assetId = \'CIRCLE_2\') or (next.assetId = \'CIRCLE_1\')', resource1)
                .should.eventually.be.equal(true);
        });

        it('should query a property in a deeply resolved relationship', () => {
            let resource1 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_1');
            let relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircle', 'CIRCLE_2');
            resource1.next = relationship1;
            let resource2 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_2');
            let relationship2 = factory.newRelationship('org.acme', 'SimpleAssetCircle', 'CIRCLE_3');
            resource2.next = relationship2;
            let resource3 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_3');
            let relationship3 = factory.newRelationship('org.acme', 'SimpleAssetCircle', 'CIRCLE_1');
            resource3.next = relationship3;
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircle#CIRCLE_2'), matchResolveState()).resolves(resource2);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircle#CIRCLE_3'), matchResolveState()).resolves(resource3);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircle#CIRCLE_1'), matchResolveState()).resolves(resource1);
            return queryExecutor.query('(next.next.next.next.next.next.next.assetId = \'CIRCLE_2\')', resource1)
                .should.eventually.be.equal(true);
        });

        it('should query a property in a resolved relationship array', () => {
            let resource1 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_1');
            let relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_2');
            let relationship2 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_3');
            resource1.next = [relationship1, relationship2];
            let resource2 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_2');
            let resource3 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_3');
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircleArray#CIRCLE_2'), matchResolveState()).resolves(resource2);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircleArray#CIRCLE_3'), matchResolveState()).resolves(resource3);
            return queryExecutor.query('(next[0].assetId = \'CIRCLE_2\') and (next[1].assetId = \'CIRCLE_3\')', resource1)
                .should.eventually.be.equal(true);
        });

        it('should query a property in a deeply resolved relationship array', () => {
            let resource1 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_1');
            let relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_2');
            let relationship2 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_3');
            let relationship3 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_1');
            resource1.next = [relationship1, relationship2, relationship3];
            let resource2 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_2');
            relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_2');
            relationship2 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_3');
            relationship3 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_1');
            resource2.next = [relationship2, relationship3, relationship1];
            let resource3 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_3');
            relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_2');
            relationship2 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_3');
            relationship3 = factory.newRelationship('org.acme', 'SimpleAssetCircleArray', 'CIRCLE_1');
            resource3.next = [relationship3, relationship1, relationship2];
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircleArray#CIRCLE_2'), matchResolveState()).resolves(resource2);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircleArray#CIRCLE_3'), matchResolveState()).resolves(resource3);
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircleArray#CIRCLE_1'), matchResolveState()).resolves(resource1);
            return queryExecutor.query('(next[0].next[1].next[2].next[0].next[1].next[2].assetId = \'CIRCLE_1\')', resource1)
                .should.eventually.be.equal(true);
        });

        it('should handle errors querying a property in a resolved relationship', () => {
            let resource1 = factory.newResource('org.acme', 'SimpleAssetCircle', 'CIRCLE_1');
            let relationship1 = factory.newRelationship('org.acme', 'SimpleAssetCircle', 'CIRCLE_2');
            resource1.next = relationship1;
            mockResolver.resolveRelationship.withArgs(matchRelationship('org.acme.SimpleAssetCircle#CIRCLE_2'), matchResolveState()).rejects(new Error('such error'));
            return queryExecutor.query('(next.assetId = \'CIRCLE_2\') or (next.assetId = \'CIRCLE_1\')', resource1)
                .should.be.rejectedWith(/such error/);
        });

    });

});
