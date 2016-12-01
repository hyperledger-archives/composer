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

const Api = require('../lib/api');
const Factory = require('@ibm/ibm-concerto-common').Factory;
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('Api', () => {

    let mockFactory;
    let mockRegistryManager;
    let api;

    beforeEach(() => {
        mockFactory = sinon.createStubInstance(Factory);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        api = new Api(mockFactory, mockRegistryManager);
    });

    describe('#getFactory', () => {

        it('should return the factory', () => {
            api.getFactory().should.equal(mockFactory);
        });

    });

    describe('#getAssetRegistry', () => {

        it('should return the specified asset registry', () => {
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Asset', 'org.doge.Doge').resolves(mockRegistry);
            return api.getAssetRegistry('org.doge.Doge')
                .should.eventually.be.equal(mockRegistry);
        });

        it('should handle any errors', () => {
            mockRegistryManager.get.withArgs('Asset', 'org.doge.Doge').rejects(new Error('wow such error'));
            return api.getAssetRegistry('org.doge.Doge')
                .should.be.rejectedWith(/wow such error/);
        });

    });

});
