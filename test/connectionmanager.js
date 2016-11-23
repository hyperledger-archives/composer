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

const ConnectionManager = require('../lib/connectionmanager');
//const BrowserFS = require('../node_modules/browserfs/dist/node');
//const BrowserFS = require('browserfs');
const fs = require('fs');
const homedir = require('homedir');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('ConnectionManager', () => {

    describe('#connect', () => {

        it('should throw as abstract method', () => {

            // let mfs = new BrowserFS.FileSystem.MountableFileSystem();
            // mfs.mount('/concerto-connections/', new BrowserFS.FileSystem.InMemory());
            let cm = new ConnectionManager(fs);
            return cm.connect('profile', 'network')
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });
    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            let cm = new ConnectionManager(fs);
            cm.toJSON().should.deep.equal({});
        });
    });

    describe('#lifecycle', () => {

        const cm = new ConnectionManager(fs);
        let connectStub;
        const connectionOptions = {one: 'foo'};

        beforeEach(function() {
            connectStub = sinon.stub(cm, 'connect');
            connectStub.returns(null);
        });

        afterEach(function() {
            connectStub.restore();
        });

        it('should update connection profile file for business network', () => {
            return cm.saveConnectionProfile( 'test', connectionOptions )
              .then(() => {
                  fs.statSync( homedir() + '/concerto-connection-profiles/test/connection.json');
                  return cm.loadConnectionProfile( 'test' );
              })
              .then((profile) => {
                  profile.should.deep.equals(connectionOptions);
                  return cm.connect( 'test', connectionOptions);
              })
              .then(() => {
                  return connectStub.calledOnce.should.be.true;
              })
              .then(() => {
                  return cm.saveBusinessNetworkRuntimeIdentifier('test', 'MyBusinessNetwork', '123');
              })
              .then(() => {
                  return cm.saveBusinessNetworkRuntimeIdentifier('test', 'MyOtherBusinessNetwork', '456');
              })
              .then(() => {
                  return cm.loadConnectionProfile( 'test' );
              })
              .then((profile) => {
                  connectionOptions.networks =
                  { MyBusinessNetwork : '123',
                      MyOtherBusinessNetwork : '456'
                  };
                  profile.should.deep.equals(connectionOptions);
                  return cm.connect( 'test', 'MyBusinessNetwork');
              });
        });

        describe('#fs errors', () => {

            const cm = new ConnectionManager(fs);
            //const connectionOptions = {one: 'foo'};
            let connectStub;
            let readfileStub;
            let writefileStub;

            beforeEach(function() {
                connectStub = sinon.stub(cm, 'connect');
                connectStub.returns(null);

                readfileStub = sinon.stub(fs, 'readFile');
                readfileStub.yields( new Error('my fs error') );

                writefileStub = sinon.stub(fs, 'writeFile');
                writefileStub.yields( new Error('my fs error') );
            });

            afterEach(function() {
                connectStub.restore();
                readfileStub.restore();
                writefileStub.restore();
            });


            it('should handle fs read errors', () => {
                return cm.loadConnectionProfile( 'test' )
              .then(() => {
                  false.should.be.true;
              })
              .catch((err) => {
                  err.message.should.equal('my fs error');
              });
            });

            /*
            it('should handle fs write errors', () => {
                return cm.saveConnectionProfile( 'test', connectionOptions )
              .then(() => {
                  false.should.be.true;
              })
              .catch((err) => {
                  err.message.should.equal('my fs error');
              });
            });
            */

        });
    });
});
