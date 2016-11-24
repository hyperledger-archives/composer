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

const BusinessNetwork = require('../lib/businessnetwork');
const fs = require('fs');
require('chai').should();

describe('BusinessNetwork', () => {
    let businessNetwork;

    beforeEach(() => {
        businessNetwork = new BusinessNetwork('id', 'description');
    });

    afterEach(() => {
    });

    describe('#accessors', () => {

        it('should be able to retrieve factory', () => {
            businessNetwork.getFactory().should.not.be.null;
        });

        it('should be able to retrieve introspector', () => {
            businessNetwork.getIntrospector().should.not.be.null;
        });

        it('should be able to retrieve serializer', () => {
            businessNetwork.getSerializer().should.not.be.null;
        });

        it('should be able to retrieve script manager', () => {
            businessNetwork.getScriptManager().should.not.be.null;
        });

        it('should be able to retrieve model manager', () => {
            businessNetwork.getModelManager().should.not.be.null;
        });

        it('should be able to retrieve identifier', () => {
            businessNetwork.getIdentifier().should.not.be.null;
        });

        it('should be able to retrieve description', () => {
            businessNetwork.getDescription().should.not.be.null;
        });
    });

    describe.only('#archives', () => {



        // it('should be able to create a business network from a directory', () => {
        //
        //     return businessNetwork.fromDirectory(__dirname+'/data/zip/AnimalTracking-Network').then(result => {
        //         result.should.be.Buffer;
        //     });
        //
        //
        // });

        it('should be able to create business network from a ZIP archive', () => {
            let readFile = fs.readFileSync(__dirname+'/data/zip/test-archive.zip');


            return BusinessNetwork.fromArchive(readFile).then((businessNetwork) => {
                console.log('What is the final businessNetwork',businessNetwork);
                businessNetwork.should.not.be.null;
            });
        });

        it('should be able to store business network as a ZIP', () => {
            /*
             We first need to read a ZIP and create a business network.
             After we have done this, we'll be able to create a new ZIP with the contents of the business network.
            */
            let readFile = fs.readFileSync(__dirname+'/data/zip/test-archive.zip');
            return BusinessNetwork.fromArchive(readFile).then((businessNetwork) => {
                businessNetwork.should.not.be.null;
                console.log('What is the final businessNetwork',businessNetwork);

                return businessNetwork.toArchive().then(result => {
                    result.should.be.Buffer;
                    return fs.writeFileSync(__dirname+'/data/zip/genereatedZip-test-archive.zip',result);
                });
            });
        });
    });
});
