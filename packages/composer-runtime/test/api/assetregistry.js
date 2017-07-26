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

const AssetRegistry = require('../../lib/api/assetregistry');
const Registry = require('../../lib/registry');
const Resource = require('composer-common').Resource;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');


describe('AssetRegistry', () => {

    let mockRegistry;
    let assetRegistry;
    let mockResource;
    let mockResources;

    beforeEach(() => {
        mockRegistry = sinon.createStubInstance(Registry);
        assetRegistry = new AssetRegistry(mockRegistry);
        mockResource = sinon.createStubInstance(Resource);
        mockResources = [sinon.createStubInstance(Resource), sinon.createStubInstance(Resource)];
    });

    describe('#constructor', () => {

        it('should obscure any implementation details', () => {
            Object.isFrozen(assetRegistry).should.be.true;
            Object.getOwnPropertyNames(assetRegistry).forEach((prop) => {
                assetRegistry[prop].should.be.a('function');
            });
            Object.getOwnPropertySymbols(assetRegistry).should.have.lengthOf(0);
        });

    });

    describe('#getAll', () => {

        it('should proxy to the registry', () => {
            mockRegistry.getAll.resolves(mockResources);
            return assetRegistry.getAll()
                .then((resources) => {
                    resources.should.deep.equal(mockResources);
                });
        });

    });

    describe('#get', () => {

        it('should proxy to the registry', () => {
            mockRegistry.get.withArgs('DOGE_1').resolves(mockResource);
            return assetRegistry.get('DOGE_1')
                .then((resource) => {
                    resource.should.deep.equal(mockResource);
                });
        });

    });

    describe('#exists', () => {

        it('should proxy to the registry', () => {
            mockRegistry.exists.withArgs('DOGE_1').resolves(true);
            return assetRegistry.exists('DOGE_1')
                .then((exists) => {
                    exists.should.be.true;
                });
        });

    });

    describe('#addAll', () => {

        it('should proxy to the registry', () => {
            mockRegistry.addAll.resolves();
            return assetRegistry.addAll(mockResources)
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.addAll);
                    sinon.assert.calledWith(mockRegistry.addAll, mockResources);
                });
        });

    });

    describe('#add', () => {

        it('should proxy to the registry', () => {
            mockRegistry.add.resolves();
            return assetRegistry.add(mockResource)
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.add);
                    sinon.assert.calledWith(mockRegistry.add, mockResource);
                });
        });

    });

    describe('#updateAll', () => {

        it('should proxy to the registry', () => {
            mockRegistry.updateAll.resolves();
            return assetRegistry.updateAll(mockResources)
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.updateAll);
                    sinon.assert.calledWith(mockRegistry.updateAll, mockResources);
                });
        });

    });

    describe('#update', () => {

        it('should proxy to the registry', () => {
            mockRegistry.update.resolves();
            return assetRegistry.update(mockResource)
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.update);
                    sinon.assert.calledWith(mockRegistry.update, mockResource);
                });
        });

    });

    describe('#removeAll', () => {

        it('should proxy to the registry', () => {
            mockRegistry.removeAll.resolves();
            return assetRegistry.removeAll(mockResources)
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.removeAll);
                    sinon.assert.calledWith(mockRegistry.removeAll, mockResources);
                });
        });

    });

    describe('#remove', () => {

        it('should proxy to the registry', () => {
            mockRegistry.remove.resolves();
            return assetRegistry.remove(mockResource)
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.remove);
                    sinon.assert.calledWith(mockRegistry.remove, mockResource);
                });
        });

    });

});
