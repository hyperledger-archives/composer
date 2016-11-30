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

const BusinessNetworkDefinition = require('../lib/businessnetworkdefinition');
const fs = require('fs');
require('chai').should();
describe('BusinessNetworkDefinition', () => {
    let businessNetworkDefinition;

    beforeEach(() => {
        businessNetworkDefinition = new BusinessNetworkDefinition('id', 'description');
    });

    afterEach(() => {
    });

    describe('#accessors', () => {

        it('should be able to retrieve factory', () => {
            businessNetworkDefinition.getFactory().should.not.be.null;
        });

        it('should be able to retrieve introspector', () => {
            businessNetworkDefinition.getIntrospector().should.not.be.null;
        });

        it('should be able to retrieve serializer', () => {
            businessNetworkDefinition.getSerializer().should.not.be.null;
        });

        it('should be able to retrieve script manager', () => {
            businessNetworkDefinition.getScriptManager().should.not.be.null;
        });

        it('should be able to retrieve model manager', () => {
            businessNetworkDefinition.getModelManager().should.not.be.null;
        });

        it('should be able to retrieve identifier', () => {
            businessNetworkDefinition.getIdentifier().should.not.be.null;
        });

        it('should be able to retrieve description', () => {
            businessNetworkDefinition.getDescription().should.not.be.null;
        });
    });

    describe('#archives', () => {



        it('should be able to correctly create a business network from a directory', () => {

            return businessNetworkDefinition.fromDirectory(__dirname+'/data/zip/test-archive').then(businessNetwork => {
                businessNetwork.should.be.BusinessNetworkDefinition;
                businessNetwork.identifier.should.equal('@ibm/test-archive-0.0.1');
                businessNetwork.description.should.equal('A test business network.');
                Object.keys(businessNetwork.modelManager.modelFiles).should.have.length(3);
                Object.keys(businessNetwork.scriptManager.scripts).should.have.length(2);
            });
        });

        it('should be able to create a ZIP archive from a directory (using fromDirectory and toArchive)', () => {

            return businessNetworkDefinition.fromDirectory(__dirname+'/data/zip/test-archive').then(businessNetwork => {
                return businessNetwork.toArchive().then(buffer => {
                    buffer.should.be.Buffer;
                });
            });
        });


        it('should be able to correctly create business network from a ZIP archive', () => {
            let readFile = fs.readFileSync(__dirname+'/data/zip/test-archive.zip');
            return BusinessNetworkDefinition.fromArchive(readFile).then((businessNetwork) => {
                businessNetwork.should.be.BusinessNetworkDefinition;
                businessNetwork.identifier.should.equal('@ibm/test-archive-0.0.1');
                businessNetwork.description.should.equal('A test business network.');
                Object.keys(businessNetwork.modelManager.modelFiles).should.have.length(3);
                Object.keys(businessNetwork.scriptManager.scripts).should.have.length(2);
            });
        });

        it('should be able to store business network as a ZIP archive (using fromArchive and toArchive)', () => {
            /*
             We first need to read a ZIP and create a business network.
             After we have done this, we'll be able to create a new ZIP with the contents of the business network.
            */
            let readFile = fs.readFileSync(__dirname+'/data/zip/test-archive.zip');
            return BusinessNetworkDefinition.fromArchive(readFile).then((businessNetwork) => {
                businessNetwork.should.be.BusinessNetworkDefinition;
                businessNetwork.identifier.should.equal('@ibm/test-archive-0.0.1');
                businessNetwork.description.should.equal('A test business network.');
                Object.keys(businessNetwork.modelManager.modelFiles).should.have.length(3);
                Object.keys(businessNetwork.scriptManager.scripts).should.have.length(2);

                return businessNetwork.toArchive().then(buffer => {
                    buffer.should.be.Buffer;
                });
            });
        });
    });
});
