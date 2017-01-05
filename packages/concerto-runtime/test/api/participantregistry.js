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

const ParticipantRegistry = require('../../lib/api/participantregistry');
const Registry = require('../../lib/registry');
const Resource = require('@ibm/ibm-concerto-common').Resource;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('ParticipantRegistry', () => {

    let mockRegistry;
    let participantRegistry;
    let mockResource;
    let mockResources;

    beforeEach(() => {
        mockRegistry = sinon.createStubInstance(Registry);
        participantRegistry = new ParticipantRegistry(mockRegistry);
        mockResource = sinon.createStubInstance(Resource);
        mockResources = [sinon.createStubInstance(Resource), sinon.createStubInstance(Resource)];
    });

    describe('#constructor', () => {

        it('should obscure any implementation details', () => {
            Object.isFrozen(participantRegistry).should.be.true;
            Object.getOwnPropertyNames(participantRegistry).forEach((prop) => {
                participantRegistry[prop].should.be.a('function');
            });
            Object.getOwnPropertySymbols(participantRegistry).should.have.lengthOf(0);
        });

    });

    describe('#getAll', () => {

        it('should proxy to the registry', () => {
            mockRegistry.getAll.resolves(mockResources);
            return participantRegistry.getAll()
                .then((resources) => {
                    resources.should.deep.equal(mockResources);
                });
        });

    });

    describe('#get', () => {

        it('should proxy to the registry', () => {
            mockRegistry.get.withArgs('DOGE_1').resolves(mockResource);
            return participantRegistry.get('DOGE_1')
                .then((resource) => {
                    resource.should.deep.equal(mockResource);
                });
        });

    });

    describe('#addAll', () => {

        it('should proxy to the registry', () => {
            mockRegistry.addAll.resolves();
            return participantRegistry.addAll(mockResources)
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.addAll);
                    sinon.assert.calledWith(mockRegistry.addAll, mockResources);
                });
        });

    });

    describe('#add', () => {

        it('should proxy to the registry', () => {
            mockRegistry.add.resolves();
            return participantRegistry.add(mockResource)
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.add);
                    sinon.assert.calledWith(mockRegistry.add, mockResource);
                });
        });

    });

    describe('#updateAll', () => {

        it('should proxy to the registry', () => {
            mockRegistry.updateAll.resolves();
            return participantRegistry.updateAll(mockResources)
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.updateAll);
                    sinon.assert.calledWith(mockRegistry.updateAll, mockResources);
                });
        });

    });

    describe('#update', () => {

        it('should proxy to the registry', () => {
            mockRegistry.update.resolves();
            return participantRegistry.update(mockResource)
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.update);
                    sinon.assert.calledWith(mockRegistry.update, mockResource);
                });
        });

    });

    describe('#removeAll', () => {

        it('should proxy to the registry', () => {
            mockRegistry.removeAll.resolves();
            return participantRegistry.removeAll(mockResources)
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.removeAll);
                    sinon.assert.calledWith(mockRegistry.removeAll, mockResources);
                });
        });

    });

    describe('#remove', () => {

        it('should proxy to the registry', () => {
            mockRegistry.remove.resolves();
            return participantRegistry.remove(mockResource)
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.remove);
                    sinon.assert.calledWith(mockRegistry.remove, mockResource);
                });
        });

    });

});
