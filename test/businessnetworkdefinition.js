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



        // it('should be able to create a business network from a directory', () => {
        //
        //     return businessNetworkDefinition.fromDirectory(__dirname+'/data/zip/AnimalTracking-Network').then(result => {
        //         result.should.be.Buffer;
        //     });
        //
        //
        // });

        it('should be able to create business network from a ZIP archive', () => {
            let readFile = fs.readFileSync(__dirname+'/data/zip/test-archive.zip');


            return BusinessNetworkDefinition.fromArchive(readFile).then((businessNetworkDefinition) => {
                console.log('What is the final businessNetworkDefinition',businessNetworkDefinition);
                businessNetworkDefinition.should.not.be.null;
            });
        });

        it('should be able to store business network as a ZIP', () => {
            /*
             We first need to read a ZIP and create a business network.
             After we have done this, we'll be able to create a new ZIP with the contents of the business network.
            */
            let readFile = fs.readFileSync(__dirname+'/data/zip/test-archive.zip');
            return BusinessNetworkDefinition.fromArchive(readFile).then((businessNetworkDefinition) => {
                businessNetworkDefinition.should.not.be.null;
                console.log('What is the final businessNetworkDefinition definition',businessNetworkDefinition);

                return businessNetworkDefinition.toArchive().then(result => {
                    result.should.be.Buffer;
                });
            });
        });
    });
});
