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

const Api = require('../lib/api');
const Context = require('../lib/context');
const Factory = require('composer-common').Factory;

const IdentityService = require('../lib/identityservice');
const ModelManager = require('composer-common').ModelManager;
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const ResourceManager = require('../lib/resourcemanager');
const Resolver = require('../lib/resolver');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));
chai.use(require('chai-things'));
const sinon = require('sinon');


describe('IdentityManager', () => {

    let mockApi;
    let mockContext;
    let mockIdentityService;
    let mockRegistryManager;
    let mockRegistry;
    let modelManager;
    let mockResolver;
    let factory;


    let resourceManager;

    beforeEach(() => {
        mockApi = sinon.createStubInstance(Api);
        mockContext = sinon.createStubInstance(Context);
        mockIdentityService = sinon.createStubInstance(IdentityService);
        mockContext.getIdentityService.returns(mockIdentityService);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        mockResolver  = sinon.createStubInstance(Resolver);
        mockContext.getResolver.returns(mockResolver);
        mockResolver.resolve.resolves( {type:'Asset',registryId: 'a.n.other.registry'});

        mockRegistry = sinon.createStubInstance(Registry);
        mockRegistryManager.get.withArgs('Asset', 'a.n.other.registry').resolves(mockRegistry);
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme
        participant SampleParticipant identified by participantId {
            o String participantId
        }
        `);
        factory = new Factory(modelManager);
        mockContext.getFactory.returns(factory);

        resourceManager = new ResourceManager(mockContext);


    });


    describe('#goodpaths', () => {

        it('#addResources', () => {
            return resourceManager.addResources(mockApi,{registryType:'Asset',registryId: 'a.n.other.registry'})
            .then(()=>{
                sinon.assert.calledWith(mockRegistryManager.get,'Asset', 'a.n.other.registry');
            });

        } );

        it('#updateResources', () => {
            return resourceManager.updateResources(mockApi,{registryType:'Asset',registryId: 'a.n.other.registry'})
            .then(()=>{
                sinon.assert.calledWith(mockRegistryManager.get,'Asset', 'a.n.other.registry');

            });

        } );

        it('#removeResources', () => {
            return resourceManager.removeResources(mockApi,{registryType:'Asset',registryId: 'a.n.other.registry'})
            .then(()=>{

                sinon.assert.calledWith(mockRegistryManager.get,'Asset', 'a.n.other.registry');

            });

        } );

    });

});
