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

const Factory = require('../../lib/api/factory');
const realFactory = require('composer-common').Factory;
const Relationship = require('composer-common').Relationship;
const Resource = require('composer-common').Resource;
const Concept = require('composer-common').Concept;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');


describe('Factory', () => {

    let mockFactory;
    let factory;
    let mockRelationship;
    let mockResource;
    let mockConcept;

    beforeEach(() => {
        mockFactory = sinon.createStubInstance(realFactory);
        factory = new Factory(mockFactory);
        mockRelationship = sinon.createStubInstance(Relationship);
        mockResource = sinon.createStubInstance(Resource);
        mockConcept = sinon.createStubInstance(Concept);
    });

    describe('#constructor', () => {

        it('should obscure any implementation details', () => {
            Object.isFrozen(factory).should.be.true;
            Object.getOwnPropertyNames(factory).forEach((prop) => {
                factory[prop].should.be.a('function');
            });
            Object.getOwnPropertySymbols(factory).should.have.lengthOf(0);
        });

    });

    describe('#newResource', () => {

        it('should proxy to the factory', () => {
            mockFactory.newResource.withArgs('org.acme', 'Doge', 'DOGE_1').returns(mockResource);
            factory.newResource('org.acme', 'Doge', 'DOGE_1').should.equal(mockResource);
        });

    });

    describe('#newRelationship', () => {

        it('should proxy to the factory', () => {
            mockFactory.newRelationship.withArgs('org.acme', 'Doge', 'DOGE_1').returns(mockRelationship);
            factory.newRelationship('org.acme', 'Doge', 'DOGE_1').should.equal(mockRelationship);
        });

    });

    describe('#newConcept', () => {

        it('should proxy to the factory', () => {
            mockFactory.newConcept.withArgs('org.acme', 'Doge').returns(mockConcept);
            factory.newConcept('org.acme', 'Doge').should.equal(mockConcept);
        });

    });

    describe('#newEvent', () => {

        it('should proxy to the factory', () => {
            mockFactory.newEvent.withArgs('org.acme', 'Doge').returns(mockResource);
            factory.newEvent('org.acme', 'Doge').should.equal(mockResource);
        });

    });

});
