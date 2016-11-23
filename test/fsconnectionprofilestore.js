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

const FSConnectionProfileStore = require('../lib/fsconnectionprofilestore');

const homedir = require('homedir');
const fs = require('fs');
const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('FSConnectionProfileStore', () => {

    describe('#loadConnectionProfile', () => {

        it('should save and load data', () => {

            let cps = new FSConnectionProfileStore(fs);
            const profileData = { one : 'one', two: 'two'};
            return cps.save('test', profileData )
                .then(() => {
                    fs.statSync( homedir() + '/concerto-connection-profiles/test/connection.json');
                    return cps.load('test');
                })
                .then((loadedProfile) => {
                    loadedProfile.should.deep.equal(profileData);
                });
        });

        describe('#fs errors', () => {

            let cps = null;
            let readfileStub = null;
            let writefileStub = null;

            beforeEach(function() {
                readfileStub = sinon.stub(fs, 'readFile');
                readfileStub.yields( new Error('my fs read error') );

                writefileStub = sinon.stub(fs, 'writeFile');
                writefileStub.yields( new Error('my fs write error') );

                cps = new FSConnectionProfileStore(fs);
            });

            afterEach(function() {
                readfileStub.restore();
                writefileStub.restore();
            });


            it('should handle fs read errors', () => {
                return cps.load( 'test' )
              .then(() => {
                  false.should.be.true;
              })
              .catch((err) => {
                  err.message.should.equal('Failed to load connection profile test');
              });
            });

            it('should handle fs write errors', () => {
                return cps.save( 'test', {one: 'one'} )
              .then(() => {
                  false.should.be.true;
              })
              .catch((err) => {
                  err.message.should.equal('Failed to save connection profile test');
              });
            });

        });
    });
});
